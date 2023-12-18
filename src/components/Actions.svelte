<script lang="ts">
  import { teamStore } from "../../src/misc/stores";
	import type { Player } from "../../src/types/defs";
	import { serialize, useFormData } from "../utils/forms";
	import queries from "../utils/queries";
	import runQuery from "../utils/runQuery";

  export let espn_id: number;
  export let logTeam: string;
  export let status: string;
  export let player: Player;

  let userTeam = '';
  teamStore.subscribe((value) => {
    if (!value) return null;

    userTeam = value;
  })
  $: isOwner = userTeam === logTeam;
  $: isAvailable = (!status || status === 'waived');

  let modal: HTMLDialogElement;
  let modalTitle = '';
  let modalBody = '';
  let buttonLabel = '';

  function handlePlayerActions(e: CustomEvent) {
    const menu = (e.target as HTMLElement);
    const {item} = e.detail;
    const row = menu!.closest('.tablegrid-row');

    const player_id = menu.getAttribute('player-id');
    const action = item.getAttribute('action');
    console.log(player);

    switch (action) {
      case 'more':
        row!.querySelector('.tray')?.toggleAttribute('hidden');
        break;

      case 'drop':
        modalTitle = 'Dropping Player';
        modalBody = `Dropping ${player.name}. This action is not reversible - do you want to continue?`
        buttonLabel = 'Drop';
        break;

      case 'ir':
        modalTitle = 'Moving Player to IR';
        modalBody = `Moving ${player.name} to IR for remainder of year. This action is not reversible - do you want to continue?`
        buttonLabel = 'Move';
        break;

      case 'promote':
        modalTitle = 'Promoting Player to Active'
        modalBody = `Promoting ${player.name} to active roster. This action is not reversible - do you want to continue?`
        buttonLabel = 'Promote';
        break;

      case 'bid':
        modalTitle = 'Bidding on Player';
        buttonLabel = 'Bid';
        break;

      default:
        break;
    }

    if (action !== 'more') {
      modal.show();
    }

  }

  function tryCreateNewBid({team, player, salary, years}) {
    const vars = {
      data: {
        team: {
          connect: {
            abbreviation: team
          }
        },
        player: {
          connect: {
            espn_id: parseInt(player)
          }
        },
        salary: parseInt(salary) * 100,
        years: parseInt(years)
      }
    }

    runQuery(queries["new-bid"], vars)
      .then(x => {console.log(x)})
  }
</script>

<div class="tablegrid-cell tablegrid-actions">
  <sl-dropdown>
    <sl-icon-button slot="trigger" name="three-dots-vertical"></sl-icon-button>
    <sl-menu on:sl-select={handlePlayerActions}>
      <sl-menu-item action="more">
        <sl-icon slot="prefix" name="person"></sl-icon>
        More Information ({status})
      </sl-menu-item>
      {#if isOwner}
        <sl-divider></sl-divider>
        {#if status === 'dts'}
          <sl-menu-item action="promote">
            <sl-icon slot="prefix" name="arrow-up"></sl-icon>
            To Active Roster
          </sl-menu-item>
        {/if}
        {#if !(['dts', 'ir', 'waived'].includes(status))}
          <sl-menu-item action="ir">
            <sl-icon slot="prefix" name="bandaid"></sl-icon>
            To IR
          </sl-menu-item>
        {/if}
        {#if status !== 'wavied'}
          <sl-menu-item action="drop">
            <sl-icon slot="prefix" name="arrow-down"></sl-icon>
            Drop
          </sl-menu-item>
        {/if}
      {:else if isAvailable}
        <sl-menu-item action="bid">
          <sl-icon slot="prefix" name="tag"></sl-icon>
          Place Bid
        </sl-menu-item>
      {/if}
    </sl-menu>
  </sl-dropdown>
</div>
{#if isOwner}
  <sl-dialog label="{modalTitle}" bind:this={modal}>
    {modalBody}
    <sl-button slot="footer" variant="danger">{buttonLabel}</sl-button>
  </sl-dialog>
{:else if isAvailable}
  <sl-dialog label="{modalTitle}" bind:this={modal}>
    <form
      data-actions
      on:submit|preventDefault={serialize}
      on:formdata={(e) => {useFormData(e, tryCreateNewBid)}}
    >
      <input type="hidden" name="player" value="{espn_id}">
      <input type="hidden" name="team" value="{userTeam}">
      <sl-input label="Player" type="text" readonly value="{player.name} ({player.position}, {player.team})">
        <sl-icon name="person-add" slot="prefix"></sl-icon>
      </sl-input>
      <br>
      <sl-input name="salary" label="Salary" type="number" min="1" value="1">
        <sl-icon name="cash" slot="prefix"></sl-icon>
      </sl-input>
      <br>
      <sl-input name="years" label="Years" type="number" min="1" value="1">
        <sl-icon name="calendar-plus" slot="prefix"></sl-icon>
      </sl-input>
      <sl-button slot="footer" variant="primary" type="submit">{buttonLabel}</sl-button>
    </form>
  </sl-dialog>
{/if}
