<script lang="ts">
  import { afterNavigate } from '$app/navigation';

  function setActiveNav(route:string|undefined) {
    if (typeof route === 'string') {
      document.querySelectorAll("nav sl-icon-button")
        .forEach(item => {
          item.classList.toggle('is-active', item.matches(`sl-icon-button[href="${route}"]`))
        });
    }
  }

  afterNavigate((navigation) => {
    setActiveNav(navigation.to?.route.id ?? undefined);
  })
</script>

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
  --width: min(800px, calc(100vw - 2rem))
}
</style>

<nav>
  <ul>
    <li>
      <sl-tooltip content="My Team" placement="right">
        <sl-icon-button src="/icons/home-alt.svg" label="My Team" href="/"></sl-icon-button>
      </sl-tooltip>
    </li>
    <li>
      <sl-tooltip content="Teams" placement="right">
        <sl-icon-button src="/icons/pennant.svg" label="Teams" href="/teams"></sl-icon-button>
      </sl-tooltip>
    </li>
    <li>
      <sl-tooltip content="Players" placement="right">
        <sl-icon-button src="/icons/football-helmet.svg" label="Players" href="/players">
        </sl-icon-button>
      </sl-tooltip>
    </li>
    <li>
      <sl-tooltip content="Restricted Free Agency" placement="right">
        <sl-icon-button src="/icons/tags.svg" label="Restricted Free Agency" href="/rfa "></sl-icon-button>
      </sl-tooltip>
    </li>
    <li>
      <sl-tooltip content="Rulebook" placement="right">
        <sl-icon-button name="book" label="Rulebook" href="/rulebook"></sl-icon-button>
      </sl-tooltip>
    </li>
  </ul>
</nav>
