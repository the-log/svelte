<script lang="ts">
	import formatMoney from '../utils/formatMoney';
	import objByProperty from '../utils/objByProperty';
	import runQuery from '../utils/runQuery';
	import queries from '../utils/queries';
	import type { Contract, RosterRow } from '../types/defs';
	import { userStore } from '../misc/stores';
	import TeamTable from '../components/tables/TeamTable.svelte';
	import { onDestroy, onMount } from 'svelte';

	let team = $state('');
	let active: RosterRow[] = $state([]);
	let dts: RosterRow[] = $state([]);
	let ir: RosterRow[] = $state([]);
	let waived: RosterRow[] = $state([]);

	function processContracts(contracts: Contract[]): RosterRow[] {
		return contracts
			.sort(objByProperty.bind({ path: 'player.positionRankProj', dir: 'asc' }))
			.sort(objByProperty.bind({ path: 'player.positionWeight', dir: 'asc' }))
			.map((contract: Contract) => {
				const { id, player, status: contractStatus, years, salary, needsAttention } = contract;
				const {
					name,
					team,
					position,
					espn_id,
					injuryStatus,
					pointsThisYearProj,
					positionRankProj
				} = player;

				return {
					contract_id: id,
					name,
					team,
					position,
					salary,
					salaryFormatted: formatMoney(salary),
					years,
					espn_id,
					playerStatus: injuryStatus.toLowerCase(),
					contractStatus: contractStatus.toLowerCase(),
					pointsThisYearProj,
					positionRankProj,
					needsAttention
				};
			});
	}

	function getContracts(teamID: string) {
		if (teamID) {
			runQuery(queries['contracts-by-team-id'], { id: teamID }).then(({ data }) => {
				active = processContracts(data.contracts.filter((c) => c.status === 'active'));
				dts = processContracts(data.contracts.filter((c) => c.status === 'dts'));
				ir = processContracts(data.contracts.filter((c) => c.status === 'ir'));
				waived = processContracts(data.contracts.filter((c) => c.status === 'waived'));
			});
		}
	}

	const unsubscribeUser = userStore.subscribe((value) => {
		if (!value) return null;

		const { teamID } = value;
		team = teamID;
		getContracts(teamID);
	});
	onDestroy(unsubscribeUser);

	onMount(() => {
		const updater = () => {
			getContracts(team);
		};
		window.addEventListener('action-taken', updater);

		return () => {
			window.removeEventListener('action-taken', updater);
		};
	});
</script>

<svelte:head>
	<title>My Team — The League of Ordinary Gentlemen</title>
</svelte:head>

<TeamTable {team} players={active} title="Active" />
<TeamTable {team} players={dts} title="Practice Squad" />
<TeamTable {team} players={ir} title="Injured Reserve" />
<TeamTable {team} players={waived} title="Waived" />
