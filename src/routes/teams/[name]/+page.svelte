<script lang="ts">
  import { page } from '$app/stores';
	import objByProperty from 'src/utils/objByProperty';
	import queries from 'src/utils/queries';
	import runQuery from 'src/utils/runQuery';
  import type { Contract, TableData } from 'src/types/defs';
	import formatMoney from 'src/utils/formatMoney';
	import Table from 'src/components/Table.svelte';

  let teamAbbr = $page.params.name;

  let teamName = '';
  let headers = [
    "Name",
    "Team",
    "Position",
    "Salary",
    "Years",
  ];
  let content: any[] = [];


  runQuery(queries['contracts-by-team'], {
    abbr: teamAbbr.toUpperCase()
  }).then(({data}) => {
    const {team, contracts} = data;
    teamName = team?.name ?? '';
    content = contracts
      .sort(objByProperty.bind({path: 'salary', dir: 'desc'}))
      .sort(objByProperty.bind({path: 'player.positionWeight', dir: 'asc'}))
      .map((contract: Contract) => {
        const {name, team, position} = contract.player ?? {};

        return {
        cells: [
          name,
          team,
          position,
          formatMoney(contract.salary),
          contract.years
        ]
      }
      })
  });

  $: tableData = {
    headers,
    content,
  }
</script>

<h1>{teamName}</h1>

<Table data={tableData} />
