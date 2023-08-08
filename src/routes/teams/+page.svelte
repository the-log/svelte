<script lang="ts">
	import formatMoney from 'src/utils/formatMoney';
  import Table from 'src/components/Table.svelte'
	import runQuery from 'src/utils/runQuery';
	import queries from 'src/utils/queries';
  import type { Team, RowAction } from 'src/types/defs';
	import { readable } from 'svelte/store';

  $: teams = [];

  runQuery(queries['all-teams'])
    .then(({data}) => {
      console.log(data);

      teams = data.teams.map((team: Team) => {
        const {
          abbreviation,
          name,
          wins,
          losses,
          ties,
          contractTotals,
        } = team;

        const {
          active,
          dts,
          ir,
          waived,
          salary,
          years
        } = contractTotals;

        return {
          abbreviation,
          name,
          wins,
          losses,
          ties,
          active,
          dts,
          ir,
          waived,
          salary: formatMoney(salary),
          years
        }
      })
    });
</script>

<h1>League</h1>

<Table columns={8}>
  <div class="tablegrid-header tablegrid-row">
    <div class="tablegrid-cell">Team</div>
    <div class="tablegrid-cell">Record</div>
    <div class="tablegrid-cell">Salary</div>
    <div class="tablegrid-cell">Years</div>
    <div class="tablegrid-cell">Active</div>
    <div class="tablegrid-cell">DTS</div>
    <div class="tablegrid-cell">IR</div>
    <div class="tablegrid-cell">Waived</div>
  </div>

  {#each teams as { abbreviation, name, wins, losses, ties, active, dts, ir, waived, salary, years }}
    <div class="tablegrid-row">
      <div class="tablegrid-cell">
        <a href="/teams/{abbreviation}">{name}</a>
      </div>
      <div class="tablegrid-cell">{wins}-{losses}-{ties}</div>
      <div class="tablegrid-cell">{salary}</div>
      <div class="tablegrid-cell">{years}</div>
      <div class="tablegrid-cell">{active}</div>
      <div class="tablegrid-cell">{dts}</div>
      <div class="tablegrid-cell">{ir}</div>
      <div class="tablegrid-cell">{waived}</div>
    </div>
  {/each}
</Table>
