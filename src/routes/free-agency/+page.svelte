<script lang="ts">
	import Bid from '../../components/bids/Bid.svelte';
	import BidGroup from '../../components/bids/BidGroup.svelte';
	import formatMoney from '../../utils/formatMoney';
	import queries from '../../utils/queries';
	import runQuery from '../../utils/runQuery';
	import type { Bid as BidRecord } from '../../types/defs';
	import { onMount } from 'svelte';
	import { leagueSettingsStore } from '../../misc/stores';

	let team = null;
	let myBids: BidRecord[] = [];
	let lockedBids: BidRecord[] = [];

	let due: string | null;
	let dueInterval: ReturnType<typeof setInterval> | undefined;
	$: due = null;

	function getBids() {
		runQuery(queries['all-bids']).then(({ data }) => {
			const { pending, published } = data;

			published.forEach((bid: BidRecord) => {
				bid.locked = new Date(bid.locked).toLocaleDateString();
			});

			const groupedByDate = Object.groupBy(published, (bid) => bid.locked);

			for (const date in groupedByDate) {
				if (Object.prototype.hasOwnProperty.call(groupedByDate, date)) {
					const bidsByDate = groupedByDate[date]?.toSorted((a, b) => b.salary - a.salary);
					const groupedByPlayer = Object.groupBy(bidsByDate, (bid) => bid.eval_order);
					groupedByDate[date] = groupedByPlayer;
				}
			}

			lockedBids = groupedByDate;
			myBids = pending;
		});
	}

	function calculateDiff(now: number, target = 0) {
		let diff = target - now;

		const ms_per = {
			second: 1_000,
			minute: 1_000 * 60,
			hour: 1_000 * 60 * 60,
			day: 1_000 * 60 * 60 * 24
		};

		if (diff < 0) {
			return {
				days: 0,
				hours: 0,
				minutes: 0,
				seconds: 0
			};
		}

		let days = Math.floor(diff / ms_per.day);
		diff = diff - days * ms_per.day;

		let hours = Math.floor(diff / ms_per.hour);
		diff = diff - hours * ms_per.hour;

		let minutes = Math.floor(diff / ms_per.minute);
		diff = diff - minutes * ms_per.minute;

		let seconds = Math.floor(diff / ms_per.second);

		return { days, hours, minutes, seconds };
	}

	function padInt(int: number) {
		if (int < 10) {
			return int.toString().padStart(2, '0');
		} else {
			return int.toString();
		}
	}

	let deadlines: number[] = [];

	// bid_deadlines is a Keystone json() field; entries may be epoch numbers
	// or ISO strings.
	function toTimestamp(value: unknown): number {
		if (typeof value === 'number') return value;
		if (typeof value === 'string') return new Date(value).getTime();
		return NaN;
	}

	function updateDue() {
		const now = Date.now();
		const target = deadlines.find((deadline) => deadline > now);

		if (!target) {
			due = null;
			return;
		}

		const { days, hours, minutes, seconds } = calculateDiff(now, target);
		due = `${padInt(days)}:${padInt(hours)}:${padInt(minutes)}:${padInt(seconds)}`;
	}

	const unsubscribeSettings = leagueSettingsStore.subscribe((values) => {
		deadlines = (values?.bid_deadlines ?? [])
			.map(toTimestamp)
			.filter((timestamp: number) => !Number.isNaN(timestamp))
			.sort((a: number, b: number) => a - b);

		clearInterval(dueInterval);
		dueInterval = undefined;

		if (deadlines.length) {
			updateDue();
			dueInterval = setInterval(updateDue, 1000);
		} else {
			due = null;
		}
	});

	onMount(() => {
		window.addEventListener('action-taken', getBids);
		getBids();

		return () => {
			clearInterval(dueInterval);
			unsubscribeSettings();
			window.removeEventListener('action-taken', getBids);
		};
	});
</script>

<svelte:head>
	<title>Free Agency — The League of Ordinary Gentlemen</title>
</svelte:head>

<h2>Pending Bids {due ? `(${due})` : ''}</h2>
<BidGroup title="My Bids">
	{#each myBids as bid, i}
		<Bid {bid} index={i + 1} />
	{/each}
</BidGroup>

<hr />

<h2>Auction Results</h2>
{#each Object.entries(lockedBids).reverse() as [date, bidGroups], i}
	<sl-details open={i === 0}>
		<h3 slot="summary">{date}</h3>
		{#each Object.entries(bidGroups) as [espnid, bids]}
			<BidGroup title={bids[0].player.name}>
				{#each bids.toSorted((a, b) => a.bid_order - b.bid_order) as bid, j}
					<Bid {bid} index={j + 1} />
				{/each}
			</BidGroup>
		{/each}
	</sl-details>
{/each}

{#if !Object.entries(lockedBids).length}
	<em>Locked results are sorted and displayed here</em>
{/if}

<style lang="scss">
	sl-details {
		& + sl-details {
			margin-top: 1rem;
		}

		h3 {
			margin: 0;
		}
	}
</style>
