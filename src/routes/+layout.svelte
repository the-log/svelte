<script lang="ts">
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
  import { browser } from "$app/environment";
	import runQuery from 'src/utils/runQuery';
	import queries from 'src/utils/queries';
  import { userStore, teamStore, authStatusStore } from "src/misc/stores";
  import Icon from "src/components/Icon.svelte";

  let isLoggedIn: boolean;
  let userName = '';

  function authItemUpdated(authItem: any)  {
    const {data} = authItem;
    const {authenticatedItem} = data;

    userStore.set(authenticatedItem);
    teamStore.set(authenticatedItem?.team?.abbreviation ?? null);

    userName = authenticatedItem?.name || '';

    if (browser) {
      if (!isLoggedIn) {
        goto('/login');
      }
    }
  }

  authStatusStore.subscribe((value) => {
    isLoggedIn = value;
    runQuery(queries['authenticated-item']).then(authItemUpdated)
  });

  userStore.subscribe((value) => {
		isLoggedIn = Boolean(value);
	});

  runQuery(queries['authenticated-item']).then(authItemUpdated)


  beforeNavigate((navigation) => {
    if (!isLoggedIn && navigation.to?.route.id !== '/login') {
      navigation.cancel();
    } else {
      console.clear();
    }
  })

  afterNavigate((navigation) => {
    setActiveNav(navigation.to?.route.id ?? undefined);
  })

  function setActiveNav(route:string|undefined) {
    if (typeof route === 'string') {
      document.querySelectorAll('nav a').forEach(link => {
        link.classList.toggle('is-active', link.getAttribute('href') === route);
      });
    }
  }

  function logUserOut() {
    runQuery(queries['end-session']).then(({data}) => {
      if (data.endSession) {
        authStatusStore.set(false);
      }
    })
  }

  function toggleLabels(e: PointerEvent) {
    const button = e.target!;

    (button as HTMLButtonElement).closest('nav')?.querySelectorAll('.menu-text').forEach(label => {
      label.classList.toggle('visually-hidden')
    });
  }
</script>

<style lang="scss">
  nav {
    display: block;
    position: sticky;
    top: 0;

    :is(button, a) {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      justify-content: flex-start;
      padding: 1rem;
      border-left: 2px solid transparent;
      text-decoration: none;
      width: 100%;
      white-space: nowrap;

      &:hover {
        text-decoration: underline;
      }
    }

    a:hover {
      color: var(--color-accent--2);
    }

    :global(:is(button, a).is-active) {
      background-color: var(--color-bg--1);
      border-left-color: var(--color-accent--2);
    }
  }
</style>

<header>
  <h1><span>The</span> League</h1>
  <span>{userName}</span>
</header>
<div id="site-nav">
  <nav>
    <ul>
      <li><button on:click={toggleLabels}>
        <Icon name="list"></Icon>
        <span class="menu-text visually-hidden">Toggle Labels</span>
      </button></li>
      <li><a href="/">
        <Icon name="house"></Icon>
        <span class="menu-text visually-hidden">My Team</span>
      </a></li>
      <li><a href="/teams">
        <Icon name="people"></Icon>
        <span class="menu-text visually-hidden">Teams</span>
      </a></li>
      <li><a href="/players">
        <Icon name="football"></Icon>
        <span class="menu-text visually-hidden">Players</span>
      </a></li>
      <li><a href="/free-agency">
        <Icon name="add_file"></Icon>
        <span class="menu-text visually-hidden">Free Agency</span>
      </a></li>
      <li><a href="/rulebook">
        <Icon name="crown"></Icon>
        <span class="menu-text visually-hidden">Rulebook</span>
      </a></li>
      <!-- {#if isLoggedIn}
        <li class="float-right"><button on:click={logUserOut}>Log Out</button></li>
      {/if} -->
    </ul>
  </nav>
</div>
<main>
  <slot />
</main>
<footer>
  <p>&copy; 2023</p>
</footer>
