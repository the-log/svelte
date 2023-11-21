<script lang="ts">
  import Icon from "src/components/Icon.svelte";
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

  function openDialog() {
    document.querySelector('#issue-report').show();
  }

  async function submitReport(e) {
    e.preventDefault();

    const summary = e.target.querySelector('sl-textarea').value;
    const { logs, navigator, location, innerHeight, innerWidth } = window;

    const body = `
## Report
${summary}

## Session Info
${location.href}
${navigator.userAgent}
${innerWidth}px x ${innerHeight}px
${JSON.stringify(logs)}
    `;

    const issue_data = {
      summary,
      path: location.href,
      browser_type: navigator.userAgent,
      browser_size: `${innerWidth}x${innerHeight}`,
      logs,
    }

    const reqUrl = `https://api.val.town/v1/run/andy_blum.createIssue?args=[${JSON.stringify(issue_data)}]`;

    const issue_url = await fetch(reqUrl).then(r => r.json());
    console.log(issue_url);
  }
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
    <li>
      <sl-tooltip content="Report Issue" placement="right">
        <sl-icon-button name="send-exclamation" label="Report Issue" on:click={openDialog}></sl-icon-button>
      </sl-tooltip>
    </li>
  </ul>
  <div>
    <sl-dialog label="Report An Issue" id="issue-report">
      <form id="issue-form" on:submit={submitReport}>
        <p>When submitted, your comments below and some information about your current session will be reported back to this site's github repository</p>
        <sl-textarea placeholder="What went wrong?" filled resize="auto"></sl-textarea>
        <p>&nbsp;</p>
        <sl-button variant="primary" type="submit">Submit</sl-button>
      </form>
    </sl-dialog>
  </div>
</nav>
