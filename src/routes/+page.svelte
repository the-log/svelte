<script lang="ts">
	import formatMoney from 'src/utils/formatMoney';
  import Table from 'src/components/Table.svelte'
	import objByProperty from 'src/utils/objByProperty';
	import runQuery from 'src/utils/runQuery';
	import queries from 'src/utils/queries';
  import type { Contract } from 'src/types/defs';
  import { teamStore } from "src/misc/stores";

  let content: any[] = [
  ];

  teamStore.subscribe((value) => {
    if (!value) return null;

    runQuery(queries['contracts-by-team'], {abbr: value})
      .then(({data}) => {
        content = data.contracts
          .sort(objByProperty.bind({path: 'salary', dir: 'desc'}))
          .sort(objByProperty.bind({path: 'player.positionWeight', dir: 'asc'}))
          .map((contract: Contract) => ({
            cells: [
              contract.player.name,
              contract.player.team,
              contract.player.position,
              formatMoney(contract.salary),
              contract.years
            ]
          }))
      })
  })

  let headers = [
    "Name",
    "Team",
    "Position",
    "Salary",
    "Years",
  ];

  $: players = {
    headers,
    content,
  };

</script>

<h1>My Team</h1>

<Table data={players}/>
