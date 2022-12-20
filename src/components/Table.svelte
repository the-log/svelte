<script lang="ts">
  import type { TableData } from '../types/defs';
  import Actions from "src/components/Actions.svelte";
  export let data: TableData;
</script>

<style>

  table {
    border-collapse: collapse;
  }

  thead {
    text-align: left;
  }

  th, td {
    padding: 0 0.5rem;
  }

  tbody td {
    padding-block: 0.25rem;
  }

  tbody tr:nth-child(even) {
    background-color: #eee;
  }

  tbody tr:hover {
    background-color: #ddd;
  }
</style>

<table>
  {#if data.headers}
    <thead>
      <tr>
        {#each data.headers as header}
          <th>{@html header ? header : ''}</th>
        {/each}
      </tr>
    </thead>
  {/if}

  {#if data.content}
    <tbody>
      {#each data.content as row}
        <tr>
          {#each row.cells as cell }
            <td>{@html cell ? cell : ''}</td>
          {/each}

          {#if row.actions}
            <td><Actions functions={row.actions}/></td>
          {/if}
        </tr>
      {/each}
    </tbody>
  {/if}
</table>
