<script lang="ts">
  import Table from 'src/components/Table.svelte'
	import Actions from 'src/components/Actions.svelte';
  import { isMobile as layoutStore } from "src/misc/stores";

  export let title: String;
  export let players: any[];

  $: {
    console.log(players)
  }

  $: sortConfig = {
    key: "pointsThisYearProj",
    dir: "desc",
  };

  let sortLabel = {
    'pointsThisWeekProj': 'Week (Proj)',
    'pointsThisYearProj': 'Year (Proj)',
    'pointsThisYear': 'Year',
    'pointsLastYear': 'Year (Prev)',
  }

  $: isMobile = null;
  layoutStore.subscribe((value) => {isMobile = value});

  function onOrderUpdate(e: CustomEvent) {
    const { target: dropdown, detail } = e;
    const { item } = detail;
    const { key: oldKey, dir: oldDir } = sortConfig;

    const newKey = item.getAttribute('sort-key');
    const newDir = item.getAttribute('sort-dir');

    sortConfig = {
      key: newKey ?? oldKey,
      dir: newDir ?? oldDir,
    }

    const requestUpdateSort = new CustomEvent('update-sort', {
      cancelable: false,
      bubbles: true,
      detail: sortConfig,
    });

    dropdown?.dispatchEvent(requestUpdateSort)
  }
</script>

<style lang="scss">
  [status] {
    border-left: 2px solid transparent;
  }

  [status="out"] {
    border-color: red;
  }

  [status="questionable"] {
    border-color: goldenrod;
  }

  .text-minor {
    font-size: 0.85rem;
    color: var(--sl-color-neutral-600);
  }

  h2 {
    margin-top: 2rem;
  }

  .tablegrid-header .tablegrid-cell.subtitle {
    display: grid;
    grid-template-rows: auto auto;
    grid-template-columns: auto auto;
    gap: 0.25rem;

    sl-dropdown {
      grid-column: -1 / -2;
      grid-row: 1 / -1;
      align-self: center;
      font-size: 1.25rem;
    }
  }
</style>

{#if players.length}
  <h2>{title}</h2>

  <Table columns={isMobile ? 3 : 5}>
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
      <div class="tablegrid-cell subtitle">
        Points
        <span class="text-minor">{sortLabel[sortConfig.key]}</span>
        <sl-dropdown placement="bottom-end" on:sl-select={onOrderUpdate}>
          <sl-icon-button slot="trigger" name="arrow-down-up"></sl-icon-button>

          <sl-menu>
            {#each Object.entries(sortLabel) as [key, label] }
              <sl-menu-item sort-key="{key}">
                {label}
                {#if sortConfig.key === key}
                  <sl-icon slot="suffix" name="check2"></sl-icon>
                {/if}
              </sl-menu-item>
            {/each}
            <sl-divider></sl-divider>
            <sl-menu-item sort-dir="asc">
              Ascending
              {#if sortConfig.dir === 'asc'}
                <sl-icon slot="suffix" name="check2"></sl-icon>
              {/if}
            </sl-menu-item>
            <sl-menu-item sort-dir="desc">
              Descending
              {#if sortConfig.dir === 'desc'}
                <sl-icon slot="suffix" name="check2"></sl-icon>
              {/if}
            </sl-menu-item>
          </sl-menu>
        </sl-dropdown>


      </div>
    </div>

    {#each players as player}
      {@const {
        name,
        team,
        espn_id,
        position,
        logTeam,
        salary,
        years,
        injuryStatus,
        positionRankProj,
        overallRankProj,
        type
      } = player}
      {@const points = player[sortConfig.key]}
      <div class="tablegrid-row" data-player-id="{espn_id}">
        {#if !isMobile}
          <div class="tablegrid-cell tablegrid-thumbcell" status={injuryStatus}>
            <sl-tooltip content="#{positionRankProj} {position}, #{overallRankProj} overall (Projected)" placement="top-start">
              <span>
                {#if positionRankProj < 1000}
                  #{positionRankProj}
                {:else}
                  #
                {/if}
              </span>
            </sl-tooltip>
          </div>
        {/if}
        <div class="tablegrid-cell" status="{isMobile ? injuryStatus : null}">
          {name}
          <span class="text-minor">
            {team} - {position}
            {#if isMobile}&nbsp;&nbsp;{salary}, {years}yr{/if}
          </span>
        </div>
        {#if !isMobile}
          <div class="tablegrid-cell">
            {#if logTeam}
              {logTeam.name}
              <span class="text-minor">{salary}, {years}yr</span>
            {:else}
            <span class="text-minor">-----</span>
            {/if}
          </div>
        {/if}
        <div class="tablegrid-cell">{Math.round(points)}</div>
        <Actions isOwner={false} player={{ name, position, team, espn_id, type }} />
      </div>
    {/each}
  </Table>
{/if}

