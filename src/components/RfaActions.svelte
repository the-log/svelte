<script lang="ts">
	import type { Contract, Player } from "../../src/types/defs";
	import { userStore } from "../misc/stores";
	import formatMoney from "../utils/formatMoney";
	import { serialize, useFormData } from "../utils/forms";
	import { notify } from "../utils/notify";
	import queries from "../utils/queries";
	import runQuery from "../utils/runQuery";

  export let espn_id: number;
  export let logTeam: string;
  export let status: string;
  export let player: Player;
  export let contract: Contract | null = null;

  let isAdmin = false;
  userStore.subscribe((value) => {
    if (!value) return null;
    isAdmin = value.isAdmin;
  });

  let modal: HTMLDialogElement;

  function handleFormData(e: FormDataEvent) {
    useFormData(e, doAction)
  }

  async function doAction(e: FormDataEvent) {

    const data = Object.fromEntries(e.formData);
    const {
      contract,
      years,
      player,
      salary,
      team
    } = data;

    await runQuery(queries["delete-contract"], {
      where: {
        id: contract
      }
    }).then(({data}) => {
      const {
        deleteContract: {
          player: {
            name,
            position,
            team
          },
          salary,
          years,
          status
        }
      } = data;
      notify({
        title: `Contract Deleted for ${name} (${position}, ${team})`,
        message: `${formatMoney(salary)}, ${years}yrs, ${status}`
      })
    });

    await runQuery(queries['create-contract'], {
      "data": {
        "player": {
          "connect": {
            "espn_id": parseInt(player)
          }
        },
        "needsAttention": true,
        "salary": parseInt(salary) * 100,
        "status": "active",
        "team": {
          "connect": {
            "espn_id": parseInt(team)
          }
        },
        "years": 0
      }
    }).then(({data}) => {
      const {
        createContract : {
          player: {
            name,
            position,
            team
          },
          salary,
          team: {
            name: teamName
          }
        }
      } = data;
      notify({
        title: `Contract Created for ${name} (${position}, ${team})`,
        message: `Winning Bid: ${formatMoney(salary)}, ${teamName}`
      })
    })

    modal.hide();
  }

</script>

<sl-icon-button name="pencil-square" on:click={modal.show()}></sl-icon-button>
<sl-dialog label="Creating New Contract" bind:this={modal}>
  <form
    data-actions
    on:submit|preventDefault={serialize}
    on:formdata={handleFormData}
  >
    <!-- References to all involved entities -->
    <input type="hidden" name="player" value="{espn_id}">
    <input type="hidden" name="contract" value="{contract}">

    <sl-input label="Player" type="text" readonly value="{player.name} ({player.position}, {player.nflTeam})">
      <sl-icon name="person-add" slot="prefix"></sl-icon>
    </sl-input>
    <br>

    {#if player.ft}
      <sl-input label="Previous" type="text" readonly value="{player.team}, {formatMoney(player.salary)}, FT">
        <sl-icon src="/icons/pennant.svg" slot="prefix"></sl-icon>
      </sl-input>
    {:else}
      <sl-input label="Previous" type="text" readonly value="{player.team}, {formatMoney(player.salary)}">
        <sl-icon src="/icons/pennant.svg" slot="prefix"></sl-icon>
      </sl-input>
    {/if}
    <br>
    <sl-input name="salary" label="Salary" type="number" min="1" help-text="50%: {formatMoney(player.salary * 0.5)}; 75%: {formatMoney(player.salary * 0.75)}">
      <sl-icon name="cash" slot="prefix"></sl-icon>
    </sl-input>
    <br>

    <sl-select name="team" label="Team">
      <sl-icon src="/icons/pennant.svg" slot="prefix"></sl-icon>
      <sl-option value="1">Destructive Drummer</sl-option>
      <sl-option value="2">Martian Carnage</sl-option>
      <sl-option value="4">Dumpster Fire</sl-option>
      <sl-option value="5">Mayfield of Dreams</sl-option>
      <sl-option value="6">Buckeye Bruiser</sl-option>
      <sl-option value="7">Murder Salad</sl-option>
      <sl-option value="8">Globo Gym</sl-option>
      <sl-option value="9">My Little LeBrony</sl-option>
      <sl-option value="10">I'm hear to</sl-option>
      <sl-option value="11">Team Billman</sl-option>
    </sl-select>
    <br>

    <!-- Submit Button -->
    <sl-button slot="footer" variant="primary" type="submit">Create New Contract</sl-button>
  </form>
</sl-dialog>
