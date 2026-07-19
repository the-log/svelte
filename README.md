# the-log/svelte

SvelteKit frontend for the fantasy football league management app. Reads from the Keystone GraphQL backend (`api.log.football` in prod, `api.log.ddev.site` locally) and is deployed to Netlify.

## Quick start

The recommended local workflow uses [DDEV](https://ddev.com/), which orchestrates this app alongside its backend and scraper siblings:

```bash
# from the parent project directory (where .ddev/ lives)
ddev start
ddev svelte         # runs `npm run dev` inside the container
```

The dev server listens on `:3001` and is reachable at <https://app.log.ddev.site>.

To run outside DDEV (frontend-only, pointed at the prod backend):

```bash
cd svelte
npm install
npm run dev         # http://localhost:3001
```

## Scripts

| Script            | Purpose                                 |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Start the dev server on port 3001.      |
| `npm run build`   | Build for production (used by Netlify). |
| `npm run preview` | Preview the production build locally.   |
| `npm run check`   | Run `svelte-check` for type errors.     |
| `npm run lint`    | Prettier + ESLint check.                |
| `npm run format`  | Apply Prettier formatting.              |

## Stack

- **Framework**: SvelteKit (adapter-netlify, edge functions)
- **UI**: Shoelace web components, loaded via CDN autoloader in `src/app.html`
- **Data**: GraphQL via a thin `fetch` wrapper in `src/utils/runQuery.ts`
- **Markdown**: `marked` (used by the rulebook route)

## Project layout

```
src/
  app.html              Shell — Shoelace bootstrap, design tokens
  routes/               SvelteKit pages
  components/           Reusable Svelte components
  utils/                Pure helpers, GraphQL client, query strings
  types/                TypeScript types and GraphQL schema types
  misc/stores.ts        Svelte stores (auth, etc.)
```

## Environment

See `.env.example`. Supported variables:

| Variable         | Purpose                                                                                                                                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_API_URL` | GraphQL endpoint of the backend. Optional — defaults to `https://api.log.ddev.site/api/graphql` in dev and `https://api.log.football/api/graphql` in production builds. Set it to point a preview deploy or local override at a different backend. |

## Deployment

Netlify auto-deploys from `main`. Build config lives in `netlify.toml`.
