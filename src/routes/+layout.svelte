<script module>
	if (browser) {
		import('../misc/shoelace');
	}
</script>

<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import runQuery from '../utils/runQuery';
	import queries from '../utils/queries';
	import { userStore, authStatusStore, isMobile, leagueSettingsStore } from '../misc/stores';
	import UserMenu from '../components/UserMenu.svelte';
	import SiteNav from '../components/SiteNav.svelte';
	import PlayerStatsDrawer from '../components/PlayerStatsDrawer.svelte';
	import { onMount } from 'svelte';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	let isLoggedIn: boolean;

	const unauthPaths = ['/login', '/reset'];

	interface AuthItemResponse {
		data?: {
			authenticatedItem?: {
				id: string;
				name: string | null;
				isAdmin: boolean;
				team?: { id: string; name: string; abbreviation: string } | null;
			} | null;
		} | null;
	}

	function authItemUpdated(authItem: AuthItemResponse) {
		const authenticatedItem = authItem?.data?.authenticatedItem;

		userStore.set({
			isAdmin: authenticatedItem?.isAdmin,
			userID: authenticatedItem?.id,
			userName: authenticatedItem?.name,
			teamID: authenticatedItem?.team?.id
		});

		authStatusStore.set(Boolean(authenticatedItem?.id));

		runQuery(queries['league-settings']).then(({ data }) => {
			leagueSettingsStore.set(data?.leagueSetting ?? null);
		});

		if (browser) {
			const currentPath = window.location.pathname;
			if (!isLoggedIn && !unauthPaths.includes(currentPath)) {
				goto(resolve('/login'));
			}
		}
	}

	// Session checks are browser-only: during SSR the layout renders the same
	// shell either way, and a server-side fetch here would hit the real API on
	// every render (see also teams/[name], which skips its query during SSR).
	authStatusStore.subscribe((value) => {
		isLoggedIn = value;
		if (browser) {
			runQuery(queries['authenticated-item']).then(authItemUpdated);
		}
	});

	if (browser) {
		runQuery(queries['authenticated-item']).then(authItemUpdated);
	}

	beforeNavigate((navigation) => {
		if (!isLoggedIn && !unauthPaths.includes(navigation.to?.route?.id || '')) {
			navigation.cancel();
			goto(resolve('/login'));
		} else {
			console.clear();
		}
	});

	function logUserOut() {
		runQuery(queries['end-session']).then(({ data }) => {
			if (data.endSession) {
				authStatusStore.set(false);
				goto(resolve('/login'));
			}
		});
	}

	onMount(() => {
		const mq = window.matchMedia('(max-width:45rem)');
		isMobile.set(mq.matches);
		mq.addEventListener('change', () => {
			isMobile.set(mq.matches);
		});
	});
</script>

<svelte:head></svelte:head>
<header>
	<h1>The League <span>of Ordinary Gentlemen</span></h1>
	<UserMenu>
		{#if $authStatusStore}
			<sl-button onclick={logUserOut} size="small" variant="primary" outline>Log Out</sl-button>
		{:else}
			<sl-button href="/login" size="small" variant="primary" outline>Log In</sl-button>
		{/if}
	</UserMenu>
</header>
<div id="site-nav">
	{#if $authStatusStore}
		<SiteNav />
	{/if}
</div>
<main>
	{@render children?.()}
</main>
<footer>
	<p>
		&copy; 2010-{new Date().getFullYear()} The League of Ordinary Gentlemen. All Rights Reserved.
	</p>
</footer>
<PlayerStatsDrawer />

<style lang="scss">
	header,
	main,
	#site-nav,
	footer {
		width: 100%;
		max-width: 100%;
	}

	header {
		grid-area: head;
		padding-top: 2rem;
		display: flex;
		justify-content: space-between;
		padding-top: 1rem;

		@media (max-width: 45rem) {
			sl-button {
				display: none;
			}
		}
	}

	h1 {
		font-style: italic;

		span {
			font-size: 1rem;
			font-weight: normal;
			color: var(--color-accent--2);
		}
	}

	#site-nav {
		grid-area: nav;
		background: var(--color-bg--2);
		position: sticky;
		z-index: 1;
		bottom: 0;
	}

	main {
		grid-area: body;

		padding: 0 0.5rem;

		@media (min-width: 45rem) {
			padding: 0;
		}
	}

	#alert-container {
		position: relative;
	}

	footer {
		grid-area: foot;
		padding-bottom: 2rem;
		text-align: center;
		font-size: 0.85rem;
		color: var(--sl-color-neutral-600);
	}
</style>
