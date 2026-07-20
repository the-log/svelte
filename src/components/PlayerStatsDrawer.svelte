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
</script>

<sl-drawer bind:this={drawer} {label} onsl-after-hide={() => statsPlayerStore.set(null)}>
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
