// The GraphQL mock behind every e2e test. All app data flows through a single
// endpoint (src/utils/runQuery.ts), so one route interceptor can answer the
// whole UI from fixtures. Operations are recognized by distinctive substrings
// of the query text (the app's queries are anonymous), and session mutations
// update mock state so auth flows behave like the real backend.
import { test as base, type Route } from '@playwright/test';
import * as data from './data';

export type OperationKey =
	| 'authenticated-item'
	| 'begin-session'
	| 'end-session'
	| 'all-players'
	| 'all-teams'
	| 'team-options'
	| 'contracts-by-team-id'
	| 'contracts-by-team-abbr'
	| 'rfas'
	| 'stats-by-player'
	| 'all-bids'
	| 'new-bid'
	| 'update-bid'
	| 'delete-bid'
	| 'request-token'
	| 'reset-pass'
	| 'create-contract'
	| 'update-contract'
	| 'delete-contract'
	| 'league-settings';

// Order matters only where fragments could overlap; each regex must uniquely
// identify one query in src/utils/queries.ts.
const OPERATION_MATCHERS: Array<[OperationKey, RegExp]> = [
	['begin-session', /authenticateUserWithPassword/],
	['end-session', /endSession/],
	['authenticated-item', /authenticatedItem/],
	['league-settings', /leagueSetting\s*\{/],
	['all-players', /playersCount/],
	['all-bids', /pending:\s*bids/],
	['new-bid', /createBid/],
	['update-bid', /updateBid/],
	['delete-bid', /deleteBid/],
	['request-token', /sendUserPasswordResetLink/],
	['reset-pass', /redeemUserPasswordResetToken/],
	['create-contract', /createContract/],
	['update-contract', /updateContract/],
	['delete-contract', /deleteContract/],
	['stats-by-player', /fullStats/],
	['rfas', /"rfa"/],
	['contracts-by-team-id', /\$id:\s*ID!/],
	['contracts-by-team-abbr', /\$abbr:\s*String!/],
	['team-options', /espn_id:\s*asc/],
	['all-teams', /percentage:\s*desc/]
];

export function matchOperation(query: string): OperationKey | null {
	for (const [operation, pattern] of OPERATION_MATCHERS) {
		if (pattern.test(query)) return operation;
	}
	return null;
}

type Vars = Record<string, unknown>;
type Responder = (variables: Vars) => object;

interface PlayerFilters {
	name?: { contains?: string };
	position?: { in?: string[] };
	team?: { in?: string[] };
	isRookie?: { equals?: boolean };
	contract?: { status?: { in?: string[] } };
	NOT?: { contract?: { status?: { in?: string[] } } };
}

interface RecordedCall {
	operation: OperationKey;
	variables: Vars;
}

export class MockApi {
	readonly calls: RecordedCall[] = [];
	user: data.MockUser | null = data.users.owner;
	rulebookAvailable = true;
	leagueSettings = {
		bid_deadlines: [data.nextBidDeadline()],
		phase: 'active',
		season: 2026
	};

	private overrides = new Map<OperationKey, Responder>();

	/** Replace the default response for one operation (call before the page requests it). */
	respond(operation: OperationKey, responder: Responder) {
		this.overrides.set(operation, responder);
	}

	logInAs(kind: 'owner' | 'admin' | null) {
		this.user = kind ? data.users[kind] : null;
	}

	setPhase(phase: string) {
		this.leagueSettings.phase = phase;
	}

	callsTo(operation: OperationKey): RecordedCall[] {
		return this.calls.filter((call) => call.operation === operation);
	}

	lastCallTo(operation: OperationKey): RecordedCall | undefined {
		return this.callsTo(operation).at(-1);
	}

	/** Wait until the page has issued `count` requests for the operation; returns the last one. */
	async waitForCall(operation: OperationKey, count = 1): Promise<RecordedCall> {
		const deadline = Date.now() + 10_000;
		while (this.callsTo(operation).length < count) {
			if (Date.now() > deadline) {
				throw new Error(
					`Timed out waiting for GraphQL call #${count} to "${operation}". ` +
						`Seen so far: ${this.calls.map((c) => c.operation).join(', ') || '(none)'}`
				);
			}
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
		return this.callsTo(operation)[count - 1];
	}

	async handleGraphQL(route: Route) {
		const post = route.request().postDataJSON() as { query?: string; variables?: Vars } | null;
		const operation = matchOperation(post?.query ?? '');

		if (!operation) {
			return route.fulfill({
				json: {
					data: null,
					errors: [
						{ message: `e2e mock: unrecognized GraphQL query: ${post?.query?.slice(0, 120)}` }
					]
				}
			});
		}

		const variables = post?.variables ?? {};
		this.calls.push({ operation, variables });

		const override = this.overrides.get(operation);
		const json = override ? override(variables) : this.defaultResponse(operation, variables);
		return route.fulfill({ json });
	}

	private defaultResponse(operation: OperationKey, variables: Vars): object {
		switch (operation) {
			case 'authenticated-item':
				return {
					data: {
						authenticatedItem: this.user
							? {
									id: this.user.id,
									name: this.user.name,
									isAdmin: this.user.isAdmin,
									team: {
										name: this.user.team.name,
										abbreviation: this.user.team.abbreviation,
										id: this.user.team.id
									}
								}
							: null
					}
				};

			case 'begin-session': {
				this.user = data.users.owner;
				return {
					data: {
						authenticateUserWithPassword: {
							item: {
								id: this.user.id,
								isAdmin: this.user.isAdmin,
								name: this.user.name,
								team: { id: this.user.team.id }
							}
						}
					}
				};
			}

			case 'end-session':
				this.user = null;
				return { data: { endSession: true } };

			case 'league-settings':
				return { data: { leagueSetting: this.leagueSettings } };

			case 'all-players':
				return this.resolvePlayers(variables);

			case 'all-teams':
				return { data: { teams: data.leagueStandings } };

			case 'team-options':
				return {
					data: {
						teams: Object.values(data.teams).map(({ name, espn_id }) => ({ name, espn_id }))
					}
				};

			case 'contracts-by-team-id': {
				const rosters: Record<string, data.MockContract[]> = {
					[data.teams.scranton.id]: data.scrantonRoster,
					[data.teams.nashville.id]: data.nashvilleRoster
				};
				const id = variables.id as string;
				return {
					data: {
						contracts: rosters[id] ?? [],
						team:
							id === data.teams.scranton.id
								? { name: data.teams.scranton.name, contractTotals: data.contractTotals.scranton }
								: { name: data.teams.nashville.name, contractTotals: data.contractTotals.nashville }
					}
				};
			}

			case 'contracts-by-team-abbr': {
				const abbr = variables.abbr as string;
				const byAbbr: Record<string, { team: data.MockTeam; roster: data.MockContract[] }> = {
					SCR: { team: data.teams.scranton, roster: data.scrantonRoster },
					NSH: { team: data.teams.nashville, roster: data.nashvilleRoster }
				};
				const match = byAbbr[abbr];
				if (!match) return { data: { contracts: [], team: null } };
				return {
					data: {
						contracts: match.roster,
						team: {
							id: match.team.id,
							name: match.team.name,
							contractTotals:
								match.team.id === data.teams.scranton.id
									? data.contractTotals.scranton
									: data.contractTotals.nashville
						}
					}
				};
			}

			case 'rfas':
				return { data: { contracts: data.rfaContracts } };

			case 'stats-by-player':
				return { data: { player: null } };

			case 'all-bids':
				return { data: { pending: data.pendingBids, published: data.publishedBids } };

			case 'new-bid':
				return { data: { createBid: { created: '2026-07-19T12:00:00.000Z' } } };

			case 'update-bid': {
				const bid = this.findBid(variables);
				const changes = (variables.data ?? {}) as { salary?: number; years?: number };
				return {
					data: {
						updateBid: {
							player: bid.player,
							salary: changes.salary ?? bid.salary,
							team: { name: bid.team.name },
							years: changes.years ?? bid.years
						}
					}
				};
			}

			case 'delete-bid': {
				const bid = this.findBid(variables);
				return {
					data: {
						deleteBid: {
							salary: bid.salary,
							years: bid.years,
							team: { name: bid.team.name },
							player: bid.player
						}
					}
				};
			}

			case 'request-token':
				return { data: { sendUserPasswordResetLink: true } };

			case 'reset-pass':
				return { data: { redeemUserPasswordResetToken: null } };

			case 'create-contract': {
				const input = (variables.data ?? {}) as {
					salary?: number;
					player?: { connect?: { espn_id?: number } };
					team?: { connect?: { espn_id?: number } };
				};
				const team = Object.values(data.teams).find(
					(t) => t.espn_id === input.team?.connect?.espn_id
				);
				const rfa = data.rfaContracts.find(
					(c) => c.player.espn_id === input.player?.connect?.espn_id
				);
				return {
					data: {
						createContract: {
							salary: input.salary ?? 0,
							team: { name: team?.name ?? 'Unknown Team' },
							player: {
								name: rfa?.player.name ?? 'Unknown Player',
								position: rfa?.player.position ?? '??',
								team: rfa?.player.team ?? '??'
							}
						}
					}
				};
			}

			case 'update-contract': {
				const contract = this.findContract(variables);
				const changes = (variables.data ?? {}) as { status?: string; years?: number };
				return {
					data: {
						updateContract: {
							player: {
								name: contract.player.name,
								position: contract.player.position,
								team: contract.player.team
							},
							status: changes.status ?? contract.status,
							salary: contract.salary,
							years: changes.years ?? contract.years
						}
					}
				};
			}

			case 'delete-contract': {
				const contract = this.findContract(variables);
				return {
					data: {
						deleteContract: {
							id: contract.id,
							player: {
								name: contract.player.name,
								position: contract.player.position,
								team: contract.player.team
							},
							salary: contract.salary,
							years: contract.years,
							status: contract.status
						}
					}
				};
			}
		}
	}

	private resolvePlayers(variables: Vars): object {
		const take = (variables.take as number) ?? 25;
		const skip = (variables.skip as number) ?? 0;
		const filters = (variables.filters ?? {}) as PlayerFilters;
		const rawOrder = variables.order as
			| Record<string, 'asc' | 'desc'>
			| Array<Record<string, 'asc' | 'desc'>>;

		let list = [...data.players];

		const nameContains = filters.name?.contains?.toLowerCase();
		if (nameContains) {
			list = list.filter((p) => p.name.toLowerCase().includes(nameContains));
		}
		if (filters.position?.in) {
			list = list.filter((p) => filters.position!.in!.includes(p.position));
		}
		if (filters.team?.in) {
			list = list.filter((p) => filters.team!.in!.includes(p.team));
		}
		if (filters.isRookie) {
			list = list.filter((p) => p.isRookie === filters.isRookie!.equals);
		}
		const takenStatuses = filters.contract?.status?.in;
		if (takenStatuses) {
			list = list.filter((p) => p.contract && takenStatuses.includes(p.contract.status));
		}
		const excludedStatuses = filters.NOT?.contract?.status?.in;
		if (excludedStatuses) {
			list = list.filter((p) => !p.contract || !excludedStatuses.includes(p.contract.status));
		}

		const orderEntry = Array.isArray(rawOrder) ? rawOrder[0] : rawOrder;
		const [orderKey, orderDir] = Object.entries(orderEntry ?? { pointsThisYearProj: 'desc' })[0];
		list.sort((a, b) => {
			const left = a[orderKey as keyof data.MockPlayer] as number;
			const right = b[orderKey as keyof data.MockPlayer] as number;
			return orderDir === 'asc' ? left - right : right - left;
		});

		return {
			data: {
				playersCount: list.length,
				players: list.slice(skip, skip + take)
			}
		};
	}

	private findBid(variables: Vars) {
		const where = (variables.where ?? {}) as { id?: string };
		const bid = data.pendingBids.find((b) => b.id === where.id);
		if (!bid) throw new Error(`e2e mock: no pending bid with id "${where.id}"`);
		return bid;
	}

	private findContract(variables: Vars) {
		const where = (variables.where ?? {}) as { id?: string };
		const contract = [...data.scrantonRoster, ...data.nashvilleRoster, ...data.rfaContracts].find(
			(c) => c.id === where.id
		);
		if (!contract) throw new Error(`e2e mock: no contract with id "${where.id}"`);
		return contract;
	}
}

// Test fixture: block every request that would leave the machine, stub the
// external services the UI talks to (GraphQL API, GitHub rulebook, fonts), and
// hand the test a MockApi it can inspect and reconfigure. Routes registered
// later win, so the catch-all goes first.
export const test = base.extend<{ api: MockApi }>({
	api: [
		async ({ context, baseURL }, use) => {
			const api = new MockApi();

			await context.route('**/*', (route) => {
				const url = route.request().url();
				if (baseURL && url.startsWith(baseURL)) return route.continue();
				if (url.startsWith('data:')) return route.continue();
				return route.abort('blockedbyclient');
			});

			await context.route('https://fonts.bunny.net/**', (route) =>
				route.fulfill({ body: '/* fonts stubbed for e2e */', contentType: 'text/css' })
			);

			await context.route('https://api.github.com/repos/the-log/rulebook/**', (route) => {
				if (!api.rulebookAvailable) {
					return route.fulfill({ status: 403, json: { message: 'API rate limit exceeded' } });
				}
				return route.fulfill({ json: data.rulebookToc });
			});

			await context.route('https://raw.githubusercontent.com/the-log/rulebook/**', (route) => {
				const name = route.request().url().split('/').pop() ?? '';
				const chapter = data.rulebookChapters[name];
				if (!chapter) return route.fulfill({ status: 404, body: 'Not Found' });
				return route.fulfill({ body: chapter, contentType: 'text/plain' });
			});

			await context.route('**/api/graphql', (route) => api.handleGraphQL(route));

			await use(api);
		},
		{ auto: true }
	]
});

export { expect } from '@playwright/test';
