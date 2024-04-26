<script lang="ts">
  import Table from '../Table.svelte'
	import Actions from '../Actions.svelte';
  import { isMobile as layoutStore } from "../../misc/stores";

  export let teams: any[];

  $: isMobile = null;
  layoutStore.subscribe((value) => {isMobile = value});
</script>

<style lang="scss">
  .text-minor {
    font-size: 0.85rem;
    color: var(--sl-color-neutral-600);
  }
</style>

<h2>Teams</h2>
<Table columns={isMobile ? 3 : 5}>
  <div class="tablegrid-header tablegrid-row">
    {#if !isMobile}<div class="tablegrid-cell"></div>{/if}
    <div class="tablegrid-cell">Team</div>
    <div class="tablegrid-cell">Cap Values</div>
    {#if !isMobile}<div class="tablegrid-cell">Contracts</div>{/if}
  </div>

  {#each teams as team, i}
    {@const {
      abbreviation,
      name,
      wins,
      losses,
      ties,
      active,
      dts,
      ir,
      waived,
      salary,
      years
    } = team}

    <div class="tablegrid-row">
      <div class="tablegrid-cell tablegrid-thumbcell">#{i + 1}</div>
      <div class="tablegrid-cell">
        <a href="/teams/{abbreviation}">{name}</a>
        <span class="text-minor">{wins}-{losses}-{ties}</span>
      </div>
      <div class="tablegrid-cell">
        {salary} &nbsp; {years}yrs
      </div>
      <div class="tablegrid-cell">{active} - {dts} - {ir} - {waived}</div>
    </div>
  {/each}

</Table>
