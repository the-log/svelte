<script lang="ts">
  import Table from 'src/components/Table.svelte'
	import Actions from 'src/components/Actions.svelte';
  import { isMobile as layoutStore } from "src/misc/stores";
  import { userStore } from "src/misc/stores";

  export let title: String;
  export let players: any[];
  export let team: String | null;

  $: isMobile = null;
  layoutStore.subscribe((value) => {isMobile = value});

  $: isOwner = false;
  userStore.subscribe((value) => {
    const userTeam = value?.team?.abbreviation || '';
    isOwner = userTeam?.toLowerCase() === team?.toLowerCase();
  });
</script>

<style lang="scss">
  .tray {
    grid-column: 1 / -1;
    padding: 1rem;

    img {
      width: 100px;
      height: 100px;
      object-fit: cover;
      object-position: center bottom;
      background-color: var(--color-bg--1);
    }

    .bio-stats {
      display: grid;
      grid-template-columns: auto auto;
      gap: 0.25rem 1rem;
    }

    .game-stats {
      display: grid;
      grid-template-columns: auto auto;
      gap: 0.25rem 1rem;
    }
  }

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
</style>

{#if players.length}
  <h2>{title}</h2>

  <Table columns={isMobile ? 5 : 7}>
    <div class="tablegrid-header tablegrid-row">
      {#if !isMobile}<div class="tablegrid-cell"></div>{/if}
      <div class="tablegrid-cell">Player</div>
      {#if !isMobile}<div class="tablegrid-cell">Team</div>{/if}
      <div class="tablegrid-cell">Salary</div>
      <div class="tablegrid-cell">Years</div>
      <div class="tablegrid-cell">Projected Rank</div>
      <div class="tablegrid-cell">Projected Points</div>
    </div>

    {#each players as { name, team, position, salary, years, espn_id, status, type, pointsThisYearProj, positionRankProj }}
      <div class="tablegrid-row" data-player-id="{espn_id}">
        {#if !isMobile}<div class="tablegrid-cell tablegrid-thumbcell" {status}>{position}</div>{/if}
        <div class="tablegrid-cell" status="{isMobile ? status : null}">
          {name}
          {#if isMobile}<span class="text-minor">{team} - {position}</span>{/if}
        </div>
        {#if !isMobile}<div class="tablegrid-cell">{team}</div>{/if}
        <div class="tablegrid-cell">{salary}</div>
        <div class="tablegrid-cell">{years}</div>
        <div class="tablegrid-cell">{positionRankProj}</div>
        <div class="tablegrid-cell">{Math.round(pointsThisYearProj)}</div>
        <Actions {isOwner} player={{name, position, team, espn_id, type}} />
        <div class="tray" hidden>
          <sl-tab-group>
            <sl-tab slot="nav" panel="overview">Overview</sl-tab>
            <sl-tab slot="nav" panel="outlook">Outlook</sl-tab>
            <sl-tab slot="nav" panel="stats">Statistics</sl-tab>

            <sl-tab-panel name="overview">
              <span>HT/WT</span>
              <span>BIRTH</span>
              <span>DRAFT</span>
            </sl-tab-panel>

            <sl-tab-panel name="outlook">

            </sl-tab-panel>

            <sl-tab-panel name="stats">
              TODO.
            </sl-tab-panel>
          </sl-tab-group>
        </div>
      </div>
    {/each}
  </Table>
{/if}

