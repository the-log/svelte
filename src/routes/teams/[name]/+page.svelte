<script lang="ts">
  import { page } from '$app/stores';
	import objByProperty from 'src/utils/objByProperty';
	import queries from 'src/utils/queries';
	import runQuery from 'src/utils/runQuery';
  import type { Contract } from 'src/types/defs';
	import formatMoney from 'src/utils/formatMoney';
	import TeamTable from 'src/components/tables/TeamTable.svelte';

  let teamAbbr = $page.params.name;

  $: teamName = '';
  $: active = [];
  $: dts = [];
  $: ir = [];
  $: waived = [];

  function processContracts(contracts: any[]) {
    return contracts
      .sort(objByProperty.bind({path: 'salary', dir: 'desc'}))
      .sort(objByProperty.bind({path: 'player.positionWeight', dir: 'asc'}))
      .map((contract: Contract) => {
        const {player, status: contractStatus, years, salary} = contract;
        const {name, team, position, espn_id, injuryStatus, pointsThisYearProj, positionRankProj} = player;

        return {
          name,
          team,
          position,
          salary: formatMoney(salary),
          years,
          espn_id,
          status: injuryStatus.toLowerCase(),
          type: contractStatus,
          pointsThisYearProj,
          positionRankProj
        }
      });
  }

  runQuery(queries['contracts-by-team'], {abbr: teamAbbr.toUpperCase()})
    .then(({data}) => {
      teamName = data?.team?.name || '';
      teamAbbr = data?.team?.abbreviation || '';

      active = processContracts(data.contracts.filter(c => c.status === 'active'));
      dts = processContracts(data.contracts.filter(c => c.status === 'dts'));
      ir = processContracts(data.contracts.filter(c => c.status === 'ir'));
      waived = processContracts(data.contracts.filter(c => c.status === 'waived'));
    });
</script>

<h1>{teamName}</h1>

<TeamTable team={teamAbbr} players={active} title="Active" />
<TeamTable team={teamAbbr} players={dts} title="Practice Squad" />
<TeamTable team={teamAbbr} players={ir} title="Injured Reserve" />
<TeamTable team={teamAbbr} players={waived} title="Waived" />


