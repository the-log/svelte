<script lang="ts">
  import { page } from '$app/stores';
	import objByProperty from '../../../utils/objByProperty';
	import queries from '../../../utils/queries';
	import runQuery from '../../../utils/runQuery';
  import type { Contract } from '../../../types/defs';
	import formatMoney from '../../../utils/formatMoney';
	import TeamTable from '../../../components/tables/TeamTable.svelte';

  let teamAbbr = $page.params.name;

  $: teamName = '';
  $: teamID = null;
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
          contractStatus,
          pointsThisYearProj,
          positionRankProj
        }
      });
  }

  if (teamAbbr) {

    runQuery(queries['contracts-by-team-abbr'], {abbr: teamAbbr.toUpperCase()})
      .then(({data}) => {


        teamName = data?.team?.name || '';
        teamID = data?.team?.id || null;

        active = processContracts(data.contracts.filter(c => c.status === 'active'));
        dts = processContracts(data.contracts.filter(c => c.status === 'dts'));
        ir = processContracts(data.contracts.filter(c => c.status === 'ir'));
        waived = processContracts(data.contracts.filter(c => c.status === 'waived'));
      });
  }
</script>

<h1>{teamName}</h1>

<TeamTable team={teamID} players={active} title="Active" />
<TeamTable team={teamID} players={dts} title="Practice Squad" />
<TeamTable team={teamID} players={ir} title="Injured Reserve" />
<TeamTable team={teamID} players={waived} title="Waived" />


