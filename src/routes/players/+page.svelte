<script lang="ts">
	import Table from "src/components/Table.svelte";
	import type { Player } from "src/types/defs";
	import formatMoney from "src/utils/formatMoney";
	import queries from "src/utils/queries";
	import runQuery from "src/utils/runQuery";

  let headers = [
    "Name",
    "Position",
    "Team",
    "Salary",
    "Years",
    "Owner"
  ];

  let content: any[] = [];

  function updateTable(take = 25, skip = 0, filters = {}, order = {positionThisYear: 'asc'}) {
    runQuery(queries["all-players"], {take, skip, filters, order})
      .then(({data, errors}) => {

        if (errors) return errors;

        const formatted = (data.players as Player[]).map(player => {
          const {name, position, team, contract} = player;
          const {team: logTeam, salary, years} = contract ?? {};
          const {abbreviation} = logTeam ?? {};

          console.log(logTeam);

          return ({
            cells: [
              name,
              position,
              team,
              formatMoney(salary),
              years,
              abbreviation,
            ]
          })
        });

        content = formatted;
      })
  }

  updateTable();

  $: tableData = {
    headers,
    content
  }
</script>

<style></style>

<h1>Players</h1>
<!-- {#await content}
  Loading...
{:then content}
  <pre>
    {JSON.stringify(table, null, 2)}
  </pre>
{/await} -->
<Table data={tableData} />
