<script lang="ts">
	import formatMoney from 'src/utils/formatMoney';
	import objByProperty from 'src/utils/objByProperty';
	import runQuery from 'src/utils/runQuery';
	import queries from 'src/utils/queries';
  import type { Contract } from 'src/types/defs';
  import { teamStore } from "src/misc/stores";
	import TeamTable from 'src/components/tables/TeamTable.svelte';
	import PlayerTable from 'src/components/tables/PlayerTable.svelte';

  $: team = '';
  $: active = [];
  $: dts = [];
  $: ir = [];
  $: waived = [];


  function processContracts(contracts: any[]) {

    return contracts
      .sort(objByProperty.bind({path: 'player.positionRankProj', dir: 'asc'}))
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
          playerStatus: injuryStatus.toLowerCase(),
          contractStatus: contractStatus.toLowerCase(),
          type: contractStatus,
          pointsThisYearProj,
          positionRankProj
        }
      });
  }

  function getContracts(abbr) {
    runQuery(queries['contracts-by-team'], {abbr})
      .then(({data}) => {
        active = processContracts(data.contracts.filter(c => c.status === 'active'));
        dts = processContracts(data.contracts.filter(c => c.status === 'dts'));
        ir = processContracts(data.contracts.filter(c => c.status === 'ir'));
        waived = processContracts(data.contracts.filter(c => c.status === 'waived'));
      });
  }

  teamStore.subscribe((value) => {
    if (!value) return null;

    team = value;

    getContracts(value);


  })
</script>

<div on:refresh-contracts>
  <TeamTable team={team} players={active} title="Active" />
  <TeamTable team={team} players={dts} title="Practice Squad" />
  <TeamTable team={team} players={ir} title="Injured Reserve" />
  <TeamTable team={team} players={waived} title="Waived" />
</div>
