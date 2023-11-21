<script lang="ts">
	import type { Player } from "src/types/defs";
	import formatMoney from "src/utils/formatMoney";
	import queries from "src/utils/queries";
	import runQuery from "src/utils/runQuery";
  import {positions, leagueTeams} from "src/utils/playerInfo";
	import PlayerTable from "src/components/tables/PlayerTable.svelte";

  let playerData: any[] = [];

  $: players = playerData;

  let take = 25;
  let skip = 0;
  let filters = {
    "NOT": {}
  };
  $: order = { pointsThisYearProj: 'desc' };


  $: {
    runQuery(queries["all-players"], {take, skip, filters, order})
    .then((resp) => {
      const {data, errors} = resp;
      if (errors) return errors;

      playerData = (data.players as Player[]).map(player => {
        const {
          name,
          position,
          team,
          espn_id,
          contract,
          injuryStatus,
          pointsThisYear,
          pointsThisYearProj,
          pointsThisWeekProj,
          pointsLastYear,
          positionRank,
          overallRank,
          positionRankProj,
          overallRankProj
        } = player;

        const {team: logTeam, salary, years, status: type} = contract ?? {};
        const {abbreviation} = logTeam ?? {};

        return ({
          name,
          position,
          team,
          espn_id,
          logTeam,
          salary: formatMoney(salary),
          years,
          type,
          abbreviation,
          injuryStatus: injuryStatus.toLowerCase(),
          pointsThisYear,
          pointsThisWeekProj,
          pointsThisYearProj,
          pointsLastYear,
          positionRank,
          overallRank,
          positionRankProj,
          overallRankProj

        })
      });
    })
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

    filters = newFilters;
  }

  function onOrderUpdate(e: CustomEvent) {
    const {key, dir} = e.detail;
    order = {
      [`${key}`]: dir
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
</style>

<h1>Players</h1>
<form on:submit|preventDefault={()=>{}} class="sl-theme-light">
  <sl-input on:sl-input={onNameInput} placeholder="Player Name"></sl-input>
  <sl-select on:sl-input={onPositionInput} placeholder="Position" multiple clearable>
    {#each positions as [abbr, position] }
      <sl-option value="{abbr}">{position}</sl-option>
    {/each}
  </sl-select>
  <sl-select on:sl-input={onTeamInput} placeholder="Team" multiple clearable>
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
  <PlayerTable players={players} title="Active" />
</div>
