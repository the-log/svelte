<script lang="ts">
	import formatMoney from '../../utils/formatMoney';
  import Table from '../../components/Table.svelte'
	import runQuery from '../../utils/runQuery';
	import queries from '../../utils/queries';
  import type { Team, RowAction } from '../../types/defs';
	import { readable } from 'svelte/store';
	import LeagueTable from '../../components/tables/LeagueTable.svelte';

  $: teams = [];

  runQuery(queries['all-teams'])
    .then(({data}) => {
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
<LeagueTable teams={teams} />
