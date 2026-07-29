<script lang="ts">
	import formatMoney from '../../utils/formatMoney';
	import runQuery from '../../utils/runQuery';
	import queries from '../../utils/queries';
	import {
		buildAvailableWhere,
		buildDraftBoard,
		buildLiveWhere,
		type DraftBoardGroup,
		type DraftBoardRow,
		type DraftPlayer,
		PROJECTION_FLOOR
	} from '../../utils/draftBoard';
	import Table from '../../components/Table.svelte';
	import StatsTrigger from '../../components/StatsTrigger.svelte';
	import { isMobile as layoutStore, userStore } from '../../misc/stores';
	import { onDestroy, onMount } from 'svelte';

	let groups: DraftBoardGroup[] = $state([]);
	let loaded = $state(false);
	let includeDeepPool = $state(false);
	let teamID: string | number | null = null;

	// The board is two pools with very different churn. The static pool
	// (uncontracted players) doesn't move during the RFA auction, so it's
	// fetched once per visit and again when the deep-pool toggle changes. The
	// live pool (RFA contracts + the owner's team) is where bids land, so it's
	// small and polled frequently. Each pool guards against its own responses
	// resolving out of order; only the most recently issued request may write.
	let staticPool: DraftPlayer[] = [];
	let livePool: DraftPlayer[] = [];
	let staticLoaded = false;
	let liveLoaded = false;

	const rebuild = () => {
		groups = buildDraftBoard([...staticPool, ...livePool]);
		loaded = staticLoaded && liveLoaded;
	};

	let staticSeq = 0;
	const fetchStaticPool = () => {
		const seq = ++staticSeq;
		const where = buildAvailableWhere(includeDeepPool);
		runQuery(queries['draft-board'], { where }).then(({ data }) => {
			if (seq !== staticSeq || !data?.players) return;
			staticPool = data.players;
			staticLoaded = true;
			rebuild();
		});
	};

	let liveSeq = 0;
	const fetchLivePool = () => {
		const seq = ++liveSeq;
		const where = buildLiveWhere(teamID);
		runQuery(queries['draft-board'], { where }).then(({ data }) => {
			if (seq !== liveSeq || !data?.players) return;
			livePool = data.players;
			liveLoaded = true;
			rebuild();
		});
	};

	const onDeepPoolToggle = (event: Event) => {
		includeDeepPool = (event.target as HTMLInputElement).checked;
		fetchStaticPool();
	};

	// The live pool's roster branch needs the team id, so refetch when the
	// session arrives (the store emits again on every auth re-check).
	const unsubscribeUser = userStore.subscribe((value) => {
		if (!value) return;
		const nextTeamID = value.teamID ?? null;
		if (nextTeamID !== teamID) {
			teamID = nextTeamID;
			fetchLivePool();
		}
	});

	let interval: ReturnType<typeof setInterval>;
	onMount(() => {
		fetchStaticPool();
		fetchLivePool();
		interval = setInterval(fetchLivePool, 5000);

		return () => clearInterval(interval);
	});

	let isMobile: null | boolean = $state(null);
	const unsubscribeLayout = layoutStore.subscribe((value) => {
		setTimeout(() => {
			isMobile = value;
		}, 0);
	});

	onDestroy(() => {
		unsubscribeUser();
		unsubscribeLayout();
	});

	const oneDecimal = (value: number | null | undefined) => (value == null ? '—' : value.toFixed(1));

	function contractSummary(row: DraftBoardRow): string {
		const { contract } = row;
		if (!contract) return '';
		if (contract.status === 'waived') return `waived · ${contract.team.abbreviation}`;
		if (contract.status === 'rfa') return `RFA · ${contract.team.abbreviation}`;
		return `${contract.years} yr${contract.years === 1 ? '' : 's'} · ${contract.status}`;
	}
</script>

<svelte:head>
	<title>Draft Board — The League of Ordinary Gentlemen</title>
</svelte:head>

<h1>Draft Board</h1>

<div class="board-controls">
	<ul class="legend">
		<li data-group="roster">Your roster</li>
		<li data-group="rfa">Restricted free agent</li>
		<li data-group="fa">Free agent</li>
	</ul>
	<sl-switch size="small" onsl-change={onDeepPoolToggle}>
		Include players under {PROJECTION_FLOOR} projected points
	</sl-switch>
</div>

{#if loaded && !groups.length}
	<p>No draft-eligible players found.</p>
{/if}

<Table columns={isMobile ? 2 : 7}>
	<div class="tablegrid-header tablegrid-row">
		{#if !isMobile}
			<div class="tablegrid-cell"><span class="visually-hidden">Position</span></div>
		{/if}
		<div class="tablegrid-cell">Name</div>
		{#if !isMobile}
			<div class="tablegrid-cell">Proj Rank</div>
		{/if}
		<div class="tablegrid-cell">Points<span class="text-minor">last yr / proj</span></div>
		{#if !isMobile}
			<div class="tablegrid-cell">Contract</div>
			<div class="tablegrid-cell">Dropoff<span class="text-minor">season / game</span></div>
			<div class="tablegrid-cell">$ / Pt</div>
		{/if}
	</div>
	{#each groups as group (group.weight)}
		<div class="tablegrid-row group-header">
			<h2 class="tablegrid-cell">{group.label}</h2>
		</div>
		{#each group.rows as row (row.espn_id)}
			{@const { espn_id, name, team, position, contract } = row}
			<div class="tablegrid-row" data-group={row.group} data-player-id={espn_id}>
				{#if !isMobile}
					<div class="tablegrid-cell tablegrid-thumbcell" status={row.injuryStatus.toLowerCase()}>
						{position}
					</div>
				{/if}
				<div class="tablegrid-cell">
					<StatsTrigger player={{ espn_id, name, team, position }} />
					<span class="text-minor">
						{team} - {position} #{row.positionRankProj || '—'}
						{#if isMobile && contract}
							· {contract.status === 'rfa' ? 'RFA' : contract.status}
							{formatMoney(contract.salary)}{/if}
					</span>
				</div>
				{#if !isMobile}
					<div class="tablegrid-cell">
						#{row.overallRankProj || '—'}
						<span class="text-minor">#{row.positionRankProj || '—'} {position}</span>
					</div>
				{/if}
				<div class="tablegrid-cell">
					{oneDecimal(row.pointsLastYear)} / {oneDecimal(row.pointsThisYearProj)}
					{#if isMobile}
						<span class="text-minor">
							drop {oneDecimal(row.dropoffYear)}
						</span>
					{/if}
				</div>
				{#if !isMobile}
					<div class="tablegrid-cell">
						{#if contract && contract.status !== 'waived'}
							{formatMoney(contract.salary)}
							{#if contract.isFranchiseTagged}<span class="ft">FT</span>{/if}
						{:else}
							—
						{/if}
						<span class="text-minor">{contractSummary(row)}</span>
					</div>
					<div class="tablegrid-cell">
						{oneDecimal(row.dropoffYear)}
						<span class="text-minor">
							{row.dropoffPerGame == null ? '—' : row.dropoffPerGame.toFixed(2)} / gm
						</span>
					</div>
					<div class="tablegrid-cell">
						{row.centsPerPoint == null ? '—' : formatMoney(row.centsPerPoint)}
					</div>
				{/if}
			</div>
		{/each}
	{/each}
</Table>

<style lang="scss">
	.board-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		list-style: none;
		margin: 0;
		padding: 0;
		font-size: 0.85rem;

		li::before {
			content: '';
			display: inline-block;
			width: 0.75em;
			height: 0.75em;
			margin-right: 0.5em;
			border-radius: 50%;
			background: var(--color-bg--3);
		}

		li[data-group='roster']::before {
			background: var(--color-accent--1);
		}

		li[data-group='rfa']::before {
			background: goldenrod;
		}
	}

	.group-header {
		background: none;

		h2 {
			margin: 0;
			padding-top: 2rem;
			grid-column: 1 / -1;
			font-size: 1.1rem;
		}
	}

	.tablegrid-header .text-minor {
		font-weight: normal;
	}

	.tablegrid-row[data-group='roster'] {
		border-left: 3px solid var(--color-accent--1);
	}

	.tablegrid-row[data-group='rfa'] {
		border-left: 3px solid goldenrod;
	}

	.tablegrid-row[data-group='fa'] {
		border-left: 3px solid transparent;
	}

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

	.ft {
		color: goldenrod;
	}
</style>
