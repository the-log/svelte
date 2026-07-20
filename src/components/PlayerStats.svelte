<script lang="ts">
	import { onMount } from 'svelte';
	import queries from '../utils/queries';
	import runQuery from '../utils/runQuery';
	import formatLength from '../utils/formatLength';
	import {
		dec1,
		getStatGroups,
		hasStats,
		statSetMeta,
		type FullStats,
		type StatSet
	} from '../utils/statMap';

	interface Props {
		espn_id: number;
		position: string;
	}

	interface PlayerDetails {
		height: number | null;
		weight: number | null;
		age: number | null;
		debutYear: number | null;
		draftYear: number | null;
		draftRound: number | null;
		draftSelection: number | null;
		seasonOutlook: string | null;
		fullStats: FullStats | null;
	}

	let { espn_id, position }: Props = $props();

	let details: PlayerDetails | null = $state(null);
	let failed = $state(false);

	onMount(() => {
		runQuery(queries['stats-by-player'], { id: espn_id }).then(({ data, errors }) => {
			if (errors || !data?.player) {
				failed = true;
				return;
			}
			details = data.player;
		});
	});

	let bio = $derived.by(() => {
		if (!details) return '';

		const draft = details.draftYear
			? `Drafted ${details.draftYear}` +
				(details.draftRound ? `, Rd ${details.draftRound} #${details.draftSelection}` : '')
			: details.debutYear
				? `Undrafted, debut ${details.debutYear}`
				: null;

		return [
			details.age ? `Age ${details.age}` : null,
			details.height ? formatLength(details.height) : null,
			details.weight ? `${Math.round(details.weight)} lbs` : null,
			draft
		]
			.filter(Boolean)
			.join(' · ');
	});

	let statSets = $derived(
		statSetMeta
			.map(({ key, label }) => ({ key, label, set: details?.fullStats?.[key] as StatSet }))
			.filter(({ set }) => hasStats(set))
	);
</script>

{#if failed}
	<p>Stats for this player could not be loaded.</p>
{:else if !details}
	<div class="loading"><sl-spinner></sl-spinner></div>
{:else}
	{#if bio}
		<p class="bio text-minor">{bio}</p>
	{/if}

	{#if statSets.length}
		<sl-tab-group>
			{#each statSets as { key, label } (key)}
				<sl-tab slot="nav" panel={key}>{label}</sl-tab>
			{/each}

			{#each statSets as { key, set } (key)}
				<sl-tab-panel name={key}>
					{#if set.appliedTotal != null}
						<p class="points">
							<strong>{dec1(set.appliedTotal)}</strong> pts
							{#if set.appliedAverage}
								<span class="text-minor">({dec1(set.appliedAverage)} / game)</span>
							{/if}
						</p>
					{/if}

					{#each getStatGroups(position, set) as group (group.title)}
						<section>
							<h4>{group.title}</h4>
							<dl>
								{#each group.rows as row (row.label)}
									<dt>{row.label}</dt>
									<dd>{row.value}</dd>
								{/each}
							</dl>
						</section>
					{/each}
				</sl-tab-panel>
			{/each}
		</sl-tab-group>
	{:else}
		<p>No stats available for this player.</p>
	{/if}

	{#if details.seasonOutlook}
		<section>
			<h4>Season Outlook</h4>
			<p class="outlook text-minor">{details.seasonOutlook}</p>
		</section>
	{/if}
{/if}

<style lang="scss">
	.loading {
		display: flex;
		justify-content: center;
		padding: 2rem;
		font-size: 2rem;
	}

	.bio {
		margin: 0 0 0.5rem;
	}

	.points {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
	}

	h4 {
		margin: 1.25rem 0 0.25rem;
	}

	dl {
		margin: 0;
		display: grid;
		grid-template-columns: 1fr auto;
	}

	dt,
	dd {
		margin: 0;
		padding: 0.25rem 0;
		border-bottom: 1px solid var(--color-bg--2);
	}

	dd {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.outlook {
		margin: 0;
	}
</style>
