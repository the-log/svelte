<script lang="ts">
  import { serialize, useFormData } from "../utils/forms";
	import formatMoney from "../utils/formatMoney";
	import runQuery from "../utils/runQuery";
	import queries from "../utils/queries";
	import { notify } from "../utils/notify";

  export let bid;
  let { player, team } = bid;

  let
    modal: HTMLElement,
    modalTitle = "",
    modalBody = "",
    modalSubmit = "";

  function onMenuSelect(e: CustomEvent) {
    const {
      item: {
        value
      }
    } = e.detail

    switch (value) {
      case "edit":
        modalTitle = "Editing Bid";
        modalSubmit = "Save";
        break;

      case "delete":
        modalTitle = "Deleting Bid";
        modalBody = `${player.name} (${formatMoney(bid.salary)}, ${bid.years}yr)`
        modalSubmit = "Delete";
        break;

      default:
        break;
    }

    modal.show();
  }

  async function onDelete(e: CustomEvent) {
    const resp = await runQuery(queries['delete-bid'], {
      "where": {
        "id": bid.id
      }
    });

    modal.hide();

    const {
      data: {
        deleteBid: {
          player: { name, team, position },
          salary,
          years
        }
      }
    } = resp;

    notify({
      title: 'Bid Deleted',
      message: `${name} (${position}, ${team}) - ${formatMoney(salary)}, ${years}yrs`
    });

    afterAction();
  }

  async function onEdit(e: FormDataEvent) {
    const data = Object.fromEntries(e.formData);

    const resp = await runQuery(queries['update-bid'], {
      "where": {
        "id": bid.id
      },
      "data": {
        "salary": parseInt(data.salary) * 100,
        "years": parseInt(data.years)
      }
    });

    modal.hide();

    const {
      data: {
        updateBid: {
          player: { name, team, position },
          salary,
          years
        }
      }
    } = resp;

    notify({
      title: 'Bid Updated',
      message: `${name} (${position}, ${team}) - ${formatMoney(salary)}, ${years}yrs`
    });

    afterAction();
  }

  function afterAction() {
    window.dispatchEvent(new CustomEvent('action-taken', {
      bubbles: false,
      cancelable: false
    }));
  }
</script>

<sl-dropdown>
  <sl-icon-button slot="trigger" src="/icons/menu.svg"></sl-icon-button>
  <sl-menu on:sl-select={onMenuSelect}>
    <sl-menu-item value="edit">
      <sl-icon slot="prefix" name="pencil-square"></sl-icon>
      Edit
    </sl-menu-item>
    <sl-menu-item value="delete">
      <sl-icon slot="prefix" name="trash3"></sl-icon>
      Delete
    </sl-menu-item>
  </sl-menu>
</sl-dropdown>

<sl-dialog label="{modalTitle ? modalTitle : ""}" bind:this={modal}>
  {#if modalBody}
    <p>Are you sure you want to delete this bid?</p>
    <p>{modalBody}</p>
    <sl-button slot="footer" variant="secondary" type="button" size="medium" on:click={onDelete}>{modalSubmit}</sl-button>
  {:else}
    <form
      data-actions
      on:submit|preventDefault={serialize}
      on:formdata={(e)=>{useFormData(e, onEdit)}}
    >
    <sl-input label="Player" type="text" readonly value="{player.name} ({player.position}, {player.team})">
      <sl-icon name="person-add" slot="prefix"></sl-icon>
    </sl-input>
    <br>
    <sl-input name="salary" label="Salary" type="number" min="1" value={bid.salary / 100}>
      <sl-icon name="cash" slot="prefix"></sl-icon>
    </sl-input>
    <br>
    <sl-input name="years" label="Years" type="number" min="1" value={bid.years}>
      <sl-icon name="calendar-plus" slot="prefix"></sl-icon>
    </sl-input>
    <br>
      <!-- Submit Button -->
      <sl-button slot="footer" variant="primary" type="submit" size="medium">{modalSubmit}</sl-button>
    </form>
  {/if}
</sl-dialog>
