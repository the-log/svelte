<script lang="ts">
  import { browser } from "$app/environment";
	import type { Player } from "../../types/defs";
	import formatMoney from "../../utils/formatMoney";
	import queries from "../../utils/queries";
	import runQuery from "../../utils/runQuery";
  import {positions, leagueTeams} from "../../utils/playerInfo";
	import PlayerTable from "../../components/tables/PlayerTable.svelte";

  let players: any[] = [];
  let playerCount: number = 0;

  let take = 25;
  let skip = 0;
  let filters = {
    "NOT": {}
  };
  let order = { pointsThisYearProj: 'desc' };

  $: pagerMessage = playerCount
    ? `${skip + 1} - ${skip + Math.min(take, playerCount)} of ${playerCount}`
    : `No results found`;

  $: if (take || skip || filters || order) {
    runQuery(queries["all-players"], {take, skip, filters, order})
    .then((resp) => {
      const {data, errors} = resp;
      if (errors) return errors;

      playerCount = data.playersCount;
      players = data.players;

      updatePager();
    });

  }

  function onNameInput(e) {
    const playerName = e.target.value;
    const newFilters = filters;

    if (playerName) {
      newFilters.name = {};
      newFilters.name.contains = playerName;
    } else {
      delete newFilters.name;
    }
    skip = 0;
    filters = newFilters;
  }

  function onPositionInput(e) {
    let positions = e.target.value.flatMap(x => x.split(','))

    const newFilters = filters;

    if (positions.length) {
      newFilters.position = {};
      newFilters.position.in = positions;
    } else {
      delete newFilters.position;
    }
    skip = 0;
    filters = newFilters;
  }

  function onTeamInput(e) {
    let teams = e.target.value;
    const newFilters = filters;

    if (teams.length) {
      newFilters.team = {};
      newFilters.team.in = teams;
    } else {
      delete newFilters.team;
    }
    skip = 0;
    filters = newFilters;
  }

  function onAvailabilityInput(e) {
    const isAvailablePreference = e.target.value
    const newFilters = filters;

    if (isAvailablePreference) {
      if (isAvailablePreference.toUpperCase() === "YES") {
        delete newFilters.contract;
        newFilters.NOT.contract = {
          status: {
            in: ["active", "dts", "ir"]
          }
        }
      }

      if (isAvailablePreference.toUpperCase() === "NO") {
        delete newFilters.NOT.contract;
        newFilters.contract = {
          status: {
            in: ["active", "dts", "ir"]
          }
        }
      }
    } else {
      delete newFilters.contract;
      delete newFilters.NOT.contract;
    }
    skip = 0;
    filters = newFilters;
  }

  function onIsRookieInput(e) {
    const isRookiePreference = e.target.value
    const newFilters = filters;

    if (isRookiePreference) {
      newFilters.isRookie = {}
      if (isRookiePreference.toUpperCase() === "YES") {
        newFilters.isRookie.equals = true;
      }

      if (isRookiePreference.toUpperCase() === "NO") {
        newFilters.isRookie.equals = false;
      }
    } else {
      delete newFilters.isRookie
    }
    skip = 0;
    filters = newFilters;
  }

  function onOrderUpdate(e: CustomEvent) {
    const {key, dir} = e.detail;
    order = {
      [`${key}`]: dir
    }
    skip = 0;
  }

  function onPagination(e: PointerEvent) {
    const { target } = e;
    const { value } = (target as HTMLElement).dataset ?? {};

    switch (value) {
      case 'first':
        skip = 0;
        break;
      case 'prev':
        skip = Math.max(skip - take, 0);
        break;
      case 'next':
        skip = Math.min(skip + take, playerCount - take);
        break;
      case 'last':
        skip = playerCount - take;
        break;

      default:
        break;
    }

    updatePager();
  }

  function updatePager() {
    if (browser) {
      const prevButtons = (document?.querySelectorAll('[data-value="first"], [data-value="prev"]') as NodeListOf<HTMLButtonElement>);
      const nextButtons = (document?.querySelectorAll('[data-value="last"], [data-value="next"]') as NodeListOf<HTMLButtonElement>);
      prevButtons.forEach(btn => btn.disabled = (skip === 0));
      nextButtons.forEach(btn => btn.disabled = (playerCount <= (take + skip)))
    }
  }

</script>

<style lang="scss">
  form {
    background-color: var(--sl-color-primary-200);
    color: var(--sl-color-gray-800);
    margin-bottom: 2rem;
    padding: 1rem;
    display: grid;
    gap: 0.5rem;
    grid-template-columns: 1fr;


    @media (min-width: 45rem) {
      grid-template-columns: 1fr 1fr;
    }
  }

  sl-input {
    grid-column: 1 / -1;
  }

  sl-select {
    grid-column: 1 / -1;

    @media (min-width: 45rem) {
      grid-column: span 1;
    }
  }

  sl-radio {
    display: inline-block;
    margin-inline-start: var(--sl-spacing-small);

    &:first-child {
      margin-inline-start: 0;
    }

    grid-column: 1 / -1;

    @media (min-width: 45rem) {
      grid-column: span 1;
    }
  }

  sl-radio-group::part(form-control-label) {
    margin-bottom: var(--sl-spacing-small);
    font-weight: bold;
  }

  .pagination {
    margin: 1rem 0 ;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;

    sl-icon-button {
      color: var(--color-text--main);
    }

    .results {
      min-width: 10rem;
      text-align: center;
    }
  }
</style>

<h2>Players</h2>
<form on:submit|preventDefault={()=>{}} class="sl-theme-light">
  <sl-input on:sl-input={onNameInput} placeholder="Player Name" size="medium"></sl-input>
  <sl-select on:sl-input={onPositionInput} placeholder="Position" multiple clearable size="medium">
    {#each positions as [abbr, position] }
      <sl-option value="{abbr}">{position}</sl-option>
    {/each}
  </sl-select>
  <sl-select on:sl-input={onTeamInput} placeholder="Team" multiple clearable size="medium">
    {#each leagueTeams as [abbr, team] }
      <sl-option value="{abbr}">{team}</sl-option>
    {/each}
  </sl-select>
  <sl-radio-group on:sl-input={onAvailabilityInput} size="small" label="Available" name="isAvailable" value="">
    <sl-radio size="small" value="yes">Yes</sl-radio>
    <sl-radio size="small" value="no">No</sl-radio>
    <sl-radio size="small" value="">Either</sl-radio>
  </sl-radio-group>
  <sl-radio-group on:sl-input={onIsRookieInput} size="small" label="Rookie" name="isRookie" value="">
    <sl-radio size="small" value="yes">Yes</sl-radio>
    <sl-radio size="small" value="no">No</sl-radio>
    <sl-radio size="small" value="">Either</sl-radio>
  </sl-radio-group>
</form>

<div on:update-sort={onOrderUpdate}>
  <nav class="pagination" on:click={onPagination}>
    <sl-icon-button data-value="first" name="chevron-double-left" label="Show first set"></sl-icon-button>
    <sl-icon-button data-value="prev" name="chevron-left" label="Show previous set"></sl-icon-button>
    <span class="results">{pagerMessage}</span>
    <sl-icon-button data-value="next" name="chevron-right" label="Show next set"></sl-icon-button>
    <sl-icon-button data-value="last" name="chevron-double-right" label="Show last set"></sl-icon-button>
  </nav>
  <PlayerTable players={players} />
  <nav class="pagination" on:click={onPagination}>
    <sl-icon-button data-value="first" name="chevron-double-left" label="Show first set"></sl-icon-button>
    <sl-icon-button data-value="prev" name="chevron-left" label="Show previous set"></sl-icon-button>
    <span class="results">{pagerMessage}</span>
    <sl-icon-button data-value="next" name="chevron-right" label="Show next set"></sl-icon-button>
    <sl-icon-button data-value="last" name="chevron-double-right" label="Show last set"></sl-icon-button>
  </nav>
</div>
