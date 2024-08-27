<script lang="ts">
	import type { Contract, Player } from "../../src/types/defs";
	import { leagueSettingsStore, userStore } from "../misc/stores";
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

  let irElgibile = !['dts', 'ir', 'waived'].includes(status) && ['out', 'injury_reserve'].includes(player.playerStatus)

  let userTeam = '';
  userStore.subscribe((value) => {
    if (!value) return null;
    userTeam = value.teamID;
  })

  let inSeason = false;
  leagueSettingsStore.subscribe(value => {
    if (!value) return null;
    inSeason = value.phase === 'active';
  })

  $: isOwner = userTeam === logTeam;
  $: isAvailable = (!status || status === 'waived');

  let modal: HTMLDialogElement;
  let modalTitle = '';
  let modalBody = '';
  let buttonLabel = '&nbsp;';
  let action = '';

  function handlePlayerActions(e: CustomEvent) {
    const menu = (e.target as HTMLElement);
    const {item} = e.detail;
    const row = menu!.closest('.tablegrid-row');

    const player_id = menu.getAttribute('player-id');
    action = item.getAttribute('action');

    switch (action) {
      case 'more':
        window.open(`https://www.espn.com/nfl/player/_/id/${player.espn_id}`,'_blank');
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

  function tryCreateNewBid(formData) {
    const {name, position, team} = player
    const {team: teamid, player: playerid, salary, years} = formData;
    const vars = {
      data: {
        team: {
          connect: {
            id: teamid
          }
        },
        player: {
          connect: {
            espn_id: parseInt(playerid)
          }
        },
        salary: parseInt(salary) * 100,
        years: parseInt(years)
      }
    }

    runQuery(queries["new-bid"], vars).then(() => {
      modal.hide();
      notify({
        title: 'Bid Created',
        message: `${name} (${position}, ${team}) - $${salary}, ${years}yrs`
      })
    });
  }

  async function updateContract(contract, data) {
    await runQuery(queries["update-contract"], {
      where: {
        id: contract
      },
      data
    }).then(({data}) => {
      const {
        updateContract: {
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
        title: `Contract updated for ${name} (${position}, ${team})`,
        message: `${formatMoney(salary)}, ${years}yrs, ${status}`
      })
    });
  }

  function handleFormData(e: FormDataEvent) {
    useFormData(e, doAction)
  }

  async function doAction(e: FormDataEvent) {

    const data = Object.fromEntries(e.formData);
    const {
      contract,
      years
    } = data;

    switch (action) {
      case 'bid':
        tryCreateNewBid(data);
        break;

      case 'promote':
        await updateContract(contract, {
          status: "active",
          years: parseInt(years)
        })
        break;

      case 'ir':
        await updateContract(contract, {
          status: "ir"
        })
        break;

      case 'drop':
        if (status === 'dts') {
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
        } else {
          await updateContract(contract, {
            status: "waived"
          })
        }
        break;

      default:
        notify({
          message: "Something's gone wrong. See the console for details.",
          title: "Error",
          variant: "danger"
        });
        console.error(`The action "${action}" is unexpected.`);
        break;
    }

    modal.hide();

    window.dispatchEvent(new CustomEvent('action-taken', {
      bubbles: false,
      cancelable: false
    }));
  }

</script>


{#if isOwner || isAvailable}
<sl-dropdown>
  <sl-icon-button slot="trigger" src="/icons/menu.svg"></sl-icon-button>
  <sl-menu on:sl-select={handlePlayerActions}>
    <sl-menu-item action="more">
      <sl-icon slot="prefix" name="person"></sl-icon>
      More Info
    </sl-menu-item>
    {#if isOwner}
      {#if status === 'dts'}
        <sl-menu-item action="promote">
          <sl-icon slot="prefix" name="arrow-up"></sl-icon>
          To Active Roster
        </sl-menu-item>
      {/if}
      {#if irElgibile}
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
    {:else if isAvailable && inSeason}
      <sl-menu-item action="bid">
        <sl-icon slot="prefix" name="tag"></sl-icon>
        Place Bid
      </sl-menu-item>
    {/if}
  </sl-menu>
</sl-dropdown>
<sl-dialog label="{modalTitle}" bind:this={modal}>
  <form
    data-actions
    on:submit|preventDefault={serialize}
    on:formdata={handleFormData}
  >

    <!-- Actions with no form elements -->
    {#if !['bid', 'promote'].includes(action)}
      <p>{modalBody}</p>
    {/if}

    <!-- References to all involved entities -->
    <input type="hidden" name="player" value="{espn_id}">
    <input type="hidden" name="team" value="{userTeam}">
    <input type="hidden" name="contract" value="{contract}">

    <!-- Player & Salary Fields -->
    {#if action === 'bid'}
      <sl-input label="Player" type="text" readonly value="{player.name} ({player.position}, {player.team})">
        <sl-icon name="person-add" slot="prefix"></sl-icon>
      </sl-input>
      <br>
      <sl-input name="salary" label="Salary" type="number" min="1" value="1">
        <sl-icon name="cash" slot="prefix"></sl-icon>
      </sl-input>
      <br>
    {/if}

    <!-- Years Field -->
    {#if ['bid', 'promote'].includes(action)}
      <sl-input
        name="years"
        label="Years"
        type="number"
        min="1"
        max="{action === 'promote' ? 4 : 100}"
        value="1">
        <sl-icon name="calendar-plus" slot="prefix"></sl-icon>
      </sl-input>
      <br>
    {/if}

    <!-- Submit Button -->
    <sl-button slot="footer" variant="primary" type="submit">{buttonLabel}</sl-button>
  </form>
</sl-dialog>
{/if}
