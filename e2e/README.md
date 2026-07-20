# UI tests (Playwright)

End-to-end tests for the SvelteKit UI that never touch a real backend. Run them
with `npm run test:e2e` (or `npm run test:e2e:ui` for the inspector). The
Playwright config builds the app and serves the production bundle via
`vite preview`, so the suite also verifies the build.

## Architecture

Everything the app fetches goes through `src/utils/runQuery.ts` → a single
GraphQL endpoint. The test fixture (`support/mockApi.ts`) intercepts that
endpoint at the browser-network level with `context.route()` and answers from
fixtures (`support/data.ts`):

- **Operation matching** — the app's queries are anonymous, so requests are
  recognized by distinctive substrings of the query text (e.g.
  `authenticatedItem`, `playersCount`). If a query is added to
  `src/utils/queries.ts`, add a matcher + default response in `mockApi.ts`.
- **Stateful sessions** — `begin-session` / `end-session` mutations update the
  mock's `user`, and `authenticated-item` answers from it, so login/logout and
  the layout's route guarding behave like production. Tests pick a persona
  with `api.logInAs('owner' | 'admin' | null)` (default: owner).
- **A tiny resolver** — `all-players` actually applies the filters, paging and
  ordering the UI sends, so filter/sort/pagination tests assert real behavior,
  not canned responses.
- **Recorded calls** — every GraphQL request is pushed onto `api.calls`;
  `api.waitForCall(op)` / `api.callsTo(op)` let tests assert mutation payloads
  (the salary×100 conversions, connect wiring, etc.).
- **Overrides** — `api.respond(op, fn)` swaps one operation's response for a
  single test (error paths, phase changes).
- **Hermetic by default** — a catch-all route aborts any request that isn't
  for the app server; the GitHub rulebook API and web fonts get explicit
  stubs. CI cannot leak traffic to prod or a shared test server.

The app itself skips API fetches during SSR (`browser` guards), so the preview
server makes no outbound requests either — interception covers everything.

## Conventions

- Fixture data lives in `support/data.ts`; salaries are cents, players are
  fictional. Prefer extending fixtures over inventing per-test data.
- Locators lean on roles/labels (`getByRole('button', …)`, `getByLabel`) —
  Playwright pierces Shoelace's shadow DOM automatically.
- One spec file per route/feature; `mobile.spec.ts` re-runs key screens at a
  phone viewport.
