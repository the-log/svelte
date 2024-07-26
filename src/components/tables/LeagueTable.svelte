<script lang="ts">
  import Table from '../Table.svelte'
	import Actions from '../Actions.svelte';
  import { isMobile as layoutStore } from "../../misc/stores";

  export let teams: any[];

  let isMobile: null | Boolean;
  $: isMobile = null;
  $: isReady = false;
  layoutStore.subscribe((value) => {
    setTimeout(() => {
      isMobile = value;
      isReady = true;
    }, 0);
  });
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
      {#if !isMobile}<div class="tablegrid-cell tablegrid-thumbcell">#{i + 1}</div>{/if}
      <div class="tablegrid-cell">
        <a href="/teams/{abbreviation}">{name}</a>
        <span class="text-minor">{wins}-{losses}-{ties}</span>
      </div>
      <div class="tablegrid-cell">
        {salary} &nbsp; {years}yrs
        {#if isMobile}
          <span class="text-minor">{active} - {dts} - {ir} - {waived}</span>
        {/if}
      </div>
      {#if !isMobile}
        <div class="tablegrid-cell">{active} - {dts} - {ir} - {waived}</div>
      {/if}
    </div>
  {/each}

</Table>
