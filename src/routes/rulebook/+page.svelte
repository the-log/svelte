<script lang="ts">
  import { marked } from 'marked';

  let pages: string[] = [];

  async function getRules() {
    const toc = await fetch('https://api.github.com/repos/the-log/rulebook/contents/').then(r => r.json());
    Promise.allSettled(toc.map(pageInfo => fetch(pageInfo.download_url).then(r => r.text())))
      .then(fetchedPages => {
        pages = fetchedPages.map(fetchedPage => {
          if (fetchedPage.status === 'fulfilled') {
            return marked.parse(fetchedPage.value)
          }
        });
      });
    }

  getRules();
</script>

<style>
  .toc-section :global(ol),
  .toc-section :global(ul) {
    list-style-position: outside;
    padding-inline-start: 2rem;
  }

  .toc-section :global(ol) {
    list-style-type: decimal;
  }

  .toc-section :global(ul) {
    list-style-type: circle;
  }

  .toc-section  :global(li) {
    padding: 0.25rem 0;
  }
</style>

<h1>Rulebook</h1>
{#each pages as page}
  <section class="toc-section">
    {@html page}
  </section>
{/each}
