# Cloudflare

This file gives the shape that STACK recommends for a back office or a dashboard app on Cloudflare Workers, and the reason for each part. [`providers/cloudflare.md`](../providers/cloudflare.md) holds the limits, the prices and the quirks of Cloudflare. A limit in this file carries the same source and the same read date as its row in that file.

The shape has four parts: a static public site in its own Worker, the admin in one Worker, a separate Worker for heavy work, and Cloudflare Access in front of the admin. The data goes into D1, R2 and KV, and the counts and events go into Analytics Engine. The parts talk through queues and service bindings. A product with no public site leaves out the site Worker.

## How to read this file

Each rule carries one of three tiers, the same tiers as [`operations/monitoring.md`](../operations/monitoring.md):

- **Proven.** It runs in a product, and a measurement shows the result.
- **Recommended.** It is decided with a reason, and it is not yet measured in a product. Use it as the default, and send back what you measure.
- **Not recommended.** It was turned down. The rule gives the reason.

No rule in this file is Proven yet, because no product has run the whole shape and sent back a measurement. "Open questions" holds what the evidence does not settle.

Every limit is for the Workers Paid plan. A limit or a price belongs to Cloudflare, and it changes. Each one here carries the date on which somebody read it. Check before use.

## The shape

```text
visitors ──> site Worker: static assets, and Worker code on the HTML routes, which writes to Analytics Engine
staff ──> Cloudflare Access ──> admin Worker
                                  ├─ the UI, as static assets
                                  ├─ the API, under /api/
                                  ├─ cron triggers ──> a queue
                                  ├─ queue consumers
                                  ├─ bindings: D1, R2, KV
                                  └─ a queue or a service binding ──> heavy Worker ──> Browser Run, R2
```

## The public site

- **Recommended.** Build the public site to static files, and serve them from a Worker of its own with static assets.
- **Recommended.** Run Worker code on the site only for the routes that need it, through `run_worker_first`, such as the HTML routes that count page views ("Own visit statistics" in `operations/monitoring.md`).
- **Recommended.** Give the site Worker only the bindings that its own routes need.

**Why.** A request for a static asset is free and unlimited, and it runs no Worker code ([Static assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), read 2026-10-23). So a spike of visitors costs nothing, and it cannot take the CPU of the admin. The site and the admin have different visitors, different access rules and a different rhythm of deploys. A separate Worker keeps a fault of one away from the other.

**What it does not cover.** The design of the public pages. Each site gets its own design, outside STACK.

## The admin

- **Recommended.** Put the whole admin into one Worker. The Worker serves the UI as static assets, answers the API under `/api/`, runs the cron triggers and consumes the queues of the admin.
- **Recommended.** Build the admin UI to static files with one fallback page. In the `assets` block, set `not_found_handling` to `single-page-application` and `run_worker_first` to `["/api/*"]`, so that only the API runs Worker code ([Static assets](https://developers.cloudflare.com/workers/static-assets/), read 2026-10-23).
- **Recommended.** Give the admin its own hostname, such as `admin.example.com`, and not a path under the public site.
- **Not recommended.** The public site and the admin in one Worker. The reasons are in "The public site".

**Why.** One Worker is one deploy, one version and one list of bindings. The UI and the API share one origin, so the browser sends the Access cookie to both, and the API needs no CORS rule. The cron handler and the queue handler belong to the same Worker as the API, so the jobs use the same modules, the same D1 binding and the same audit code. A static UI costs nothing per request, and it leaves the API as the only code path to secure. An admin behind a sign-in gains nothing from server rendering, because no search engine reads it.

**Watch.** The CPU limit is one setting in the configuration of the Worker. `limits.cpu_ms` is 30 s by default and 5 min at most, for each request and for each queue batch of the admin ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Queues limits](https://developers.cloudflare.com/queues/platform/limits/), read 2026-10-23). A cron trigger gets 30 s of CPU when it runs more often than once an hour, and 15 min when it runs once an hour or less often ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/), read 2026-10-23). Cloudflare does not enforce these limits in local development ([Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), read 2026-10-23), so a job that passes on a laptop can fail when it is deployed.

## Heavy work

- **Recommended.** Run work that needs much memory or a headless browser in a separate Worker. Examples are a crawl, a large import or export, a screenshot and a PDF. The admin sends the work to that Worker through a queue. A short call that returns an answer at once can use a service binding.
- **Recommended.** Let the heavy Worker write its results into R2 or D1 as they come, and not hold them in memory.
- **Not recommended.** A heavy job inside the admin Worker.

**Why.** A Worker has 128 MB of memory per isolate, and one isolate serves many requests at the same time. When an isolate goes over the limit, the runtime lets the requests in flight finish, and starts a new isolate for the next requests. Under extremely high load, the runtime can cancel some incoming requests ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/), read 2026-10-23). A job inside the admin Worker shares the 128 MB with the requests of the people who use the admin. The memory of each isolate is isolated from the others ([How Workers works](https://developers.cloudflare.com/workers/reference/how-workers-works/), read 2026-10-23), so a job in its own Worker runs out of memory in its own isolate, and the admin keeps answering. The separate Worker also has its own CPU limit, its own deploy and its own bundle, so the library that drives the browser does not grow the bundle of the admin. A queue gives the job 15 min of wall time per batch, retries and a dead-letter queue ("How the parts talk").

**Watch.** A separate Worker still has 128 MB. It isolates a failure, and it does not raise the limit. For work that needs more than 128 MB in any Worker, Cloudflare Containers offer up to 12 GiB per instance ([Containers limits](https://developers.cloudflare.com/containers/platform/limits/), read 2026-10-23). STACK has not tried them ("Open questions").

**The browser.** Browser Run, which Cloudflare called Browser Rendering before, runs the browser outside the Worker. The Worker drives it through a binding. A session closes after 60 s with no command, or after up to 20 min with `keep_alive` ([Browser Run limits](https://developers.cloudflare.com/browser-run/limits/), read 2026-10-23). A session that the code does not close counts browser time until it times out, so close each browser in a `finally` block (same source).

## Data: D1, R2, KV and Analytics Engine

| Store | Use it for | Do not use it for |
|---|---|---|
| D1 | The records of the back office: the rows that a person creates, edits, filters and sorts. The `audit_event` table and the `job` table of `operations/monitoring.md`. | Files. One data set that grows past 10 GB. |
| R2 | Files: uploads, exports, generated PDFs and screenshots, and the results of the heavy Worker | Records that a person filters or sorts. An object that changes more than once per second. |
| KV | Configuration, feature flags, and cached copies of data that change rarely and are read often | Data that a person edits and reads back at once. Counters. Anything that needs a transaction. |
| Analytics Engine | Counts and events: the page views of the site, the clicks of a heatmap and the field vitals, which a report groups by time and by a field | Records that a person edits. A count that must be exact, because it samples. Data that must live longer than 3 months. A query that joins two tables. |

- **Recommended.** Keep the records in D1. Write each change and its audit row in one D1 batch, as "The audit trail" in `operations/monitoring.md` asks.
- **Recommended.** Plan on the first day how the data splits across D1 databases. One database holds at most 10 GB, and Cloudflare cannot raise that limit. One database runs one query at a time ([D1 limits](https://developers.cloudflare.com/d1/platform/limits/), read 2026-10-23).
- **Recommended.** Put each file into R2, and keep its R2 key and its metadata in a D1 row.
- **Recommended.** Write the counts and the events into Analytics Engine, and not into D1, such as the page views of "Own visit statistics" in `operations/monitoring.md`. Roll them up into narrow D1 tables every night, because Analytics Engine keeps data for three months ([Analytics Engine limits](https://developers.cloudflare.com/analytics/analytics-engine/limits/), read 2026-10-23).
- **Not recommended.** KV for data that a person edits. KV is eventually consistent: another location can read the old value for 60 s or more after a write ([How KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/), read 2026-10-23). KV takes 1 write per second to the same key ([KV limits](https://developers.cloudflare.com/kv/platform/limits/), read 2026-10-23), and so does R2 ([R2 limits](https://developers.cloudflare.com/r2/platform/limits/), read 2026-10-23).
- **Not in the shape.** Durable Objects. Add one only when a feature needs one strongly consistent owner for a key, such as live presence or an exact counter ([Choose a data or storage product](https://developers.cloudflare.com/workers/platform/storage-options/), read 2026-10-23).

**Why.** Cloudflare names D1 for relational data and for workloads with many more reads than writes (same source). A back office mostly reads lists and writes single records, so it fits. R2 is object storage with no fee for egress. KV caches each key across the network, which makes it fast to read and slow to agree. A Worker writes to Analytics Engine without a wait: `writeDataPoint()` returns at once, and the runtime writes in the background ([Analytics Engine get started](https://developers.cloudflare.com/analytics/analytics-engine/get-started/), read 2026-10-23). At a high volume Analytics Engine samples, so a count is `SUM(_sample_interval)` ([Analytics Engine SQL API](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/), read 2026-10-23). A query reads one table, with no `JOIN` ([Analytics Engine SQL statements](https://developers.cloudflare.com/analytics/analytics-engine/sql-reference/statements/), read 2026-10-23).

## Cloudflare Access in front of the admin

- **Recommended.** Protect the admin Worker with a Worker-level Access rule for all traffic. The rule covers every route, custom domain, `workers.dev` address, Version URL and Preview URL of the Worker ([Workers and Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), read 2026-10-23).
- **Recommended.** Run a page with no session, such as a signed link or a sign-in page, on a path that the Access rule leaves out: an Access bypass policy for those paths, or a separate Worker on its own hostname. The page then checks its token itself. Check before use: this file has no source for an Access bypass.
- **Recommended.** Validate the `Cf-Access-Jwt-Assertion` header in the admin Worker on each API request: the signature against the key set of the team, and the audience tag of the application. Match the `kid` of the token to a key of the set, because Access rotates its signing key every 6 weeks ([Validate JWTs](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/), read 2026-10-23).
- **Recommended.** Take the identity of the person from the validated token. Write it in `actor_id` of each `user` row. On the row of an agent that acts for the person, write it in `for_user_id`.
- **Recommended.** Give each machine client, such as the smoke test of CI, an Access service token, as "CI checks" in `operations/monitoring.md` asks. An account has at most 50 service tokens ([Zero Trust account limits](https://developers.cloudflare.com/cloudflare-one/account-limits/), read 2026-10-23).
- **Not recommended.** Trusting `ctx.access` in the admin Worker. A Worker with static assets runs behind an internal router, and the router does not pass `ctx.access` on. A service binding does not pass it on either ([Workers and Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), read 2026-10-23).
- **Not recommended.** A Worker-level Access rule on a Worker that takes WebSocket connections. The upgrade fails with a 403. Use a hostname rule for that Worker (same source).

**Why.** Access checks every request before the Worker runs, so the admin needs no sign-in form, no password store and no session code of its own. The Worker still validates the token, because Cloudflare says that a Worker behind Access still needs to validate it ([Validate JWTs](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/), read 2026-10-23). `workers_dev = false` does not turn off the Version URLs and the Preview URLs ([workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/), read 2026-10-23). So a hostname rule alone leaves those addresses open, and the Worker-level rule closes them.

**Watch.** Each person who signs in takes one seat of the Zero Trust plan. When all seats are taken, Access blocks the next new person ([Seat management](https://developers.cloudflare.com/cloudflare-one/team-and-resources/users/seat-management/), read 2026-10-23).

## How the parts talk

- **Recommended.** Use a queue for work that can take longer than a request, that must survive a failure, or that runs in another Worker. Give every queue a dead-letter queue, and make every job idempotent ("Jobs and failed work" in `operations/monitoring.md`).
- **Recommended.** Use a service binding for a short call between Workers that needs an answer at once. Give the called Worker no public address: set `workers_dev` and `preview_urls` to `false` and add no route, so that only a Worker with the binding reaches it. `workers_dev = false` does not turn off the Version URLs, and a Wrangler file with no `preview_urls` key keeps the setting that the Worker has ([workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/), [Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/), read 2026-10-23).
- **Recommended.** Pass the actor, and the person for whom an agent acts, as arguments of each service binding call and as fields of each queue message. The called Worker and the queue consumer get no Access context from the caller.
- **Recommended.** Let a cron trigger put its work on a queue, and let the consumer do the work. A cron trigger that runs more often than once an hour has 30 s of CPU, and a queue gives each job retries and a dead-letter queue.
- **Not in the shape.** Workflows, for a job of many steps that waits for hours or days. Each step gets 30 s of CPU by default and up to 5 min ([Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/), read 2026-10-23). The Rust crate has no Workflows support yet ([`providers/cloudflare.md`](../providers/cloudflare.md), "Rust").

**Why.** A service binding needs no public URL, and it adds no request fee ([Service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), read 2026-10-23). Each call counts as a subrequest, and one request reaches at most 32 Worker invocations ([Service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/), read 2026-10-23). Queues deliver each message at least once, so a message can arrive twice ([Choose a data or storage product](https://developers.cloudflare.com/workers/platform/storage-options/), read 2026-10-23). A consumer has 15 min of wall time per batch ([Queues limits](https://developers.cloudflare.com/queues/platform/limits/), read 2026-10-23). Without a dead-letter queue, Queues deletes a message after its last retry, and the default is 3 retries ([Dead Letter Queues](https://developers.cloudflare.com/queues/configuration/dead-letter-queues/), read 2026-10-23). Cron triggers run on UTC, and a change to a cron trigger takes up to 15 min to reach the whole network ([Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), read 2026-10-23).

## Where this file meets the other files

[`operations/monitoring.md`](../operations/monitoring.md) assumes this shape:

- Each Worker of the shape gets the `observability` block and the `version_metadata` binding ("Logs").
- The `audit_event` table and the `job` table live in the D1 databases of the admin ("The audit trail", "Jobs and failed work").
- A request for a static asset runs no Worker code. So the logs and the counts of the site see only the routes that `run_worker_first` lists ("Own visit statistics").
- Each Worker gets a preview environment with its own databases, queues and secrets, and the smoke test signs in with an Access service token ("CI checks"). A preview environment is a Wrangler environment, and Wrangler deploys it as a separate Worker named `<name>-<environment>` ([Wrangler environments](https://developers.cloudflare.com/workers/wrangler/environments/), read 2026-10-23). A Worker-level Access rule protects one Worker ([Workers and Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), read 2026-10-23). So each preview environment gets a Worker-level Access rule of its own, and the rule of the admin covers only the Version URLs and the Preview URLs of the admin Worker itself. A Preview of Cloudflare, which runs under the same Worker, does not replace the preview environment: a Preview cannot consume a queue, and its service bindings call the production Worker ([Previews resources](https://developers.cloudflare.com/workers/previews/resources/), read 2026-10-23).

[`architecture/web-app.md`](web-app.md) gives the behavior of the screens that the admin Worker serves:

- "State in the URL": the fallback page answers every address of the UI, so a reload and a link keep the filters.
- "Empty, loading and error": the API returns the JSON error envelope with the request id of `operations/monitoring.md`, and the UI shows the error inline with a retry button.
- "A failed write": a D1 batch commits as a whole or fails as a whole, so the UI knows when to keep the input of the person and offer a retry.
- "Actions with a lasting effect": the API writes the audit row in the same D1 batch as the action.
- "Formats": cron triggers run on UTC. A job that counts a calendar day converts the time to the time zone that the product names.

## Open questions

The evidence does not settle these yet. A product that settles one sends the result back.

- Cloudflare Containers, for work that needs more than 128 MB even in a Worker of its own. Nobody has tried them.
- Workflows against a queue with a `job` table, for a job of many steps.
- The language of the Workers: TypeScript or Rust. The Rust crate has no support for Workflows and no wrapper for Browser Run. STACK has not chosen.
- One D1 database for the admin, or one for each module. `operations/monitoring.md` speaks of a `job` table in each module, and nobody has measured the split.
- The number of seats that the free Zero Trust plan includes. The pages that were read on 2026-10-23 do not give it.
