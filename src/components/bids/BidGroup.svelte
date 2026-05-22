<script lang="ts">
	import Table from '../Table.svelte';
	import { isMobile as layoutStore } from '../../misc/stores';

	interface Props {
		title?: string;
		children?: import('svelte').Snippet;
	}

	let { title = '', children }: Props = $props();

	let isMobile = $state(null);

	layoutStore.subscribe((value) => {
		isMobile = value;
	});
</script>

{#if title}
	<h4>{title}</h4>
{/if}
<Table columns={isMobile ? 2 : 3}>
	<div class="tablegrid-header tablegrid-row">
		{#if !isMobile}
			<div class="tablegrid-cell"></div>
		{/if}
		<div class="tablegrid-cell">
			Player
			<span class="text-minor">Team - Position</span>
		</div>
		{#if !isMobile}
			<div class="tablegrid-cell">
				Owner
				<span class="text-minor">Salary, Years</span>
			</div>
		{/if}
	</div>
	{@render children?.()}
</Table>

<style>
	h4:not(:first-of-type) {
		margin-top: 2rem;
	}
</style>
