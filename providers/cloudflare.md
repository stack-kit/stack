# Cloudflare

This file holds the limits, the prices and the quirks of Cloudflare that an agent needs before it builds on Workers. [`architecture/cloudflare.md`](../architecture/cloudflare.md) gives the shape that uses them. [`README.md`](README.md) explains the form of this file and how to tell a stale fact.

Every value is for the Workers Paid plan, unless the row says otherwise. Each row names its source and the date on which somebody read it. "Sources" at the end gives the date on which Cloudflare last updated each page. Check before use.

## What to know first

1. Memory is 128 MB per isolate, and one isolate serves many requests at the same time. A job that holds much data in memory takes the memory from every request of the same Worker ([Workers limits][wl], read 2026-10-23).
2. CPU time is 30 s per invocation by default, and 5 min at most. `limits.cpu_ms` sets it once for the whole Worker, for its requests and its queue batches ([Workers limits][wl], [Queues limits][ql], read 2026-10-23).
3. Cloudflare does not enforce the limits in local development. A job that passes on a laptop can fail when it is deployed ([Wrangler configuration][wrc], read 2026-10-23).
4. A cron trigger gets 30 s of CPU when its interval is under one hour, and 15 min when the interval is one hour or more. Cron triggers run on UTC, and a change takes up to 15 min to reach the whole network ([Workers limits][wl], [Cron Triggers][ct], read 2026-10-23).
5. A D1 database holds at most 10 GB, and Cloudflare cannot raise that limit. It runs one query at a time ([D1 limits][d1l], read 2026-10-23).
6. KV is eventually consistent: another location can read the old value for 60 s or more after a write ([How KV works][kvw], read 2026-10-23). KV and R2 both take 1 write per second to the same key ([KV limits][kvl], [R2 limits][r2l], read 2026-10-23).
7. Without a dead-letter queue, Queues deletes a message after its last retry. Queues delivers each message at least once, so a message can arrive twice ([Dead Letter Queues][dlq], [Choose a data or storage product][so], read 2026-10-23).
8. `ctx.access` does not reach a Worker that has static assets, and it does not pass through a service binding. Validate the `Cf-Access-Jwt-Assertion` header yourself ([Workers and Access][wca], [Validate JWTs][jwt], read 2026-10-23).
9. `workers_dev = false` does not turn off the Version URLs, the Preview URLs and the Deployment URLs of a Worker. `preview_urls = false` turns off the Version URLs and the `workers.dev` Preview URLs. A Wrangler file with no `preview_urls` key keeps the setting that the Worker has ([workers.dev][wdev], [Version URLs][vu], [Previews custom domains][pvcd], read 2026-10-23).
10. Browser Run is the current name of the headless browser product. Cloudflare called it Browser Rendering before ([Browser Run][br], read 2026-10-23).
11. Analytics Engine keeps data for three months, and it samples at a high volume. A query reads one table, with no `JOIN` ([Analytics Engine limits][ael], [Analytics Engine SQL API][aesql], [Analytics Engine SQL statements][aess], read 2026-10-23).
12. Some pages give different values for the same limit. "Where the sources disagree" lists them. Design for the lower value.

## Workers

| Limit | Value | Source | Read |
|---|---|---|---|
| CPU time per HTTP request | 30 s by default, up to 5 min through `limits.cpu_ms` | [Workers limits][wl] | 2026-10-23 |
| CPU time per cron trigger | 30 s when the interval is under 1 hour. 15 min when the interval is 1 hour or more. | [Workers limits][wl] | 2026-10-23 |
| CPU time per queue consumer invocation | 30 s by default, up to 5 min through `limits.cpu_ms` | [Queues limits][ql] | 2026-10-23 |
| Wall time per HTTP request | No limit while the client stays connected. `waitUntil()` adds up to 30 s after the response. | [Workers limits][wl] | 2026-10-23 |
| Wall time per cron trigger, queue consumer invocation or Durable Object alarm | 15 min | [Workers limits][wl] | 2026-10-23 |
| Memory | 128 MB per isolate, the JavaScript heap and the WebAssembly memory together | [Workers limits][wl] | 2026-10-23 |
| Subrequests per invocation | 10,000 by default, up to 10 million through `limits.subrequests` | [Workers limits][wl] | 2026-10-23 |
| Connections that wait for response headers | 6 per invocation. A seventh waits in a queue. | [Workers limits][wl] | 2026-10-23 |
| Worker size | 64 MiB uncompressed. No limit on the compressed size. | [Workers limits][wl] | 2026-10-23 |
| Startup time | 1 s for the global scope. A deploy over the limit fails with error 10021. | [Workers limits][wl] | 2026-10-23 |
| Workers per account | 500 | [Workers limits][wl] | 2026-10-23 |
| Cron triggers per account | 250 | [Workers limits][wl] | 2026-10-23 |
| Environment variables | 128 per Worker, 5 KB each | [Workers limits][wl] | 2026-10-23 |
| Static asset files | 100,000 per Worker version, 25 MiB each | [Workers limits][wl] | 2026-10-23 |
| Request body | 100 MB on the Free and the Pro zone plan, 200 MB on the Business zone plan | [Workers limits][wl] | 2026-10-23 |
| Log data | 256 KB per request | [Workers limits][wl] | 2026-10-23 |
| Service binding calls | 32 Worker invocations per request. Each call counts as a subrequest. | [Service bindings][sb] | 2026-10-23 |

Quirks:

- A Worker over its CPU or memory limit returns error 1102, "Worker exceeded resource limits". The outcome in the logs is `exceededCpu` or `exceededMemory` ([Workers limits][wl], read 2026-10-23).
- When an isolate goes over 128 MB, the requests in flight finish, and the runtime starts a new isolate for the next requests. Under extremely high load, the runtime can cancel some incoming requests ([Workers limits][wl], read 2026-10-23).
- A Worker that calls another Worker on the same zone with a plain `fetch()` fails. Use a service binding ([Workers limits][wl], read 2026-10-23).
- During an update of the runtime, the old process gives the open requests and connections up to 20 min, and then ends them. Long work must survive an interruption and a retry ([Workers limits][wl], read 2026-10-23).
- A request that matches a static asset runs no Worker code, unless `run_worker_first` lists its route ([Static assets][sa], read 2026-10-23).
- Cloudflare renamed the preview URLs of a Worker version to Version URLs, and the Wrangler field keeps the name `preview_urls`. `preview_urls = false` turns off the Version URLs and the aliased Version URLs ([Version URLs][vu], read 2026-10-23). It also turns off the `workers.dev` Preview URLs of Previews ([Previews custom domains][pvcd], read 2026-10-23).
- When the Wrangler file has no `preview_urls` key, Wrangler keeps the setting that the Worker has. A Worker with no setting takes the setting of `workers_dev` ([Version URLs][vu], [Previews custom domains][pvcd], read 2026-10-23).
- A Wrangler environment deploys as a separate Worker named `<name>-<environment>` ([Wrangler environments][wenv], read 2026-10-23).
- A Preview runs under the same Worker, with its own variables, secrets and bindings. A Preview cannot consume a queue, its service bindings call the production Worker, and cron triggers and routes reach only production ([Previews][pv], [Previews resources][pvr], read 2026-10-23).

## Queues

| Limit | Value | Source | Read |
|---|---|---|---|
| Message size | 128 KB, with about 100 bytes of metadata inside it | [Queues limits][ql] | 2026-10-23 |
| Retries | 3 by default, 100 at most | [Dead Letter Queues][dlq], [Queues limits][ql] | 2026-10-23 |
| Batch size of a consumer | 10 messages by default, 100 at most | [Batching and retries][qbr], [Queues limits][ql] | 2026-10-23 |
| Batch wait time | 5 s by default, 60 s at most | [Batching and retries][qbr], [Queues limits][ql] | 2026-10-23 |
| Throughput | 5,000 messages per second per queue. Above it, `send()` throws "Too Many Requests". | [Queues limits][ql] | 2026-10-23 |
| Retention | 4 days by default, up to 14 days | [Workers pricing][wp], [Queues limits][ql] | 2026-10-23 |
| Backlog | 25 GB per queue | [Queues limits][ql] | 2026-10-23 |
| Concurrent consumer invocations | 250, push consumers only | [Queues limits][ql] | 2026-10-23 |
| Delay of a message | Up to 24 hours | [Queues limits][ql] | 2026-10-23 |

Quirks:

- A message in a dead-letter queue that has no consumer stays 4 days, and then Queues deletes it ([Dead Letter Queues][dlq], read 2026-10-23).
- Each retry counts as one more read operation on the bill ([Workers pricing][wp], read 2026-10-23).

## Workflows

| Limit | Value | Source | Read |
|---|---|---|---|
| CPU time per step | 30 s by default, up to 5 min through `limits.cpu_ms` | [Workflows limits][wfl] | 2026-10-23 |
| Wall time per step | No limit | [Workflows limits][wfl] | 2026-10-23 |
| Result of one step | 1 MiB | [Workflows limits][wfl] | 2026-10-23 |
| Event payload | 1 MiB | [Workflows limits][wfl] | 2026-10-23 |
| State per instance | 1 GB | [Workflows limits][wfl] | 2026-10-23 |
| Steps per Workflow | 10,000 by default, up to 25,000 | [Workflows limits][wfl] | 2026-10-23 |
| Longest `step.sleep` | 365 days | [Workflows limits][wfl] | 2026-10-23 |
| Retries per step | 10,000 | [Workflows limits][wfl] | 2026-10-23 |
| New instances | 300 per second per account, 100 per second per Workflow | [Workflows limits][wfl] | 2026-10-23 |
| State of a finished instance | Kept 30 days | [Workflows limits][wfl] | 2026-10-23 |

Quirk: an instance that sleeps or waits for an event does not count as a running instance ([Workflows limits][wfl], read 2026-10-23).

## Browser Run

| Limit | Value | Source | Read |
|---|---|---|---|
| Concurrent browsers | 200 per account, for Browser Sessions | [Browser Run limits][brl] | 2026-10-23 |
| New browsers | 3 per second, for Browser Sessions | [Browser Run limits][brl] | 2026-10-23 |
| Browser timeout | 60 s with no command, up to 20 min with `keep_alive` | [Browser Run limits][brl] | 2026-10-23 |
| Quick Actions requests | 30 per second | [Browser Run limits][brl] | 2026-10-23 |
| Browser time on the Workers Free plan | 10 min per day | [Browser Run limits][brl] | 2026-10-23 |

Quirks:

- Browser Run has two ways in. Quick Actions are single HTTP requests for a screenshot, a PDF, Markdown, links or a crawl. Browser Sessions give full control of a browser from a Worker ([Browser Run][br], read 2026-10-23).
- An active session has no fixed end. A session also closes when Browser Run rolls out a new release ([Browser Run limits][brl], read 2026-10-23).
- A browser that the code does not close counts browser time until it times out. Close it in a `finally` block ([Browser Run limits][brl], read 2026-10-23).

## D1

| Limit | Value | Source | Read |
|---|---|---|---|
| Size of a database | 10 GB. Cloudflare cannot raise it. | [D1 limits][d1l] | 2026-10-23 |
| Storage per account | 1 TB, more on request | [D1 limits][d1l] | 2026-10-23 |
| Databases per account | 50,000, more on request | [D1 limits][d1l] | 2026-10-23 |
| Queries per Worker invocation | 1,000 | [D1 limits][d1l] | 2026-10-23 |
| Duration of a query | 30 s, which also applies to a whole batch | [D1 limits][d1l] | 2026-10-23 |
| Row, string or BLOB | 2 MB | [D1 limits][d1l] | 2026-10-23 |
| SQL statement | 100 KB, for each statement of a batch too | [D1 limits][d1l] | 2026-10-23 |
| Bound parameters per query | 100 | [D1 limits][d1l] | 2026-10-23 |
| Columns per table | 100 | [D1 limits][d1l] | 2026-10-23 |
| Pattern of `LIKE` or `GLOB` | 50 bytes | [D1 limits][d1l] | 2026-10-23 |
| Time Travel | 30 days back. 10 restores per 10 minutes per database. | [D1 limits][d1l] | 2026-10-23 |

Quirks:

- A database runs one query at a time. With an average query of 1 ms, it runs at most 1,000 queries per second. A full queue returns an "overloaded" error. Send several statements in one `batch()` to pay the overhead of a request once ([D1 limits][d1l], read 2026-10-23).
- An `UPDATE` or a `DELETE` of hundreds of thousands of rows goes over the limits. Run it in chunks, such as 1,000 rows at a time ([D1 limits][d1l], read 2026-10-23).
- A D1 query runs inside the CPU and memory limits of the Worker that sends it ([D1 limits][d1l], read 2026-10-23).

## KV

| Limit | Value | Source | Read |
|---|---|---|---|
| Writes to the same key | 1 per second | [KV limits][kvl] | 2026-10-23 |
| Operations per Worker invocation | 1,000. A bulk read counts as one. | [KV limits][kvl] | 2026-10-23 |
| Value | 25 MiB | [KV limits][kvl] | 2026-10-23 |
| Key | 512 bytes | [KV limits][kvl] | 2026-10-23 |
| Metadata of a key | 1,024 bytes | [KV limits][kvl] | 2026-10-23 |
| Shortest `cacheTtl` | 30 s | [KV limits][kvl] | 2026-10-23 |
| Namespaces per account | 1,000 | [KV limits][kvl] | 2026-10-23 |
| Time until a write shows in other locations | 60 s or more | [How KV works][kvw] | 2026-10-23 |

## R2

| Limit | Value | Source | Read |
|---|---|---|---|
| Writes to the same key | 1 per second. More return HTTP 429. | [R2 limits][r2l] | 2026-10-23 |
| Object | 4.995 TiB | [R2 limits][r2l] | 2026-10-23 |
| Upload in one request | 4.995 GiB. A larger object needs a multipart upload, with up to 10,000 parts. | [R2 limits][r2l] | 2026-10-23 |
| Key | 1,024 bytes | [R2 limits][r2l] | 2026-10-23 |
| Metadata of an object | 8,192 bytes | [R2 limits][r2l] | 2026-10-23 |
| Buckets per account | 1,000,000 | [R2 limits][r2l] | 2026-10-23 |
| Cloudflare REST API | 1,200 requests per 5 min per account, for all R2 operations | [R2 limits][r2l] | 2026-10-23 |

Quirk: the public `r2.dev` address of a bucket is for tests. It has a variable rate limit. Connect a custom domain for production ([R2 limits][r2l], read 2026-10-23).

## Analytics Engine

| Limit | Value | Source | Read |
|---|---|---|---|
| Data points per Worker invocation | 250. Each call to `writeDataPoint` counts. | [Analytics Engine limits][ael] | 2026-10-23 |
| Fields of one data point | 20 blobs, 20 doubles and 1 index | [Analytics Engine limits][ael] | 2026-10-23 |
| Blobs of one data point | 16 KB in total | [Analytics Engine limits][ael] | 2026-10-23 |
| Index | 96 bytes | [Analytics Engine limits][ael] | 2026-10-23 |
| Retention | Three months | [Analytics Engine limits][ael] | 2026-10-23 |

Quirks:

- Analytics Engine samples at a high volume, on write and on read. It samples by the index, so only an index that gets many events loses rows. The `_sample_interval` column gives how many rows of the original data one row stands for, so a count is `SUM(_sample_interval)` and not `COUNT()` ([Analytics Engine SQL API][aesql], read 2026-10-23).
- Cloudflare gives no fixed volume at which sampling starts. For a load that is spread across its network, Cloudflare saw sampling at about 100 data points per second for each index value ([Analytics Engine FAQs][aefaq], read 2026-10-23).
- A query reads one table. `JOIN` and `UNION` are not supported ([Analytics Engine SQL statements][aess], read 2026-10-23).
- `writeDataPoint()` returns at once, and the runtime writes the data in the background. A data point takes one index, and a data point with more than one index is not recorded. A dataset comes into being at its first write ([Analytics Engine get started][aegs], read 2026-10-23).
- The SQL API is `POST https://api.cloudflare.com/client/v4/accounts/<account_id>/analytics_engine/sql`, with an API token that has the Account Analytics Read permission. A Worker calls it with `fetch()` ([Analytics Engine SQL API][aesql], [Querying from a Worker][aewq], read 2026-10-23).
- The Analytics SQL binding, the `analytics` key of the Wrangler file, lets a Worker query with parameters and with no API token. It needs Wrangler 4.145.0 or later, and it reads a dataset as `events.analyticsEngine."<dataset>"` ([Analytics SQL binding][asqlb], read 2026-10-23).
- The Analytics SQL binding does not retry a failed query by itself. Access still depends on the Analytics Engine entitlement of the account. The page does not say whether the binding is in beta ([Analytics SQL binding][asqlb], read 2026-10-25).

## Containers

| Limit | Value | Source | Read |
|---|---|---|---|
| Largest instance | 4 vCPU, 12 GiB of memory, 20 GB of disk | [Containers limits][cl] | 2026-10-23 |
| Smallest instance | 1/16 vCPU, 256 MiB of memory, 2 GB of disk | [Containers limits][cl] | 2026-10-23 |

## Cloudflare Access

| Limit | Value | Source | Read |
|---|---|---|---|
| Access applications per account | 500 | [Zero Trust account limits][ztl] | 2026-10-23 |
| Service tokens per account | 50 | [Zero Trust account limits][ztl] | 2026-10-23 |
| Rotation of the signing key | Every 6 weeks by default. The old key stays valid 7 days. | [Validate JWTs][jwt] | 2026-10-23 |

Quirks:

- A Worker-level rule covers every route, custom domain, `workers.dev` address, Version URL and Preview URL of the Worker. A hostname rule covers only its own hostname or path ([Workers and Access][wca], [Version URLs][vu], read 2026-10-23).
- A Worker-level rule protects one Worker, which the rule names by its ID. The Worker of a Wrangler environment is a separate Worker, so the rule of the top-level Worker does not cover it ([Workers and Access][wca], [Wrangler environments][wenv], read 2026-10-23).
- An account-level rule protects every Worker of the account, also a Worker created later, for its previews only or for all traffic ([Workers and Access][wca], read 2026-10-23).
- A Worker-level rule refuses a WebSocket upgrade with a 403. A Worker that takes WebSocket connections needs a hostname rule ([Workers and Access][wca], read 2026-10-23).
- `ctx.access` is `undefined` in a Worker that has static assets, because the internal router of the assets does not pass it on. A service binding does not pass it on either ([Workers and Access][wca], read 2026-10-23).
- Access sends the token in the `Cf-Access-Jwt-Assertion` header, and in the `CF_Authorization` cookie for a browser. Validate the header, because the cookie does not always arrive ([Validate JWTs][jwt], read 2026-10-23).
- Each person who signs in takes one seat, however many applications the person opens. When all seats are taken, Access blocks the next new person ([Seat management][seat], read 2026-10-23).

## Rust

The Rust crate is `worker`, from the workers-rs repository of Cloudflare. Its newest release is 0.8.7, published 2026-09-25 ([releases][wrsr], [crate][wrsc], read 2026-10-23). A Rust Worker compiles to WebAssembly, and its WebAssembly memory counts toward the 128 MB ([Workers limits][wl], read 2026-10-23).

| Binding | State in 0.8.7 | Source | Read |
|---|---|---|---|
| D1 | Supported behind the `d1` feature. The README calls it alpha. | [README of 0.8.7][wrsm] | 2026-10-23 |
| R2 | Supported, in the `r2` module, with no feature flag | [source of 0.8.7][wrss] | 2026-10-23 |
| KV | Supported, in the `kv` module | [source of 0.8.7][wrss], [README of 0.8.7][wrsm] | 2026-10-23 |
| Queues | Supported behind the `queue` feature, as a producer and as a consumer with `#[event(queue)]`. The README calls it beta. | [README of 0.8.7][wrsm] | 2026-10-23 |
| Durable Objects | Supported with `#[durable_object]`, with SQL storage | [README of 0.8.7][wrsm] | 2026-10-23 |
| Cron triggers | Supported with `#[event(scheduled)]` | [Rust on Workers][rust] | 2026-10-23 |
| Workflows | Not supported. Issue 663 is open since 2024-10-25. Pull request 918, "add Workflows support", is open and was last updated 2026-10-15. | [issue 663][wrs663], [pull request 918][wrs918] | 2026-10-23 |
| Browser Run | No wrapper. The source of 0.8.7 has no module for it. | [source of 0.8.7][wrss] | 2026-10-23 |

## Prices

All prices are in US dollars.

| Item | Included each month | Above that | Source | Read |
|---|---|---|---|---|
| Workers Paid plan | Minimum charge USD 5 per account | | [Workers pricing][wp] | 2026-10-23 |
| Worker requests | 10 million | USD 0.30 per million | [Workers pricing][wp] | 2026-10-23 |
| CPU time | 30 million ms | USD 0.02 per million ms | [Workers pricing][wp] | 2026-10-23 |
| Requests for static assets | Free and unlimited | | [Workers pricing][wp] | 2026-10-23 |
| Calls through a service binding | No extra request fee | | [Workers pricing][wp] | 2026-10-23 |
| Workers Logs | 20 million events, kept 7 days | USD 0.60 per million, until Observability pricing starts on 2026-12-01 | [Workers pricing][wp] | 2026-10-23 |
| Queues | 1 million operations. Each 64 KB written, read or deleted is one operation, and one message usually takes 3. | USD 0.40 per million | [Workers pricing][wp] | 2026-10-23 |
| D1 rows read | 25 billion | USD 0.001 per million | [Workers pricing][wp] | 2026-10-23 |
| D1 rows written | 50 million | USD 1.00 per million | [Workers pricing][wp] | 2026-10-23 |
| D1 storage | 5 GB | USD 0.75 per GB-month | [Workers pricing][wp] | 2026-10-23 |
| KV reads | 10 million | USD 0.50 per million | [Workers pricing][wp] | 2026-10-23 |
| KV writes, deletes and lists | 1 million each | USD 5.00 per million | [Workers pricing][wp] | 2026-10-23 |
| KV storage | 1 GB | USD 0.50 per GB-month | [Workers pricing][wp] | 2026-10-23 |
| R2 storage, Standard class | 10 GB-month | USD 0.015 per GB-month | [R2 pricing][r2p] | 2026-10-23 |
| R2 Class A operations, such as a write | 1 million | USD 4.50 per million | [R2 pricing][r2p] | 2026-10-23 |
| R2 Class B operations, such as a read | 10 million | USD 0.36 per million | [R2 pricing][r2p] | 2026-10-23 |
| R2 egress | Free | | [R2 pricing][r2p] | 2026-10-23 |
| Analytics Engine data points written | 10 million | USD 0.25 per million | [Analytics Engine pricing][aep] | 2026-10-23 |
| Analytics Engine read queries | 1 million | USD 1.00 per million | [Analytics Engine pricing][aep] | 2026-10-23 |
| Browser Run, browser time | 10 hours | USD 0.09 per hour | [Browser Run pricing][brp] | 2026-10-23 |
| Browser Run, concurrent browsers | 10, as the monthly average of the daily peaks | USD 2.00 per browser | [Browser Run pricing][brp] | 2026-10-23 |
| Workflows requests and CPU time | The same as Workers | The same as Workers | [Workers pricing][wp] | 2026-10-23 |
| Workflows storage | 1 GB-month | USD 0.20 per GB-month | [Workers pricing][wp] | 2026-10-23 |
| Workflows steps | 500,000 | USD 0.80 per 100,000 | [Workers pricing][wp] | 2026-10-23 |

Cloudflare bills Workflows steps and storage from a start date in its change log. The change log entry of 2026-07-07 says "no earlier than August 10, 2026" ([Workflows billing change log][wfb], read 2026-10-23). The pricing page, updated 2026-10-02, still says that Cloudflare does not bill them before that start date. Whether billing has started is not confirmed.

Cloudflare does not bill Analytics Engine yet. Its pricing page says "Currently, you will not be billed for your use of Workers Analytics Engine", and that billing starts "in the coming months", with no date ([Analytics Engine pricing][aep], read 2026-10-23). The page counts each post to the SQL API as one read query. It does not say how it counts a query through the Analytics SQL binding.

## Where the sources disagree

- **CPU time of a cron trigger and of a queue consumer.** The Workers pricing page says "Max of 15 minutes of CPU time per Cron Trigger or Queue Consumer invocation". The Workers limits page gives a cron trigger 30 s under an hourly interval, and the Queues limits page gives a consumer 5 min at most ([Workers pricing][wp], [Workers limits][wl], [Queues limits][ql], read 2026-10-23). Design for 30 s and 5 min.
- **Calls to Cloudflare services per invocation.** The Workers limits page says that the subrequests to internal services follow the configured limit, 10,000 by default. The KV limits page gives 1,000 operations per invocation, and the D1 limits page gives 1,000 queries per invocation ([Workers limits][wl], [KV limits][kvl], [D1 limits][d1l], read 2026-10-23). Design for 1,000.
- **Size of a Worker that defines a Workflow.** The Workflows limits page gives the Workers Paid plan "10MB max script size" for the Workflow class definitions of one script, and it points to the Worker size limits. The Workers limits page gives 64 MiB uncompressed on both plans, and no limit on the compressed size ([Workflows limits][wfl], [Workers limits][wl], read 2026-10-23). Design for 10 MB for a Worker that defines a Workflow class.
- **Concurrent Workflows instances.** The table of the Workflows limits page gives 50,000 per account, and the text under it speaks of a 10,000 limit ([Workflows limits][wfl], read 2026-10-23). Design for 10,000.

## Sources

Each page was read on 2026-10-23. "Updated" is the date that the page showed as its last update on that day.

- Workers limits, updated 2026-10-12: https://developers.cloudflare.com/workers/platform/limits/
- Workers pricing, updated 2026-10-02: https://developers.cloudflare.com/workers/platform/pricing/
- Wrangler configuration, updated 2026-10-20: https://developers.cloudflare.com/workers/wrangler/configuration/
- How Workers works, updated 2026-09-18: https://developers.cloudflare.com/workers/reference/how-workers-works/
- Static assets, updated 2026-10-12: https://developers.cloudflare.com/workers/static-assets/
- Static assets billing and limitations, updated 2026-04-23: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- Service bindings, updated 2026-10-13: https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/
- Cron Triggers, updated 2026-10-17: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- workers.dev, updated 2026-09-22: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- Version URLs, updated 2026-09-22: https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/
- Wrangler environments, updated 2026-10-18: https://developers.cloudflare.com/workers/wrangler/environments/
- Previews, updated 2026-09-24: https://developers.cloudflare.com/workers/previews/
- Previews resources and isolation, updated 2026-09-22: https://developers.cloudflare.com/workers/previews/resources/
- Previews custom domains, updated 2026-09-24: https://developers.cloudflare.com/workers/previews/custom-domains/
- Workers and Access, updated 2026-10-12: https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- Choose a data or storage product, updated 2026-10-21: https://developers.cloudflare.com/workers/platform/storage-options/
- Queues limits, updated 2026-04-21: https://developers.cloudflare.com/queues/platform/limits/
- Queues batching and retries, updated 2026-04-21: https://developers.cloudflare.com/queues/configuration/batching-retries/
- Dead Letter Queues, updated 2026-10-12: https://developers.cloudflare.com/queues/configuration/dead-letter-queues/
- Workflows limits, updated 2026-09-21: https://developers.cloudflare.com/workflows/reference/limits/
- Workflows billing change log, dated 2026-07-07: https://developers.cloudflare.com/changelog/post/2026-07-07-workflows-billing-updates/
- Browser Run, updated 2026-08-11: https://developers.cloudflare.com/browser-run/
- Browser Run limits, updated 2026-10-14: https://developers.cloudflare.com/browser-run/limits/
- Browser Run pricing, updated 2026-04-21: https://developers.cloudflare.com/browser-run/pricing/
- D1 limits, updated 2026-04-21: https://developers.cloudflare.com/d1/platform/limits/
- KV limits, updated 2026-10-08: https://developers.cloudflare.com/kv/platform/limits/
- How KV works, updated 2026-04-21: https://developers.cloudflare.com/kv/concepts/how-kv-works/
- R2 limits, updated 2026-06-08: https://developers.cloudflare.com/r2/platform/limits/
- R2 pricing, updated 2026-10-01: https://developers.cloudflare.com/r2/pricing/
- Analytics Engine limits, updated 2026-04-23: https://developers.cloudflare.com/analytics/analytics-engine/limits/
- Analytics Engine pricing, updated 2026-04-23: https://developers.cloudflare.com/analytics/analytics-engine/pricing/
- Analytics Engine get started, updated 2026-04-23: https://developers.cloudflare.com/analytics/analytics-engine/get-started/
- Analytics Engine SQL API, updated 2026-10-02: https://developers.cloudflare.com/analytics/analytics-engine/sql-api/
- Analytics Engine SQL statements, updated 2026-04-23: https://developers.cloudflare.com/analytics/analytics-engine/sql-reference/statements/
- Analytics Engine, querying from a Worker, updated 2026-04-23: https://developers.cloudflare.com/analytics/analytics-engine/worker-querying/
- Analytics Engine FAQs, updated 2026-04-23: https://developers.cloudflare.com/analytics/faq/wae-faqs/
- Analytics SQL binding, updated 2026-10-02: https://developers.cloudflare.com/analytics/sql-api/workers-binding/
- Containers limits, updated 2026-10-21: https://developers.cloudflare.com/containers/platform/limits/
- Validate JWTs, updated 2026-05-06: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- Zero Trust account limits, updated 2026-10-16: https://developers.cloudflare.com/cloudflare-one/account-limits/
- Seat management, updated 2026-05-01: https://developers.cloudflare.com/cloudflare-one/team-and-resources/users/seat-management/
- Rust on Workers, updated 2026-04-23: https://developers.cloudflare.com/workers/languages/rust/
- workers-rs releases, 0.8.7 published 2026-09-25: https://github.com/cloudflare/workers-rs/releases
- The `worker` crate, 0.8.7 published 2026-09-25: https://crates.io/crates/worker
- README of workers-rs 0.8.7: https://github.com/cloudflare/workers-rs/blob/v0.8.7/README.md
- Source of workers-rs 0.8.7: https://github.com/cloudflare/workers-rs/tree/v0.8.7/worker/src
- workers-rs issue 663, open: https://github.com/cloudflare/workers-rs/issues/663
- workers-rs pull request 918, open: https://github.com/cloudflare/workers-rs/pull/918

[wl]: https://developers.cloudflare.com/workers/platform/limits/
[wp]: https://developers.cloudflare.com/workers/platform/pricing/
[wrc]: https://developers.cloudflare.com/workers/wrangler/configuration/
[sa]: https://developers.cloudflare.com/workers/static-assets/
[sb]: https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/
[ct]: https://developers.cloudflare.com/workers/configuration/cron-triggers/
[wdev]: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
[vu]: https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/
[wenv]: https://developers.cloudflare.com/workers/wrangler/environments/
[pv]: https://developers.cloudflare.com/workers/previews/
[pvr]: https://developers.cloudflare.com/workers/previews/resources/
[pvcd]: https://developers.cloudflare.com/workers/previews/custom-domains/
[wca]: https://developers.cloudflare.com/workers/configuration/cloudflare-access/
[so]: https://developers.cloudflare.com/workers/platform/storage-options/
[ql]: https://developers.cloudflare.com/queues/platform/limits/
[qbr]: https://developers.cloudflare.com/queues/configuration/batching-retries/
[dlq]: https://developers.cloudflare.com/queues/configuration/dead-letter-queues/
[wfl]: https://developers.cloudflare.com/workflows/reference/limits/
[wfb]: https://developers.cloudflare.com/changelog/post/2026-07-07-workflows-billing-updates/
[br]: https://developers.cloudflare.com/browser-run/
[brl]: https://developers.cloudflare.com/browser-run/limits/
[brp]: https://developers.cloudflare.com/browser-run/pricing/
[d1l]: https://developers.cloudflare.com/d1/platform/limits/
[kvl]: https://developers.cloudflare.com/kv/platform/limits/
[kvw]: https://developers.cloudflare.com/kv/concepts/how-kv-works/
[r2l]: https://developers.cloudflare.com/r2/platform/limits/
[r2p]: https://developers.cloudflare.com/r2/pricing/
[ael]: https://developers.cloudflare.com/analytics/analytics-engine/limits/
[aep]: https://developers.cloudflare.com/analytics/analytics-engine/pricing/
[aegs]: https://developers.cloudflare.com/analytics/analytics-engine/get-started/
[aesql]: https://developers.cloudflare.com/analytics/analytics-engine/sql-api/
[aess]: https://developers.cloudflare.com/analytics/analytics-engine/sql-reference/statements/
[aewq]: https://developers.cloudflare.com/analytics/analytics-engine/worker-querying/
[aefaq]: https://developers.cloudflare.com/analytics/faq/wae-faqs/
[asqlb]: https://developers.cloudflare.com/analytics/sql-api/workers-binding/
[cl]: https://developers.cloudflare.com/containers/platform/limits/
[jwt]: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
[ztl]: https://developers.cloudflare.com/cloudflare-one/account-limits/
[seat]: https://developers.cloudflare.com/cloudflare-one/team-and-resources/users/seat-management/
[rust]: https://developers.cloudflare.com/workers/languages/rust/
[wrsr]: https://github.com/cloudflare/workers-rs/releases
[wrsc]: https://crates.io/crates/worker
[wrsm]: https://github.com/cloudflare/workers-rs/blob/v0.8.7/README.md
[wrss]: https://github.com/cloudflare/workers-rs/tree/v0.8.7/worker/src
[wrs663]: https://github.com/cloudflare/workers-rs/issues/663
[wrs918]: https://github.com/cloudflare/workers-rs/pull/918
