<script lang="ts">
	import formatMoney from 'src/utils/formatMoney';
  import Table from 'src/components/Table.svelte'
	import runQuery from 'src/utils/runQuery';
	import queries from 'src/utils/queries';
  import type { Team, RowAction } from 'src/types/defs';

  function testAction() {
    alert('action!');
  }

  let content: any[] = [
  ];

  let headers = [
    "Team",
    "Record",
    "Contracts",
    "Salary",
    "Years"
  ];

  let actions: RowAction[] = [
    {
      name: 'Test',
      fn: testAction,
    },
  ];

  runQuery(queries['all-teams'])
    .then(({data}) => {
      content = data.teams.map((team: Team) => {
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
          salary,
          years
        } = contractTotals;

        return {
          cells: [
            `<a href="/teams/${abbreviation.toLowerCase()}">${name}</a>`,
            `(${wins}-${losses}-${ties})`,
            `${active} (${dts})`,
            formatMoney(salary),
            years,
          ]
        }
      })
    });

  $: teams = {
    headers,
    content,
    actions
  };

</script>

<h1>League</h1>

<Table data={teams}/>
