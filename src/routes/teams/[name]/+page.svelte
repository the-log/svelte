<script lang="ts">
	import { page } from '$app/stores';
	import objByProperty from '../../../utils/objByProperty';
	import queries from '../../../utils/queries';
	import runQuery from '../../../utils/runQuery';
	import type { Contract } from '../../../types/defs';
	import formatMoney from '../../../utils/formatMoney';
	import TeamTable from '../../../components/tables/TeamTable.svelte';

	let teamAbbr = $derived($page.params.name);

	let teamName = $state('');

	let teamID = $state(null);

	let active = $derived([]);
	let dts = $derived([]);
	let ir = $derived([]);
	let waived = $derived([]);

	function processContracts(contracts: any[]) {
		return contracts
			.sort(objByProperty.bind({ path: 'salary', dir: 'desc' }))
			.sort(objByProperty.bind({ path: 'player.positionWeight', dir: 'asc' }))
			.map((contract: Contract) => {
				const { player, status: contractStatus, years, salary, needsAttention } = contract;
				const {
					name,
					team,
					position,
					espn_id,
					injuryStatus,
					pointsThisYearProj,
					positionRankProj
				} = player || {};

				return {
					name,
					team,
					position,
					salary,
					salaryFormatted: formatMoney(salary),
					years,
					espn_id,
					status: injuryStatus?.toLowerCase(),
					contractStatus,
					pointsThisYearProj,
					positionRankProj,
					needsAttention
				};
			});
	}

	function getTeam(abbr: string) {
		runQuery(queries['contracts-by-team-abbr'], { abbr: abbr.toUpperCase() }).then(({ data }) => {
			if (abbr !== $page.params.name) return; // superseded by a later navigation

			teamName = data?.team?.name || '';
			teamID = data?.team?.id || null;

			active = processContracts(data.contracts.filter((c) => c.status === 'active'));
			dts = processContracts(data.contracts.filter((c) => c.status === 'dts'));
			ir = processContracts(data.contracts.filter((c) => c.status === 'ir'));
			waived = processContracts(data.contracts.filter((c) => c.status === 'waived'));
		});
	}

	// $effect never runs during SSR, so this also keeps the query out of
	// server renders.
	$effect(() => {
		teamName = '';
		teamID = null;
		active = [];
		dts = [];
		ir = [];
		waived = [];

		if (teamAbbr) {
			getTeam(teamAbbr);
		}
	});
</script>

<svelte:head>
	<title>{teamName || 'Team'} — The League of Ordinary Gentlemen</title>
</svelte:head>

<h1>{teamName}</h1>

<TeamTable team={teamID} players={active} title="Active" />
<TeamTable team={teamID} players={dts} title="Practice Squad" />
<TeamTable team={teamID} players={ir} title="Injured Reserve" />
<TeamTable team={teamID} players={waived} title="Waived" />
