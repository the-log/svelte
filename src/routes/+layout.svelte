<script lang="ts">
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
  import { browser } from "$app/environment";
	import runQuery from 'src/utils/runQuery';
	import queries from 'src/utils/queries';
  import { userStore, teamStore } from "src/misc/stores";

  let isLoggedIn: boolean;
  let userName = '';

  userStore.subscribe((value) => {
		isLoggedIn = Boolean(value);
	});

  runQuery(queries['authenticated-item']).then((authItem) => {
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
  })

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
        userStore.set(null);
        goto('/login');
      }
    })
  }
</script>

<style lang="scss">
  nav {
    display: block;
    position: sticky;
    top: 0;

    :is(button, a) {
      display: block;
      padding: 1rem;
      border-left: 2px solid transparent;
      text-decoration: none;

      &:hover {
        color: var(--color-accent--2);
        text-decoration: underline;
      }
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
      <li><button>Show Labels</button></li>
      <li><a href="/">My Team</a></li>
      <li><a href="/teams">League</a></li>
      <li><a href="/players">Players</a></li>
      <li><a href="/free-agency">Free Agency</a></li>
      <li><a href="/rulebook">Rulebook</a></li>
      {#if isLoggedIn}
        <li class="float-right"><button on:click={logUserOut}>Log Out</button></li>
      {/if}
    </ul>
  </nav>
</div>
<main>
  <slot />
</main>
<footer>
  <p>&copy; 2023</p>
</footer>
