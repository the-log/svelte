<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import { browser } from "$app/environment";
	import runQuery from 'src/utils/runQuery';
	import queries from 'src/utils/queries';
  import { userStore, teamStore, authStatusStore, isMobile } from "src/misc/stores";
  import UserMenu from 'src/components/UserMenu.svelte';
	import SiteNav from 'src/components/SiteNav.svelte';
	import { onMount } from 'svelte';

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

  function logUserOut() {
    runQuery(queries['end-session']).then(({data}) => {
      if (data.endSession) {
        authStatusStore.set(false);
        goto('/login');
      }
    })
  }

  onMount(() => {
    const mq = window.matchMedia('(max-width:45rem)');
    isMobile.set(mq.matches);
    mq.addEventListener('change', () => {
      isMobile.set(mq.matches);
    });
  });
</script>

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
  }

  h1 {
    font-style: italic;

    span {
      font-size: 1rem;
      font-weight: normal;
      color: var(--color-accent--2)
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

  footer {
    grid-area: foot;
    padding-bottom: 2rem;
    text-align: center;
    font-size: 0.85rem;
    color: var(--sl-color-neutral-600);
  }
</style>

<header>
  <h1>The League <span>of Ordinary Gentlemen</span></h1>
  <UserMenu>
    <button on:click={logUserOut}>Log Out</button>
  </UserMenu>
</header>
<div id="site-nav">
  <SiteNav />
</div>
<main>
  <slot />
</main>
<footer>
  <p>&copy; 2010-{(new Date()).getFullYear()} The League of Ordinary Gentlemen. All Rights Reserved.</p>
</footer>
