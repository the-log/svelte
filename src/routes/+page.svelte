<script lang="ts">
	import formatMoney from 'src/utils/formatMoney';
  import Table from 'src/components/Table.svelte'
	import objByProperty from 'src/utils/objByProperty';
	import runQuery from 'src/utils/runQuery';
	import queries from 'src/utils/queries';
  import type { Contract, Player } from 'src/types/defs';
  import { teamStore } from "src/misc/stores";
	import { onMount } from 'svelte/internal';
	import formatLength from 'src/utils/formatLength';
	import Actions from 'src/components/Actions.svelte';

  let isMobile: boolean;


  $: active = [];
  $: dts = [];
  $: ir = [];
  $: waived = [];

  $: playerExtra = {};

  function processContracts(contracts: any[]) {
    return contracts
      .sort(objByProperty.bind({path: 'salary', dir: 'desc'}))
      .sort(objByProperty.bind({path: 'player.positionWeight', dir: 'asc'}))
      .map((contract: Contract) => {
        const {player, status: contractStatus, years, salary} = contract;
        const {name, team, position, espn_id, injuryStatus} = player;

        return {
          name,
          team,
          position,
          salary: formatMoney(salary),
          years,
          espn_id,
          status: injuryStatus.toLowerCase(),
          type: contractStatus
        }
      });
  }


  teamStore.subscribe((value) => {
    if (!value) return null;

    runQuery(queries['contracts-by-team'], {abbr: value})
      .then(({data}) => {
        active = processContracts(data.contracts.filter(c => c.status === 'active'));
        dts = processContracts(data.contracts.filter(c => c.status === 'dts'));
        ir = processContracts(data.contracts.filter(c => c.status === 'ir'));
        waived = processContracts(data.contracts.filter(c => c.status === 'waived'));
      });
  })

  // function toggleCollapse(e: PointerEvent) {
  //   const button = (e!.target! as HTMLElement).closest('button')!;
  //   const icon = button.querySelector('svg')!;
  //   const row = button.closest('.tablegrid-row')!;
  //   const tray = row.querySelector('.tray')! as HTMLElement;

  //   icon.style.rotate = tray.hidden ? '180deg' : '0deg';
  //   tray.hidden = !tray.hidden;

  //   const isOpen = !tray.hidden;
  //   const id = row.dataset.playerId;

  //   if (isOpen && !playerExtra[id]) {
  //     playerExtra[id] = true;

  //     runQuery(queries['stats-by-player'], {id: parseInt(id)})
  //       .then(({data}) => {
  //         playerExtra[id] = data.player;
  //       })
  //   }
  // }

  onMount(() => {
    const mq = window.matchMedia('(max-width:45rem)');
    isMobile = mq.matches;
    mq.addEventListener('change', () => {
      isMobile = mq.matches;
    });
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

<h1>My Team</h1>

<h2>Active</h2>
<Table columns={3}>
  <div class="tablegrid-header tablegrid-row">
    <div class="tablegrid-cell">Player</div>
    <div class="tablegrid-cell">Salary</div>
    <div class="tablegrid-cell">Years</div>
  </div>

  {#each active as { name, team, position, salary, years, espn_id, status, type }}
    <div class="tablegrid-row" data-player-id="{espn_id}">
      <div class="tablegrid-cell" status="{status}">
        {name}
        <span class="text-minor">{team} - {position}</span>
      </div>
      <div class="tablegrid-cell">{salary}</div>
      <div class="tablegrid-cell">{years}</div>
      <Actions player={{name, position, team, espn_id, type}} />
      <div class="tray" hidden>
        <sl-tab-group>
          <sl-tab slot="nav" panel="overview">Overview</sl-tab>
          <sl-tab slot="nav" panel="outlook">Outlook</sl-tab>
          <sl-tab slot="nav" panel="stats">Statistics</sl-tab>

          <sl-tab-panel name="overview">
            <span>HT/WT</span> <span>{formatLength(playerExtra[espn_id]?.height)}, {playerExtra[espn_id]?.weight}lbs</span>
            <span>BIRTH</span> <span>2/13/1990 ({playerExtra[espn_id]?.age})</span>
            <span>DRAFT</span> <span>{playerExtra[espn_id]?.draftYear}: Rd {playerExtra[espn_id]?.draftRound}, Pk {playerExtra[espn_id]?.draftSelection}</span>
          </sl-tab-panel>

          <sl-tab-panel name="outlook">
            <p>{playerExtra[espn_id]?.seasonOutlook || ''}</p>
          </sl-tab-panel>

          <sl-tab-panel name="stats">
            TODO.
          </sl-tab-panel>
        </sl-tab-group>
      </div>
    </div>
  {/each}
</Table>

<h2>Practice Squad</h2>
<Table columns={3}>
  <div class="tablegrid-header tablegrid-row">
    <div class="tablegrid-cell">Player</div>
    <div class="tablegrid-cell">Salary</div>
    <div class="tablegrid-cell">Years</div>
  </div>

  {#each dts as { name, team, position, salary, years, espn_id, status, type }}
    <div class="tablegrid-row" data-player-id="{espn_id}">
      <div class="tablegrid-cell" status="{status}">
        {name}
        <span class="text-minor">{team} - {position}</span>
      </div>
      <div class="tablegrid-cell">{salary}</div>
      <div class="tablegrid-cell">{years}</div>
      <Actions player={{name, position, team, espn_id, type}} />
      <div class="tray" hidden>
        <sl-tab-group>
          <sl-tab slot="nav" panel="overview">Overview</sl-tab>
          <sl-tab slot="nav" panel="outlook">Outlook</sl-tab>
          <sl-tab slot="nav" panel="stats">Statistics</sl-tab>

          <sl-tab-panel name="overview">
            <span>HT/WT</span> <span>{formatLength(playerExtra[espn_id]?.height)}, {playerExtra[espn_id]?.weight}lbs</span>
            <span>BIRTH</span> <span>2/13/1990 ({playerExtra[espn_id]?.age})</span>
            <span>DRAFT</span> <span>{playerExtra[espn_id]?.draftYear}: Rd {playerExtra[espn_id]?.draftRound}, Pk {playerExtra[espn_id]?.draftSelection}</span>
          </sl-tab-panel>

          <sl-tab-panel name="outlook">
            <p>{playerExtra[espn_id]?.seasonOutlook || ''}</p>
          </sl-tab-panel>

          <sl-tab-panel name="stats">
            TODO.
          </sl-tab-panel>
        </sl-tab-group>
      </div>
    </div>
  {/each}
</Table>

<h2>Injured Reserve</h2>
<Table columns={3}>
  <div class="tablegrid-header tablegrid-row">
    <div class="tablegrid-cell">Player</div>
    <div class="tablegrid-cell">Salary</div>
    <div class="tablegrid-cell">Years</div>
  </div>

  {#each ir as { name, team, position, salary, years, espn_id, status, type }}
    <div class="tablegrid-row" data-player-id="{espn_id}">
      <div class="tablegrid-cell" status="{status}">
        {name}
        <span class="text-minor">{team} - {position}</span>
      </div>
      <div class="tablegrid-cell">{salary}</div>
      <div class="tablegrid-cell">{years}</div>
      <Actions player={{name, position, team, espn_id, type}} />
      <div class="tray" hidden>
        <sl-tab-group>
          <sl-tab slot="nav" panel="overview">Overview</sl-tab>
          <sl-tab slot="nav" panel="outlook">Outlook</sl-tab>
          <sl-tab slot="nav" panel="stats">Statistics</sl-tab>

          <sl-tab-panel name="overview">
            <span>HT/WT</span> <span>{formatLength(playerExtra[espn_id]?.height)}, {playerExtra[espn_id]?.weight}lbs</span>
            <span>BIRTH</span> <span>2/13/1990 ({playerExtra[espn_id]?.age})</span>
            <span>DRAFT</span> <span>{playerExtra[espn_id]?.draftYear}: Rd {playerExtra[espn_id]?.draftRound}, Pk {playerExtra[espn_id]?.draftSelection}</span>
          </sl-tab-panel>

          <sl-tab-panel name="outlook">
            <p>{playerExtra[espn_id]?.seasonOutlook || ''}</p>
          </sl-tab-panel>

          <sl-tab-panel name="stats">
            TODO.
          </sl-tab-panel>
        </sl-tab-group>
      </div>
    </div>
  {/each}
</Table>

<h2>Waived</h2>
<Table columns={3}>
  <div class="tablegrid-header tablegrid-row">
    <div class="tablegrid-cell">Player</div>
    <div class="tablegrid-cell">Salary</div>
    <div class="tablegrid-cell">Years</div>
  </div>

  {#each waived as { name, team, position, salary, years, espn_id, status, type }}
    <div class="tablegrid-row" data-player-id="{espn_id}">
      <div class="tablegrid-cell" status="{status}">
        {name}
        <span class="text-minor">{team} - {position}</span>
      </div>
      <div class="tablegrid-cell">{salary}</div>
      <div class="tablegrid-cell">{years}</div>
      <Actions player={{name, position, team, espn_id, type}} />
      <div class="tray" hidden>
        <sl-tab-group>
          <sl-tab slot="nav" panel="overview">Overview</sl-tab>
          <sl-tab slot="nav" panel="outlook">Outlook</sl-tab>
          <sl-tab slot="nav" panel="stats">Statistics</sl-tab>

          <sl-tab-panel name="overview">
            <span>HT/WT</span> <span>{formatLength(playerExtra[espn_id]?.height)}, {playerExtra[espn_id]?.weight}lbs</span>
            <span>BIRTH</span> <span>2/13/1990 ({playerExtra[espn_id]?.age})</span>
            <span>DRAFT</span> <span>{playerExtra[espn_id]?.draftYear}: Rd {playerExtra[espn_id]?.draftRound}, Pk {playerExtra[espn_id]?.draftSelection}</span>
          </sl-tab-panel>

          <sl-tab-panel name="outlook">
            <p>{playerExtra[espn_id]?.seasonOutlook || ''}</p>
          </sl-tab-panel>

          <sl-tab-panel name="stats">
            TODO.
          </sl-tab-panel>
        </sl-tab-group>
      </div>
    </div>
  {/each}
</Table>
