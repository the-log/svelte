<script>
  import Table from "../Table.svelte";
  import { isMobile as layoutStore } from "../../misc/stores";

  export let title = ''

  $: isMobile = null;
  layoutStore.subscribe((value) => {isMobile = value});
</script>

{#if title}
  <h3>{title}</h3>
{/if}
<Table columns={isMobile ? 2 : 3}>
  <div class="tablegrid-header tablegrid-row">
    {#if !isMobile}
      <div class="tablegrid-cell"></div>
    {/if}
    <div class="tablegrid-cell">
      Player
      <span class="text-minor">Team - Position</span>
    </div>
    {#if !isMobile}
    <div class="tablegrid-cell">
      Owner
      <span class="text-minor">Salary, Years</span>
    </div>
    {/if}
  </div>
  <slot/>
</Table>
