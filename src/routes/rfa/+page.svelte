<script lang="ts">
	import formatMoney from '../../../src/utils/formatMoney';
  import Table from '../../../src/components/Table.svelte'
	import objByProperty from '../../../src/utils/objByProperty';
	import runQuery from '../../../src/utils/runQuery';
	import queries from '../../../src/utils/queries';
  import type { Contract } from '../../../src/types/defs';
  import { isMobile as layoutStore } from "../../misc/stores";
	import { onMount } from 'svelte';

  let sortMethod: 'position' | 'team' | 'posrank' | 'ovrrank';
  $: sortMethod = 'position';
  let players: any[];
  $: players = [];

  const fetchRFAs = () => {
    runQuery(queries['rfas'], {})
    .then(({data}) => {

      switch (sortMethod) {
        case 'position':
          data.contracts
            .sort(objByProperty.bind({path: 'player.positionRankProj', dir: 'asc'}))
            .sort(objByProperty.bind({path: 'player.positionWeight', dir: 'asc'}));
          break;

        case 'team':
          data.contracts
            .sort(objByProperty.bind({path: 'player.positionRankProj', dir: 'asc'}))
            .sort(objByProperty.bind({path: 'player.positionWeight', dir: 'asc'}))
            .sort(objByProperty.bind({path: 'team.name', dir: 'asc'}));
          break;

        case 'posrank':
          data.contracts
            .sort(objByProperty.bind({path: 'player.positionRankProj', dir: 'asc'}))
          break;

        case 'ovrrank':
          data.contracts
            .sort(objByProperty.bind({path: 'player.overallRankProj', dir: 'asc'}))
          break;

        default:
          break;
      }

        const playerData = data.contracts
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
            teamID: contract.team.espn_id,
            abbr: contract.team.abbreviation,
            ft: contract.isFranchiseTagged
          }));

        players = playerData;
      })
  }

  const onSortChange = ({target}) => {
    sortMethod = target.value;
    fetchRFAs();
  }

  let interval: number;
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

  [status="out"],
  [status="injury_reserve"],
  [status="suspension"]  {
    border-color: red;
  }

  [status="questionable"] {
    border-color: goldenrod;
  }

  [data-sort="position"] ~ :where(
    :nth-last-child(1 of [data-position="QB"]),
    :nth-last-child(1 of [data-position="RB"]),
    :nth-last-child(1 of [data-position="WR"]),
    :nth-last-child(1 of [data-position="TE"]),
    :nth-last-child(1 of [data-position="K"]),
    :nth-last-child(1 of [data-position="DT"], [data-position="DE"]),
    :nth-last-child(1 of [data-position="LB"]),
    :nth-last-child(1 of [data-position="CB"], [data-position="S"])
  ) {
    margin-bottom: 5rem;
  }

  [data-sort="team"] ~ :nth-last-child(1 of [data-position]) {
    margin-bottom: 0;
  }

  [data-sort="team"] ~ :where(
    :nth-last-child(1 of [data-team="T1"]),
    :nth-last-child(1 of [data-team="T2"]),
    :nth-last-child(1 of [data-team="T4"]),
    :nth-last-child(1 of [data-team="T5"]),
    :nth-last-child(1 of [data-team="T6"]),
    :nth-last-child(1 of [data-team="T7"]),
    :nth-last-child(1 of [data-team="T8"]),
    :nth-last-child(1 of [data-team="T9"]),
    :nth-last-child(1 of [data-team="T10"]),
    :nth-last-child(1 of [data-team="T11"])
  ) {
    margin-bottom: 5rem;
  }

  [data-sort="team"] ~ :nth-last-child(1 of [data-team]) {
    margin-bottom: 0;
  }



  .ft {
    color: goldenrod;
  }

  sl-radio-group::part(form-control-input) {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 0.5rem;
  }
</style>

<h1>Restricted Free Agents</h1>

<sl-radio-group size="small" label="Sort By:" name="sort" value="position" on:sl-change={onSortChange}>
  <sl-radio value="position">Position</sl-radio>
  <sl-radio value="team">Team</sl-radio>
  <sl-radio value="posrank">Positional Rank</sl-radio>
  <sl-radio value="ovrrank">Overall Rank</sl-radio>
</sl-radio-group>
<br>

<Table columns={9}>
  <div class="tablegrid-header tablegrid-row" data-sort="{sortMethod}">
    {#if !isMobile}
      <div class="tablegrid-cell"><span class="visually-hidden">Position</span></div>
    {/if}
    <div class="tablegrid-cell">Name</div>
    <div class="tablegrid-cell">Former Team</div>
    {#if !isMobile}
      <div class="tablegrid-cell">Salary</div>
      <div class="tablegrid-cell">Rank</div>
    {/if}
  </div>
  {#each players as { espn_id, name, nflTeam, ovr, pos, position, salary, status, team, teamID, abbr, ft }}
    <div class="tablegrid-row" data-player-id="{espn_id}" data-position="{position}" data-team="T{teamID}">

      {#if !isMobile}
        <div class="tablegrid-cell tablegrid-thumbcell" status="{status}">{position}</div>
      {/if}
      <div class="tablegrid-cell">
        {name}
        <span class="text-minor">{nflTeam} {#if isMobile}- {position} (#{pos}){/if}</span>
      </div>
      <div class="tablegrid-cell">
        {team}
        <span class="text-minor">
          {#if ft}<span class="ft">FT</span>{/if}
          {#if isMobile}{salary}{/if}
        </span>
      </div>
      {#if !isMobile}
        <div class="tablegrid-cell">{salary}</div>
        <div class="tablegrid-cell">#{pos}</div>
      {/if}
    </div>
  {/each}
</Table>
