<script lang="ts">
	import type { RowAction } from "src/types/defs";

  export let functions: RowAction[];
</script>

{#each functions as action}
  <button on:click={action.fn}>{action.name}</button>
{/each}
