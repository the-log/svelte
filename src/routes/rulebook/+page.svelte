<script lang="ts">
	import { marked } from 'marked';
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { isMobile as layoutStore } from '../../../src/misc/stores';

	let isMobile: null | boolean = $state(null);

	let isReady = $state(false);

	const unsubscribeLayout = layoutStore.subscribe((value) => {
		setTimeout(() => {
			isMobile = value;
			isReady = true;
		}, 0);
	});
	onDestroy(unsubscribeLayout);

	let pages: { headline: string; body: string }[] = $state([]);
	let loadFailed = $state(false);

	async function getRules() {
		try {
			const response = await fetch('https://api.github.com/repos/the-log/rulebook/contents/');
			const toc = await response.json();

			// When rate-limited or unavailable, the GitHub API returns an object
			// with a message instead of the directory array.
			if (!response.ok || !Array.isArray(toc)) {
				console.error('Unable to load the rulebook listing', toc);
				loadFailed = true;
				return;
			}

			const fetchedPages = await Promise.allSettled(
				toc.map((pageInfo) => fetch(pageInfo.download_url).then((r) => r.text()))
			);

			pages = fetchedPages
				.filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
				.map((result) => {
					const chapter = result.value.split('\n');
					const headline = chapter.find((s) => s.startsWith('##'))?.substring(3) ?? '';
					const body = chapter.filter((s) => !s.startsWith('##')).join('\n');

					return { headline, body: body ? (marked.parse(body) as string) : '' };
				})
				.filter((page) => page.headline && page.body);

			loadFailed = pages.length === 0;
		} catch (error) {
			console.error(error);
			loadFailed = true;
		}
	}

	if (browser) {
		getRules();
	}
</script>

<svelte:head>
	<title>Rulebook — The League of Ordinary Gentlemen</title>
</svelte:head>

<h2>Rulebook</h2>

{#if loadFailed}
	<p>
		The rulebook couldn't be loaded right now (it lives on GitHub, which may be rate-limiting
		requests). Please try again in a few minutes, or read it directly at
		<a href="https://github.com/the-log/rulebook">github.com/the-log/rulebook</a>.
	</p>
{/if}

<sl-tab-group id="rulebook">
	{#each pages as page, i}
		<sl-tab slot="nav" panel="chapter-{i}" active={i === 0}>{page.headline}</sl-tab>
	{/each}

	{#each pages as page, i}
		<sl-tab-panel name="chapter-{i}" active={i === 0}>
			<h2>{page.headline}</h2>
			{@html page.body}
		</sl-tab-panel>
	{/each}
</sl-tab-group>

<style>
	#rulebook {
		margin-bottom: 1rem;
	}

	#rulebook :global(ol),
	#rulebook :global(ul) {
		list-style-position: outside;
		padding-inline-start: 2rem;
	}

	#rulebook :global(ol) {
		list-style-type: decimal;
	}

	#rulebook :global(ul) {
		list-style-type: circle;
	}

	#rulebook :global(li) {
		padding: 0.25rem 0;
	}
</style>
