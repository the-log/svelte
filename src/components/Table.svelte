<script lang="ts">
  export let columns: number;
</script>

<style>
  .tablegrid {
    display: grid;
    width: 100%;
    gap: 0.25rem 0;
    grid-template-columns: repeat(var(--columns), auto) 1fr;
  }

  :global(.tablegrid-row) {
    --row-min-height: calc(70px - 0.25rem);
    background-color: var(--color-bg--3);
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    grid-template-rows: 1fr;
    min-height: var(--row-min-height);
  }

  :global(.tablegrid-cell) {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  :global(.tablegrid-thumbcell) {
    background-color: var(--color-bg--2);
    outline: 0.25rem solid var(--color-bg--1);
    min-height: var(--row-min-height);
    min-width: var(--row-min-height);
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.tablegrid-actions) {
    align-items: flex-end;
  }

  :global(.tablegrid-header) {
    background-color: var(--color-bg--2);
  }

  :global(.tablegrid-header > *) {
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  :global(.tray) {
    grid-column: 1 / -1;
  }

  :global(.text-minor) {
    font-size: 0.85rem;
    color: var(--sl-color-neutral-600);
  }
</style>

<div class="tablegrid" style='--columns:{columns};'>
    <slot />
</div>
