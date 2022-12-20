<script lang="ts">
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
  import { browser } from "$app/environment";
	import runQuery from 'src/utils/runQuery';
	import queries from 'src/utils/queries';
  import { userStore, teamStore } from "src/misc/stores";

  let isLoggedIn: boolean;
  userStore.subscribe((value) => {
		isLoggedIn = Boolean(value);
	});

  runQuery(queries['authenticated-item']).then((authItem) => {
    const {data} = authItem;
    const {authenticatedItem} = data;

    userStore.set(authenticatedItem);
    teamStore.set(authenticatedItem?.team?.abbreviation ?? null);
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

<style>
  nav {
    margin: 0 0 2rem;
    padding: 1rem 0 0 ;
    box-shadow: 0 0 5px 5px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    background-color: white;
  }
  nav ul {
    display: flex;
    width: 100%;
    border-bottom: 1px solid rgb(230,230,230);
    padding: 0 1rem
  }
  nav button {
    all: unset;
  }
  nav :is(a, button) {
    display: inline-block;
    padding: 0.5rem;
    border-bottom: 1px solid black;
    margin-bottom: -1px;
    text-decoration: none;
    font-weight: bold;
  }

  nav :is(a, button):not(.is-active) {
    opacity: 0.5;
    border-bottom-color: transparent;
  }

  nav :is(a, button):not(.is-active):hover {
    opacity: 0.75;
    background: rgba(0,0,0,0.05);
  }

  nav li.float-right {
    margin-left: auto;
  }

  main, nav ul {
    width: 100%;
    max-width: 64rem;
    margin: 0 auto;
  }

  main {
    padding: 0 3rem;
  }
</style>

<nav>
  <ul>
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
<main>
  <slot />
</main>
