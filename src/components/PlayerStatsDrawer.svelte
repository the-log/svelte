<script lang="ts">
	import type { SlDrawer } from '@shoelace-style/shoelace';
	import PlayerStats from './PlayerStats.svelte';
	import { statsPlayerStore } from '../misc/stores';

	let drawer: SlDrawer | undefined = $state();

	let label = $derived.by(() => {
		if (!$statsPlayerStore) return '';
		const { name, team, position } = $statsPlayerStore;
		return [name, [team, position].filter(Boolean).join(', ')].filter(Boolean).join(' — ');
	});

	$effect(() => {
		if ($statsPlayerStore) drawer?.show();
	});

	// sl-after-hide bubbles from any Shoelace descendant, and a stale one can
	// arrive after show() interrupts a closing animation (open a new player
	// mid-close), so only clear the store for the drawer's own completed hide.
	function onAfterHide(event: Event) {
		if (event.target === drawer && !drawer?.open) statsPlayerStore.set(null);
	}
</script>

<sl-drawer bind:this={drawer} {label} onsl-after-hide={onAfterHide}>
	{#if $statsPlayerStore?.espn_id}
		{#key $statsPlayerStore.espn_id}
			<PlayerStats
				espn_id={$statsPlayerStore.espn_id}
				position={$statsPlayerStore.position ?? ''}
			/>
		{/key}
	{/if}
</sl-drawer>

<style>
	sl-drawer {
		--size: min(28rem, 100vw);
	}
</style>
