<script lang="ts">
  import Icon from "src/components/Icon.svelte";
  import { afterNavigate } from '$app/navigation';

  function setActiveNav(route:string|undefined) {
    if (typeof route === 'string') {
      Array.from(document.querySelectorAll('nav sl-icon-button'))
        .forEach(item => {
          const link = item.shadowRoot?.querySelector('a');
          item.classList.toggle('is-active', link!.getAttribute('href') === route);
        })
    }
  }

  afterNavigate((navigation) => {
    setActiveNav(navigation.to?.route.id ?? undefined);
  })
</script>

<style lang="scss">
nav {
  box-shadow: var(--sl-shadow-up);
  ul {
    display: flex;
    gap: 0.5rem;
    justify-content: space-around;
    font-size: 2rem;
    border-top: 1px solid var(--color-bg--1);
    padding-bottom: 1.5rem;
  }

  :is(button, a) {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: flex-start;
    padding: 1rem;
    border-left: 2px solid transparent;
    border-bottom: 2px solid transparent;
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
    border-bottom-color: var(--color-accent--2);
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
</style>

<nav>
  <ul>
    <li>
      <sl-tooltip content="My Team" placement="right">
        <sl-icon-button name="house" label="My Team" href="/"></sl-icon-button>
      </sl-tooltip>
    </li>
    <li>
      <sl-tooltip content="Teams" placement="right">
        <sl-icon-button name="trophy" label="Teams" href="/teams"></sl-icon-button>
      </sl-tooltip>
    </li>
    <li>
      <sl-tooltip content="Players" placement="right">
        <sl-icon-button name="people" label="Players" href="/players"></sl-icon-button>
      </sl-tooltip>
    </li>
    <li>
      <sl-tooltip content="Free Agency" placement="right">
        <sl-icon-button name="tag" label="Free Agency" href="/free-agency"></sl-icon-button>
      </sl-tooltip>
    </li>
    <li>
      <sl-tooltip content="Rulebook" placement="right">
        <sl-icon-button name="book" label="Rulebook" href="/rulebook"></sl-icon-button>
      </sl-tooltip>
    </li>
  </ul>
</nav>
