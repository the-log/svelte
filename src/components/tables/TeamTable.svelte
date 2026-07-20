<script lang="ts">
	import { onDestroy } from 'svelte';
	import Table from '../Table.svelte';
	import Actions from '../Actions.svelte';
	import { isMobile as layoutStore } from '../../misc/stores';
	import formatMoney from '../../utils/formatMoney';
	import type { RosterRow } from '../../types/defs';

	interface Props {
		title: string;
		players: RosterRow[];
		team: string | null;
	}

	let { title, players, team }: Props = $props();

	let isMobile: null | boolean = $state(null);

	let isReady = $state(false);

	const unsubscribeLayout = layoutStore.subscribe((value) => {
		setTimeout(() => {
			isMobile = value;
			isReady = true;
		}, 0);
	});
	onDestroy(unsubscribeLayout);
</script>

{#if players.length && isReady}
	<h2>{title}</h2>

	<Table columns={isMobile ? 3 : 5}>
		<div class="tablegrid-header tablegrid-row">
			{#if !isMobile}<div class="tablegrid-cell"></div>{/if}
			<div class="tablegrid-cell">Player</div>
			{#if !isMobile}<div class="tablegrid-cell">Team</div>{/if}
			<div class="tablegrid-cell">Salary</div>
			<div class="tablegrid-cell">Years</div>
		</div>

		{#each players as player (player.espn_id)}
			{@const {
				name,
				team: nflTeam,
				position,
				salary,
				years,
				espn_id,
				playerStatus,
				contractStatus,
				contract_id,
				needsAttention
			} = player}
			<div class="tablegrid-row {needsAttention ? 'needs-attention' : ''}" data-player-id={espn_id}>
				{#if !isMobile}
					<div class="tablegrid-cell tablegrid-thumbcell" status={playerStatus}>{position}</div>
				{/if}
				<div class="tablegrid-cell" status={isMobile ? playerStatus : null}>
					{name}
					{#if isMobile}
						<span class="text-minor">{nflTeam} - {position}</span>
					{/if}
				</div>
				{#if !isMobile}<div class="tablegrid-cell">{nflTeam}</div>{/if}
				<div class="tablegrid-cell">{formatMoney(salary)}</div>
				<div class="tablegrid-cell">{years}</div>
				<div class="tablegrid-cell tablegrid-actions">
					<Actions
						{espn_id}
						logTeam={team}
						status={contractStatus}
						{player}
						contract={contract_id}
					/>
				</div>
			</div>
		{/each}
	</Table>
{/if}

<style lang="scss">
	[status] {
		border-left: 2px solid transparent;
	}

	[status='out'],
	[status='injury_reserve'],
	[status='suspension'] {
		border-color: red;
	}

	[status='questionable'] {
		border-color: goldenrod;
	}

	.text-minor {
		font-size: 0.85rem;
		color: var(--sl-color-neutral-600);
	}

	h2 {
		margin-top: 2rem;
	}

	.needs-attention {
		color: var(--sl-color-danger-700);
	}
</style>
