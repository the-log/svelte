<script lang="ts">
	import formatMoney from '../../../src/utils/formatMoney';
  import Table from '../../../src/components/Table.svelte'
	import objByProperty from '../../../src/utils/objByProperty';
	import runQuery from '../../../src/utils/runQuery';
	import queries from '../../../src/utils/queries';
  import type { Contract } from '../../../src/types/defs';
  import { isMobile as layoutStore } from "../../misc/stores";
	import { onMount } from 'svelte';

  let players: any[];
  $: players = [];

  const fetchRFAs = () => {
    runQuery(queries['rfas'], {})
    .then(({data}) => {

        const playerData = data.contracts
          .sort(objByProperty.bind({path: 'player.positionRankProj', dir: 'asc'}))
          .sort(objByProperty.bind({path: 'player.positionWeight', dir: 'asc'}))
          .filter(contract => !!contract.player)
          .map((contract: Contract) => ({
            name: contract.player?.name,
            nflTeam: contract.player?.team,
            position: contract.player?.position,
            salary: formatMoney(contract.salary),
            years: contract.years,
            espn_id: contract.player?.espn_id || 0,
            status: contract.player?.injuryStatus.toLowerCase(),
            ovr: contract.player?.overallRankProj,
            pos: contract.player?.positionRankProj,
            team: contract.team.name,
            abbr: contract.team.abbreviation
          }));

        players = playerData;
      })
  }

  let interval;
  onMount(() => {
    fetchRFAs();
    interval = setInterval(fetchRFAs, 10000);

    return () => clearInterval(interval);
  })

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
  .tray {
    grid-column: 1 / -1;
    padding: 1rem;
    display: grid;
    gap: 1rem;
    grid-template-columns: auto repeat(6, auto);
    align-items: start;

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

    p {
      font-size: 0.85em;
      margin: 0;
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
</style>

<h1>Restricted Free Agents</h1>

<Table columns={9}>
  <div class="tablegrid-header tablegrid-row">
    {#if !isMobile}
      <div class="tablegrid-cell"><span class="visually-hidden">Position</span></div>
    {/if}
    <div class="tablegrid-cell">Name</div>
    <div class="tablegrid-cell">Team</div>
    {#if !isMobile}
      <div class="tablegrid-cell">Salary</div>
      <div class="tablegrid-cell">Rank</div>
    {/if}
  </div>
  {#each players as { espn_id, name, nflTeam, ovr, pos, position, salary, status, team, abbr }}
    <div class="tablegrid-row" data-player-id="{espn_id}">

      {#if !isMobile}
        <div class="tablegrid-cell tablegrid-thumbcell" status="{status}">{position}</div>
      {/if}
      <div class="tablegrid-cell">
        {name}
        <span class="text-minor">{nflTeam} {#if isMobile}- {position} (#{pos}){/if}</span>
      </div>
      <div class="tablegrid-cell">
        {team}
        {#if isMobile}
          <span class="text-minor">{salary}</span>
        {/if}
      </div>
      {#if !isMobile}
        <div class="tablegrid-cell">{salary}</div>
        <div class="tablegrid-cell">#{pos}</div>
      {/if}
    </div>
  {/each}
</Table>
