<script lang="ts">
  export let player;
  export let isOwner: boolean;

  const { name, position, team, espn_id, type } = player;

  function handlePlayerActions(e: CustomEvent) {
    const menu = (e.target as HTMLElement);
    const {item} = e.detail;
    const row = menu!.closest('.tablegrid-row');

    const player_id = menu.getAttribute('player-id');
    const action = item.getAttribute('action');
    console.log(player_id, action);

    switch (action) {
      case 'more':
        row!.querySelector('.tray')!.toggleAttribute('hidden');
        break;

      case 'drop':
        row?.querySelector(`[popup-id="${player_id}-drop"]`).show();

      default:
        break;
    }

  }
</script>

<div class="tablegrid-cell tablegrid-actions">
  <sl-dropdown>
    <sl-icon-button slot="trigger" name="three-dots-vertical"></sl-icon-button>
    <sl-menu player-id={espn_id} on:sl-select={handlePlayerActions}>
      <sl-menu-item action="more">
        <sl-icon slot="prefix" name="person"></sl-icon>
        More Information
      </sl-menu-item>
      {#if isOwner}
        <sl-divider></sl-divider>
        <sl-menu-item action="drop">
          <sl-icon slot="prefix" name="arrow-down"></sl-icon>
          To Waivers
        </sl-menu-item>
        <sl-menu-item action="ir">
          <sl-icon slot="prefix" name="bandaid"></sl-icon>
          To IR
        </sl-menu-item>
        <sl-menu-item action="promote">
          <sl-icon slot="prefix" name="arrow-up"></sl-icon>
          To Active Roster
        </sl-menu-item>
      {/if}
    </sl-menu>
  </sl-dropdown>
</div>
<sl-dialog label="Drop Player?" popup-id="{espn_id}-drop" class="dialog-overview">
  Dropping {type}, {name}, {team}, {position}. This action is not reversible - do you want to continue?
  <sl-button slot="footer" variant="danger">Drop</sl-button>
</sl-dialog>
