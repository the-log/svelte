<script lang="ts">
  import Table from '../Table.svelte'
	import Actions from '../Actions.svelte';
  import { isMobile as layoutStore } from "../../misc/stores";
	import formatMoney from '../../utils/formatMoney';

  export let title: String | undefined = undefined;
  export let players: any[];

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

  let isMobile: null | Boolean;
  $: isMobile = null;
  $: isReady = false;
  layoutStore.subscribe((value) => {
    setTimeout(() => {
      isMobile = value;
      isReady = true;
    }, 0);
  });

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

  [status="out"], [status="suspension"]  {
    border-color: red;
  }

  [status="questionable"] {
    border-color: goldenrod;
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
  {#if title}
    <h2>{title}</h2>
  {/if}

  <Table columns={isMobile ? 3 : 4}>
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
        contract,
        name,
        team,
        espn_id,
        position,
        injuryStatus,
        positionRankProj,
        overallRankProj,
      } = player}
      {@const {
        team: logTeam,
        salary,
        years,
        status,
      } = contract ?? {}}
      {@const {
        name: logTeamName,
        abbreviation: abbr,
      } = logTeam ?? {}}
      {@const points = player[sortConfig.key]}
      <div class="tablegrid-row" data-player-id="{espn_id}">
        {#if !isMobile}
          <div class="tablegrid-cell tablegrid-thumbcell" status={injuryStatus.toLowerCase()}>
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
        <div class="tablegrid-cell" status="{isMobile ? injuryStatus.toLowerCase() : null}">
          {name}
          <span class="text-minor">
            {team} - {position}
          </span>
          {#if isMobile && (salary || years)}
          <span class="text-minor">{formatMoney(salary)}, {years}yr</span>
          {/if}

        </div>
        {#if !isMobile}
          <div class="tablegrid-cell">
            {#if logTeam}
              {logTeamName}
              <span class="text-minor">{formatMoney(salary)}, {years}yr</span>
            {:else}
            <span class="text-minor">-----</span>
            {/if}
          </div>
        {/if}
        <div class="tablegrid-cell">{Math.round(points)}</div>
        <div class="tablegrid-cell tablegrid-actions">
          <Actions
            espn_id={espn_id}
            logTeam={abbr}
            status={status}
            player={player}
          />
        </div>
      </div>
    {/each}
  </Table>
{/if}

