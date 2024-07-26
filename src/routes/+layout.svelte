<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import { browser } from "$app/environment";
	import runQuery from '../utils/runQuery';
	import queries from '../utils/queries';
  import { userStore, authStatusStore, isMobile } from "../misc/stores";
  import UserMenu from '../components/UserMenu.svelte';
	import SiteNav from '../components/SiteNav.svelte';
	import { onMount } from 'svelte';

  let isLoggedIn: boolean;
  let userName = '';


  function authItemUpdated(authItem: any)  {
    const {data} = authItem;
    const {authenticatedItem} = data;

    userStore.set({
      userID: authenticatedItem?.id,
      userName: authenticatedItem?.name,
      teamID: authenticatedItem?.team?.id,
    });

    authStatusStore.set(Boolean(authenticatedItem?.id));

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

  runQuery(queries['authenticated-item']).then(authItemUpdated)

  const unauthPaths = [
    '/login',
    '/reset'
  ]

  beforeNavigate((navigation) => {
    if (!isLoggedIn && !unauthPaths.includes(navigation.to?.route?.id || '')) {
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

<script context="module">
  if (browser) {
    import('@shoelace-style/shoelace')
  }
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

    @media (max-width:45rem) {
      sl-button { display: none; }
    }
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

<svelte:head>

</svelte:head>
<header>
  <h1>The League <span>of Ordinary Gentlemen</span></h1>
  <UserMenu>
    <sl-button on:click={logUserOut} size="small" variant="primary" outline>Log Out</sl-button>
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
