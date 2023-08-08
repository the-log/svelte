<script lang="ts">
  import { page } from '$app/stores';
	import objByProperty from 'src/utils/objByProperty';
	import queries from 'src/utils/queries';
	import runQuery from 'src/utils/runQuery';
  import type { Contract, TableData } from 'src/types/defs';
	import formatMoney from 'src/utils/formatMoney';
	import Table from 'src/components/Table.svelte';
  import Icon from 'src/components/Icon.svelte';
  import formatLength from 'src/utils/formatLength';

  let teamAbbr = $page.params.name;

  let playerData: any[] = [
  ];
  $: teamName = '';
  $: playerExtra = {};
  $: players = playerData;


  runQuery(queries['contracts-by-team'], {
    abbr: teamAbbr.toUpperCase()
  }).then(({data}) => {

      teamName = data.team.name;

        playerData = data.contracts
          .sort(objByProperty.bind({path: 'salary', dir: 'desc'}))
          .sort(objByProperty.bind({path: 'player.positionWeight', dir: 'asc'}))
          .map((contract: Contract) => ({
            name: contract.player.name,
            team: contract.player.team,
            position: contract.player.position,
            salary: formatMoney(contract.salary),
            years: contract.years,
            espn_id: contract.player.espn_id || 0,
            status: contract.player.injuryStatus.toLowerCase()
          }));
      })

  function toggleCollapse(e: PointerEvent) {
    const button = (e!.target! as HTMLElement).closest('button')!;
    const icon = button.querySelector('svg')!;
    const row = button.closest('.tablegrid-row')!;
    const tray = row.querySelector('.tray')! as HTMLElement;

    icon.style.rotate = tray.hidden ? '180deg' : '0deg';
    tray.hidden = !tray.hidden;

    const isOpen = !tray.hidden;
    const id = row.dataset.playerId;

    if (isOpen && !playerExtra[id]) {
      playerExtra[id] = true;

      runQuery(queries['stats-by-player'], {id: parseInt(id)})
        .then(({data}) => {
          playerExtra[id] = data.player;
          console.log(playerExtra);

        })
    }
  }
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

<h1>{teamName}</h1>

<Table columns={5}>
  <div class="tablegrid-header tablegrid-row">
    <div class="tablegrid-cell"><span class="visually-hidden">Position</span></div>
    <div class="tablegrid-cell">Name</div>
    <div class="tablegrid-cell">Team</div>
    <div class="tablegrid-cell">Salary</div>
    <div class="tablegrid-cell">Years</div>
  </div>

  {#each players as { name, team, position, salary, years, espn_id, status }}
    <div class="tablegrid-row" data-player-id="{espn_id}">
      <div class="tablegrid-cell tablegrid-thumbcell" status="{status}">{position}</div>
      <div class="tablegrid-cell">{name}</div>
      <div class="tablegrid-cell">{team}</div>
      <div class="tablegrid-cell">{salary}</div>
      <div class="tablegrid-cell">{years}</div>
      <div class="tablegrid-cell tablegrid-actions">
        <button class="plain" on:click={toggleCollapse}>
          <Icon name="caret_circle" width="1.25em" height="1.25em" />
        </button>
      </div>
      <div class="tray" hidden>
        <img src="https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/{espn_id}.png&w=350&h=254" alt="{name} headshot" />

        <div class="bio-stats">
          <span>HT/WT</span> <span>{formatLength(playerExtra[espn_id]?.height)}, {playerExtra[espn_id]?.weight}lbs</span>
          <span>BIRTH</span> <span>2/13/1990 ({playerExtra[espn_id]?.age})</span>
          <span>DRAFT</span> <span>{playerExtra[espn_id]?.draftYear}: Rd {playerExtra[espn_id]?.draftRound}, Pk {playerExtra[espn_id]?.draftSelection}</span>
        </div>

        <p>{playerExtra[espn_id]?.seasonOutlook || ''}</p>

        <div class="game-stats">
          <span>Last Year</span>        <span>{playerExtra[espn_id]?.pointsLastYear || ''}</span>
          <span>This Year (proj)</span> <span>{playerExtra[espn_id]?.pointsThisYearProj || ''}</span>
        </div>
      </div>
    </div>
  {/each}
</Table>
