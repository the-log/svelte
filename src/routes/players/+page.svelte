<script lang="ts">
	import Table from "src/components/Table.svelte";
	import type { Player } from "src/types/defs";
	import formatMoney from "src/utils/formatMoney";
	import queries from "src/utils/queries";
	import runQuery from "src/utils/runQuery";
  import {positions, leagueTeams} from "src/utils/playerInfo";

  let playerName, playerPosition, playerTeam, playerIsRookie, playerIsAvailable;
  let playerData: any[] = [];

  $: players = playerData;


  function updateTable(take = 25, skip = 0, filters = {}, order = {pointsThisYearProj: 'desc'}) {
    runQuery(queries["all-players"], {take, skip, filters, order})
    .then((resp) => {
      const {data, errors} = resp;
      if (errors) return errors;

      playerData = (data.players as Player[]).map(player => {
        const {name, position, team, contract, injuryStatus} = player;
        const {team: logTeam, salary, years} = contract ?? {};
        const {abbreviation} = logTeam ?? {};

        return ({
          name,
          position,
          team,
          logTeam,
          salary: formatMoney(salary),
          years,
          abbreviation,
          injuryStatus: injuryStatus.toLowerCase(),
        })
      });
    })

  }

  updateTable();

</script>

<style lang="scss">
  form {
    background-color: var(--sl-color-primary-800);
    color: var(--color-text--alt-1);
    margin-bottom: 2rem;
    padding: 1rem;
    display: grid;
    gap: 0.5rem;
    grid-template-columns: 1fr 1fr;
  }

  sl-input {
    grid-column: 1 / -1;
  }

  sl-radio {
    display: inline-block;
    margin-inline-start: var(--sl-spacing-small);

    &:first-child {
      margin-inline-start: 0;
    }
  }

  sl-radio-group::part(form-control-label) {
    margin-bottom: var(--sl-spacing-small);
    font-weight: bold;
  }
</style>

<h1>Players</h1>
<form on:submit|preventDefault={()=>{}} class="sl-theme-light">
  <sl-input on:sl-input={(e) => {playerName = e.target.value}} placeholder="Player Name"></sl-input>
  <sl-select on:sl-input={(e) => {playerPosition = e.target.value}} placeholder="Position">
    {#each positions as [abbr, position] }
      <sl-option value="{abbr}">{position}</sl-option>
    {/each}
  </sl-select>
  <sl-select on:sl-input={(e) => {playerTeam = e.target.value}} placeholder="Team">
    {#each leagueTeams as [abbr, team] }
      <sl-option value="{abbr}">{team}</sl-option>
    {/each}
  </sl-select>
  <sl-radio-group on:sl-input={(e) => {playerIsAvailable = e.target.value}} size="small" label="Available" name="isAvailable" value="3">
    <sl-radio value="yes">Yes</sl-radio>
    <sl-radio value="no">No</sl-radio>
    <sl-radio value="">Either</sl-radio>
  </sl-radio-group>
  <sl-radio-group on:sl-input={(e) => {playerIsRookie = e.target.value}} size="small" label="Rookie" name="isRookie" value="3">
    <sl-radio value="1">Yes</sl-radio>
    <sl-radio value="2">No</sl-radio>
    <sl-radio value="3">Either</sl-radio>
  </sl-radio-group>

</form>
<Table columns={6}>
  <div class="tablegrid-header tablegrid-row">
    <div class="table grid-cell"><span class="visually-hidden">Position</span></div>
    <div class="tablegrid-cell">Player</div>
    <div class="tablegrid-cell">Owner</div>
    <div class="tablegrid-cell">Salary</div>
    <div class="tablegrid-cell">Years</div>
    <div class="tablegrid-cell">Status</div>
  </div>

  {#each players as { name, team, position, logTeam, salary, years, injuryStatus }}
    <div class="tablegrid-row">
      <div class="tablegrid-cell tablegrid-thumbcell">{position}</div>
      <div class="tablegrid-cell">{name} {team}</div>
      <div class="tablegrid-cell">{logTeam?.name ?? ''}</div>
      <div class="tablegrid-cell">{salary ?? ''}</div>
      <div class="tablegrid-cell">{years ?? ''}</div>
      <div class="tablegrid-cell">{injuryStatus}</div>
    </div>
  {/each}
</Table>
