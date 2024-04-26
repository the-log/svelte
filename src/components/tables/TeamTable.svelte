<script lang="ts">
  import Table from '../Table.svelte'
	import Actions from '../Actions.svelte';
  import { isMobile as layoutStore } from "../../misc/stores";
  import { userStore } from "../../misc/stores";
	import { select_value } from 'svelte/internal';

  export let title: String;
  export let players: any[];
  export let team: String | null;

  $: isMobile = null;
  layoutStore.subscribe((value) => {isMobile = value});
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

  <Table columns={isMobile ? 3 : 5}>
    <div class="tablegrid-header tablegrid-row">
      {#if !isMobile}<div class="tablegrid-cell"></div>{/if}
      <div class="tablegrid-cell">Player</div>
      {#if !isMobile}<div class="tablegrid-cell">Team</div>{/if}
      <div class="tablegrid-cell">Salary</div>
      <div class="tablegrid-cell">Years</div>
    </div>

    {#each players as player}
      {@const { name, team: nflTeam, position, salary, years, espn_id, playerStatus, contractStatus, contract_id } = player}
      <div class="tablegrid-row" data-player-id="{espn_id}">
        {#if !isMobile}<div class="tablegrid-cell tablegrid-thumbcell" {playerStatus}>{position}</div>{/if}
        <div class="tablegrid-cell" status="{isMobile ? playerStatus : null}">
          {name}
          {#if isMobile}<span class="text-minor">{team} - {position}</span>{/if}
        </div>
        {#if !isMobile}<div class="tablegrid-cell">{nflTeam}</div>{/if}
        <div class="tablegrid-cell">{salary}</div>
        <div class="tablegrid-cell">{years}</div>
        <div class="tablegrid-cell tablegrid-actions">
          <Actions
            espn_id={espn_id}
            logTeam={team}
            status={contractStatus}
            player={player}
            contract={contract_id}
          />
        </div>
      </div>
    {/each}
  </Table>
{/if}

