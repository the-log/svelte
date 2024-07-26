<script lang="ts">
  import { marked } from 'marked';
  import { isMobile as layoutStore } from "src/misc/stores";

  let isMobile: null | Boolean;
  $: isMobile = null;
  $: isReady = false;
  layoutStore.subscribe((value) => {
    setTimeout(() => {
      isMobile = value;
      isReady = true;
    }, 0);
  });

  let pages: string[];
  $: pages = [];

  async function getRules() {
    const toc = await fetch('https://api.github.com/repos/the-log/rulebook/contents/').then(r => r.json());
    Promise.allSettled(toc.map(pageInfo => fetch(pageInfo.download_url).then(r => r.text())))
      .then(fetchedPages => {
        pages = fetchedPages.map(fetchedPage => {
          if (fetchedPage.status === 'fulfilled') {
            let chapter = fetchedPage.value.split('\n');
            let headline = chapter.filter(s => s.startsWith('##'))[0];
            let body = chapter.filter(s => !s.startsWith('##'));

            if (headline) {
              headline = headline.substring(3);
            }

            if (body.length) {
              body = marked.parse(body.join('\n'))
            }

            return { headline, body }
          }
        });
      });
    }

  getRules();
</script>

<style>
  #rulebook {
    margin-bottom: 1rem;
  }

  #rulebook :global(ol),
  #rulebook :global(ul) {
    list-style-position: outside;
    padding-inline-start: 2rem;
  }

  #rulebook :global(ol) {
    list-style-type: decimal;
  }

  #rulebook :global(ul) {
    list-style-type: circle;
  }

  #rulebook  :global(li) {
    padding: 0.25rem 0;
  }
</style>

<h2>Rulebook</h2>

<sl-tab-group id="rulebook">
  {#each pages as page, i}
    <sl-tab slot="nav" panel="chapter-{i}" active='{i === 0}'>{page.headline}</sl-tab>
  {/each}

  {#each pages as page, i}
    <sl-tab-panel name="chapter-{i}" active='{i === 0}'>
      <h2>{page.headline}</h2>
      {@html page.body}
    </sl-tab-panel>
  {/each}
</sl-tab-group>
