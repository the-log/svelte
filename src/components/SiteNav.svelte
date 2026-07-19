<script lang="ts">
	import { page } from '$app/stores';
	import { leagueSettingsStore } from '../misc/stores';

	let routeId = $derived($page.route?.id ?? '');

	// Svelte sets attributes on upgraded custom elements as DOM properties, so
	// client-rendered buttons may carry no href attribute at all; the active
	// state must be computed from route state, not read back out of the DOM.
	function isActive(href: string) {
		return href === '/' ? routeId === '/' : routeId === href || routeId.startsWith(`${href}/`);
	}

	const inSeason = 'active';
	const offSeason = ['off', 'draft', 'rfa'];
	let phase = $state('');

	leagueSettingsStore.subscribe((values) => {
		phase = values?.phase ?? '';
	});
</script>

<nav>
	<ul>
		<li>
			<sl-tooltip content="My Team" placement="right">
				<sl-icon-button
					src="/icons/home-alt.svg"
					label="My Team"
					href="/"
					class:is-active={isActive('/')}
				></sl-icon-button>
			</sl-tooltip>
		</li>
		<li>
			<sl-tooltip content="Teams" placement="right">
				<sl-icon-button
					src="/icons/pennant.svg"
					label="Teams"
					href="/teams"
					class:is-active={isActive('/teams')}
				></sl-icon-button>
			</sl-tooltip>
		</li>
		<li>
			<sl-tooltip content="Players" placement="right">
				<sl-icon-button
					src="/icons/football-helmet.svg"
					label="Players"
					href="/players"
					class:is-active={isActive('/players')}
				></sl-icon-button>
			</sl-tooltip>
		</li>
		<li>
			<sl-tooltip content="Free Agency" placement="right">
				{#if offSeason.includes(phase)}
					<sl-icon-button
						src="/icons/tags.svg"
						label="Restricted Free Agency"
						href="/rfa"
						class:is-active={isActive('/rfa')}
					></sl-icon-button>
				{/if}
				{#if inSeason === phase}
					<sl-icon-button
						src="/icons/tags.svg"
						label="Free Agency"
						href="/free-agency"
						class:is-active={isActive('/free-agency')}
					></sl-icon-button>
				{/if}
			</sl-tooltip>
		</li>
		<li>
			<sl-tooltip content="Rulebook" placement="right">
				<sl-icon-button
					src="/icons/book.svg"
					label="Rulebook"
					href="/rulebook"
					class:is-active={isActive('/rulebook')}
				></sl-icon-button>
			</sl-tooltip>
		</li>
	</ul>
</nav>

<style lang="scss">
	nav {
		position: sticky;
		top: 0;
		box-shadow: var(--sl-shadow-up);
		ul {
			display: flex;
			gap: 0.5rem;
			justify-content: space-around;
			font-size: 2rem;
			border-top: 1px solid var(--color-bg--1);
			padding-bottom: 1.5rem;
		}

		sl-icon-button {
			color: var(--color-text--main);
			font-size: 1.5rem;
		}
	}

	@media (min-width: 45rem) {
		nav {
			box-shadow: none;
			ul {
				border-top: none;
				flex-direction: column;
				justify-content: flex-start;
				padding-bottom: 0;
			}

			:global(:is(button, a).is-active) {
				border-bottom-color: transparent;
				border-left-color: var(--color-accent--2);
			}
		}
	}

	:global(sl-icon-button) {
		border-top: 3px solid transparent;
	}

	:global(sl-icon-button.is-active) {
		border-top-color: var(--color-accent--1);
	}

	@media (min-width: 45rem) {
		:global(sl-icon-button) {
			border-top: none;
			border-left: 3px solid transparent;
		}

		:global(sl-icon-button.is-active) {
			border-left-color: var(--color-accent--1);
		}
	}

	#issue-report {
		--width: min(800px, calc(100vw - 2rem));
	}
</style>
