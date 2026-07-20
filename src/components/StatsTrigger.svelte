<script lang="ts">
	import { statsPlayerStore } from '../misc/stores';
	import type { StatsPlayerRef } from '../types/defs';

	interface Props {
		player: StatsPlayerRef;
	}

	let { player }: Props = $props();
</script>

{#if player.espn_id}
	<button type="button" onclick={() => statsPlayerStore.set(player)}>{player.name}</button>
{:else}
	{player.name}
{/if}

<style lang="scss">
	button {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: inherit;
		text-align: inherit;
		cursor: pointer;
		text-decoration: underline;
		text-decoration-color: var(--sl-color-neutral-400);
		text-underline-offset: 0.2em;

		&:hover,
		&:focus-visible {
			text-decoration-color: currentColor;
		}
	}
</style>
