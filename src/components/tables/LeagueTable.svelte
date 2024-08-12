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

  .contract-counts {
    display: flex;
    gap: 0.25rem;

    :is(sl-tooltip, span):not(:last-of-type):after {
      content: "-";
      margin-left: 0.25rem;
      color: var(--sl-color-neutral-600);
    }
  }

  .cap-values {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .warn {
    color: var(--sl-color-warning-600);
  }

  .over {
    color: var(--sl-color-danger-600);
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
      formattedSalary,
      years
    } = team}

    <div class="tablegrid-row">
      {#if !isMobile}<div class="tablegrid-cell tablegrid-thumbcell">#{i + 1}</div>{/if}
      <div class="tablegrid-cell">
        <a href="/teams/{abbreviation}">{name}</a>
        <span class="text-minor">{wins}-{losses}-{ties}</span>
      </div>
      <div class="tablegrid-cell">
        <span class="cap-values">
          <sl-tooltip content="Salary (max $1000)">
            <span class="{salary > 100000 ? 'over' : ''} {salary > 90000 ? 'warn' : ''}">{formattedSalary}</span>
          </sl-tooltip>
          <sl-tooltip content="Years (max 100)">
            <span class="{years > 100 ? 'over' : ''} {years > 90 ? 'warn' : ''}">{years}yrs</span>
          </sl-tooltip>
        </span>
        {#if isMobile}
          <span class="text-minor contract-counts">
            <span class="{active > 40 ? 'over' : ''} {active > 36 ? 'warn' : ''}">{active}</span>
            <span class="{dts > 13 ? 'over' : ''} {active > 11 ? 'warn' : ''}">{dts}</span>
            <span>{ir}</span>
            <span>{waived}</span>
          </span>
        {/if}
      </div>
      {#if !isMobile}
        <div class="tablegrid-cell">
          <span class="contract-counts">
            <sl-tooltip content="Active (max 40)">
              <span class="{active > 40 ? 'over' : ''} {active > 36 ? 'warn' : ''}">{active}</span>
            </sl-tooltip>
            <sl-tooltip content="DTS (max 13)">
              <span class="{dts > 13 ? 'over' : ''} {active > 11 ? 'warn' : ''}">{dts}</span>
            </sl-tooltip>
            <sl-tooltip content="Injured Reserve">
              <span>{ir}</span>
            </sl-tooltip>
            <sl-tooltip content="Waived">
              <span>{waived}</span>
            </sl-tooltip>
          </span>
        </div>
      {/if}
    </div>
  {/each}

</Table>
