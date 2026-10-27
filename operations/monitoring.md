# Monitoring

This file says what a back office or a dashboard app monitors, how and why. It assumes the platform that STACK recommends: Cloudflare Workers, with D1 for the data, Queues for the background work and Analytics Engine for the counts. An area with "(public site)" in its heading applies only when the app also serves a public site.

The rules come from the monitoring survey of one product, dated 2026-10-19. STACK took only the parts that hold for every app.

## How to read this file

Each rule carries one of three tiers:

- **Proven.** It runs in a product, and a measurement shows the result.
- **Recommended.** It is decided with a reason, and it is not yet measured in a product. Use it as the default, and send back what you measure.
- **Not recommended.** It was turned down. The rule gives the reason.

"Open questions" holds what the evidence does not settle. The last section lists what a new project sets up on its first day.

A price, a limit or a default belongs to the vendor, and it changes. Each one here carries the date on which somebody read it, or the date of the survey when the read date is not known. Check before use. The prices are in one table under "Cost and usage".

## Build on the platform first

- **Recommended.** Build a monitoring feature on the platform when the work is small. Use an outside tool only when you cannot build the feature at a fair cost, or when the tool is a temporary help that leaves no data and no code behind.

**Why.** The outside analytics, heatmap and replay tools were compared on 2026-10-12. Some do not run on Workers, one sends the data of the visitors to a vendor that calls itself a controller, and the self-hosted ones need a server with 8 to 16 GB of memory.

## Errors and request ids

**What to watch.** Each failed request and each failed invocation of a Worker.

- **Recommended.** Give every error response a request id and the version of the deploy. Bind `version_metadata` in each Worker, and write the version into the logs and the error responses.
- **Recommended.** Let the admin make a new request id for each call to the API. Store the request id in the audit row of the same request.

**How.** One shared JSON error envelope holds the request id and the version. The Cloudflare dashboard shows the invocation errors, such as `exceededCpu`.

**Why.** One id ties a failed request in the admin to its log line and its audit row. The version ties the failure to a deploy.

**What it does not catch.** Nothing groups the errors, counts them over time or tells a person. Somebody must open the dashboard. An error in the browser of a visitor is out of view.

## Logs

**What to watch.** Each invocation of each Worker: the requests, the cron runs, the queue batches and the lines that the code writes.

- **Recommended.** Turn on Workers Logs in every Worker, and bind `version_metadata` in the same config.
- **Recommended.** Log ids, never personal data.
- **Recommended.** Give each project one API token with only the permissions that monitoring needs, such as "Workers Tail Read" for `wrangler tail` and "Account Analytics Read" for the Analytics Engine SQL API. The project lists the permissions by name, and never the token.

**How.** The block below passed a dry run of Wrangler 4.151.1 inside a full `wrangler.jsonc` on 2026-10-19. Wrangler refuses an unknown field in `observability`, so a dry run catches a misspelled name. No Worker with this block is deployed yet, so nobody has seen a log line, a trace or an issue from it.

```jsonc
"version_metadata": { "binding": "VERSION_METADATA" },
"observability": {
  "logs": { "enabled": true, "head_sampling_rate": 1, "invocation_logs": true },
  "traces": { "enabled": true, "head_sampling_rate": 0.1 },
  "issues": { "enabled": true }
}
```

The Wrangler configuration page (updated 2026-10-17) says that `observability.enabled` defaults to `true` for all new Workers, so a config without the block may log anyway. Nobody has checked this on a deployed Worker.

**What it does not catch.** A Worker that does not run writes no log: no outage of a host, no cron that never starts, no DNS fault. A request for a static asset runs no Worker code unless `run_worker_first` lists its route, so the page views of a static site never reach the logs. Seven days of retention cannot answer a question about the last month.

## Jobs and failed work

**What to watch.** The background work and its failures after the retries: imports, rollups, calls to outside APIs and mail sends.

- **Recommended.** Give every queue a dead-letter queue, and a consumer on it that marks the job dead and tells a person.
- **Recommended.** Keep a `job` table in each module that counts the attempts. Show all the jobs on one job page in the admin, with a retry that puts the job back and writes an audit row.
- **Recommended.** Make every job idempotent. Each message carries a job id, and the consumer skips a job id that is done.

**How.** Long work goes into a queue, and timed work goes into a cron trigger. A message comes back a fixed number of times, then it goes to the dead-letter queue.

**Why.** Without a dead-letter queue, the platform discards a message after its last retry (Wrangler configuration page, 2026-10-19. Check before use).

**What it does not catch.** A cron that never starts writes no job row and sends no notice. A job that hangs stays "running" until its wall time ends, which is 15 minutes for a queue consumer (Cloudflare limits, read 2026-10-18. Check before use).

## Notices and mail

**What to watch.** Nothing of its own. This area delivers what the other areas find: a failed job, a task that is due, a traffic alert, the weekly report.

- **Recommended.** Build one notification module for each app, with one queue in front of it. Every module puts its notices and its mail on that queue, so that no module keeps its own notice code.
- **Recommended.** Let each user choose, for each module, which notices arrive and how. Send no digest when it is empty.
- **Recommended.** Let the notification module remind a person of each review by hand, such as a monthly look at a report. A review that nothing reminds a person of does not happen.
- **Recommended.** Feed each permanent bounce back into the record of the address, and show it in the admin.
- **Recommended.** For bulk mail, suppress an address on a hard bounce, and not on a soft bounce. Pause the sending when the bounce rate or the complaint rate is high. Send nothing while SPF, DKIM or DMARC fails.
- **Not recommended.** An open pixel or click tracking in mail to people in the EU or the UK without their consent. A tracking pixel needs consent there.

**How.** Cloudflare Email Service sends through the `send_email` binding, and it fires `message.bounced` on a permanent bounce. A queue consumer then marks the address invalid. The send log keeps a hash of the recipient, and a nightly job deletes the old rows. Email Service is in beta, and it is meant for transactional mail only (read 2026-10-12. Check before use).

**Why.** Gmail asks every sender for a spam rate below 0.3 percent, and its FAQ says to stay below 0.1 percent. Two bulk mail tools pause a sender at a bounce rate of 5 percent and 8 percent. (Read 2026-10-12. Check before use.)

**What it does not catch.** When the notification module or the mail service fails, the notice about that failure takes the same failed path. Mail that lands in the spam folder.

## The audit trail

**What to watch.** Each change in the back office, and each login: who, when, which module, which record and which fields. The actions are create, update, delete, merge, export, erase and restore.

- **Recommended.** Create an append-only `audit_event` table in each database with the first migration. Write each row in the same D1 batch as the change, because a batch is one transaction.
- **Recommended.** Store ids and field names, never the values of personal fields. Store the request id. Give the table no foreign key, so that no cascade removes history.
- **Recommended.** Let cron and queue jobs that run a fixed rule write the actor kind `system`. Let an agent write the actor kind `agent` and its own id in `actor_id`. Examples are an agent that writes a draft, sorts a message or claims a job.
- **Recommended.** When an agent acts for a person, write the id of that person in `for_user_id`. It is the same id that `actor_id` holds on a `user` row of that person. An agent that acts for no person, such as one that a cron job starts, writes the kind `agent` with no person.
- **Recommended.** On the audit page, an `agent` row shows the agent and the person, as "Words" in `architecture/web-app.md` asks. A row with no person shows the agent alone. Show each actor kind as one word from the glossary of the product.
- **Recommended.** Give the audit page a filter by the actor kind, so that a person can list every action of the agents. The filter is a filter chip of the top bar (`### App shell` in `DESIGN.md`). It is not a view tab, because a view tab shows the same list in another form (`### Lists`).
- **Recommended.** Keep a ledger outside the database for each action that a restore would undo, such as an erasure. A Time Travel restore of a D1 database to a point before an erasure also removes the audit row of that erasure.

**How.** Each database holds its own table, and the audit page of the admin merges the rows of all the modules by time. This DDL runs on SQLite 3.51.0. Its CHECKs refuse an unknown actor kind, and a person on a row that is not `agent` (measured 2026-10-26). Nobody has run it on D1 yet.

```sql
CREATE TABLE audit_event (
  id           TEXT PRIMARY KEY,
  at           TEXT NOT NULL,
  actor_kind   TEXT NOT NULL CHECK (actor_kind IN ('user','system','api','subject','agent')),
  actor_id     TEXT,
  for_user_id  TEXT,            -- the person for whom an agent acts, on an agent row only
  action       TEXT NOT NULL,   -- create, update, delete, merge, export, erase, restore
  entity       TEXT NOT NULL,
  entity_id    TEXT NOT NULL,
  fields       TEXT,            -- JSON array of field names, never the values
  request_id   TEXT,
  CHECK (for_user_id IS NULL OR actor_kind = 'agent')
) STRICT;                       -- no foreign keys: an erasure must not remove history
CREATE INDEX audit_entity ON audit_event(entity, entity_id, at);
CREATE INDEX audit_at ON audit_event(at);
```

The first version of this table had four kinds, `user`, `system`, `api` and `subject`, and no `for_user_id`. SQLite cannot change the CHECK of a table in place ([ALTER TABLE](https://www.sqlite.org/lang_altertable.html), read 2026-10-26). So each product runs the file below once in each database that holds the first version, at its next update of STACK. A product that creates the table later uses the DDL above, and never runs the file.

The file creates the new table, copies every row, drops the old table, renames the new table and creates the two indexes again. The old rows keep their values, with their `id` and their `at`, and they get no person. The first statement of the file fails when the table already has `for_user_id`, so a second run stops before it copies the rows again.

For each such database, create the file with `wrangler d1 migrations create <database> audit_event_agent`, and apply it with `wrangler d1 migrations apply <database> --remote`. Wrangler records each applied file in the table `d1_migrations`, and it applies only the files that are not there ([D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), read 2026-10-26). When a migration ends in an error, Wrangler rolls that migration back and keeps the migrations before it ([Wrangler D1 commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/), read 2026-10-26). So a file that stops halfway leaves the old table as it was. Apply the file only in this way. Outside a transaction, a stop after the drop leaves the rows only in `audit_event_new` (measured 2026-10-26 on SQLite 3.51.0). A new run then fails at its first statement, because the table `audit_event` does not exist. The product reads the error, removes its cause and applies the file again.

The file ran on SQLite 3.51.0 inside one transaction, on rows of the four old kinds. Every row kept its values, and the new table refused the same rows as the DDL above. A second run failed at its first statement, and a run that stopped after the drop left the old table as it was (measured 2026-10-26). Nobody has run the file on D1 yet.

```sql
-- Rebuild audit_event with the kind agent and the column for_user_id. Run it once in each database.
-- The first statement fails on a second run, so the file never copies the table twice.
ALTER TABLE audit_event ADD COLUMN for_user_id TEXT;
CREATE TABLE audit_event_new (
  id           TEXT PRIMARY KEY,
  at           TEXT NOT NULL,
  actor_kind   TEXT NOT NULL CHECK (actor_kind IN ('user','system','api','subject','agent')),
  actor_id     TEXT,
  for_user_id  TEXT,            -- the person for whom an agent acts, on an agent row only
  action       TEXT NOT NULL,   -- create, update, delete, merge, export, erase, restore
  entity       TEXT NOT NULL,
  entity_id    TEXT NOT NULL,
  fields       TEXT,            -- JSON array of field names, never the values
  request_id   TEXT,
  CHECK (for_user_id IS NULL OR actor_kind = 'agent')
) STRICT;                       -- no foreign keys: an erasure must not remove history
INSERT INTO audit_event_new (id, at, actor_kind, actor_id, for_user_id, action, entity, entity_id, fields, request_id)
  SELECT id, at, actor_kind, actor_id, for_user_id, action, entity, entity_id, fields, request_id FROM audit_event;
DROP TABLE audit_event;
ALTER TABLE audit_event_new RENAME TO audit_event;
CREATE INDEX audit_entity ON audit_event(entity, entity_id, at);
CREATE INDEX audit_at ON audit_event(at);
```

**Why.** Under GDPR Art. 5(2), the controller must be able to show compliance. The kind `agent` tells the work of an agent from the work of a person and of a fixed rule. As `system`, the row of an agent hides that an agent made a choice. As `user`, it shows the agent as a person. An agent that acts for no person still makes a choice that no fixed rule makes, so its row stays `agent`. The name `for_user_id` says that the column holds the id of a `user` actor. The table keeps no id of the run of an agent, because STACK defines no record of a run. SQLite adds a column with no constraint and does not change the rows ([ALTER TABLE](https://www.sqlite.org/lang_altertable.html), read 2026-10-26). So a product that keeps its runs adds `run_id` later with `ALTER TABLE ... ADD COLUMN`, and needs no rebuild (measured 2026-10-26). A queue job already has a job id ("Jobs and failed work"). A product that wants it on the row adds `job_id` in the same way.

**What it does not catch.** A plain read writes no row. A change outside the Worker, such as a SQL statement through Wrangler or a Time Travel restore, writes no row. A row does not show the old or the new value, by design. The retention period of the rows is a legal decision for each product. The file copies only the columns and the two indexes of the first version. A product that added a column, an index or a trigger to the table adds it to its copy of the file. The file drops each of them with no error (measured 2026-10-26). Before the run, the product compares `SELECT type, name, sql FROM sqlite_master WHERE tbl_name = 'audit_event'` with the first version ([D1 SQL statements](https://developers.cloudflare.com/d1/sql-api/sql-statements/), read 2026-10-26). The file changes no old row, so a row that an agent wrote under another kind before keeps that kind.

## Checks after a build and after a deploy

**What to watch.** That the built output holds nothing internal, and that the deployed host answers with the right status and headers.

- **Proven.** Put gates into every static build that stop the deploy: no HTML comment in the output, no internal marker token, the robots meta `noindex, nofollow` on every page of a test host, no external request, and every link resolves to a file in the output.
- **Recommended.** Report the dead anchors between pages as information first, and make that check a gate when the templates are final.
- **Proven.** After each deploy, check the status and the headers of the canonical address of each key page. The platform sends `/page.html` to `/page` with a 307 by default (`html_handling` is `auto-trailing-slash`), so a check of the `.html` address sees the redirect. A `_headers` rule for `/page.html` also reaches the 307 and not the page.
- **Proven.** Send `X-Robots-Tag: noindex, nofollow` from every test host, with a `_headers` rule on `/*`, and check it on a 404 as well.
- **Recommended.** Put these checks into a script that fails on a wrong status or a missing header, and run it in the deploy step, so that the deploy fails with it.
- **Recommended.** Check `robots.txt` and the sitemap in the same script. A zone setting can serve a `robots.txt` that is not in the deploy package.

**Why.** A gate in the build costs nothing and stops a leak before it is public. A check by hand runs only when a person runs it. Measured on 2026-10-19: the build gates ran and passed on 34 files, and a 404 carried the header. The check after the deploy found two faults that nobody had seen: the expected 200 was a 307, and a cache header rule missed its page.

**What it does not catch.** The time between deploys, so an outage shows only when somebody opens a page. A gate knows only what its list names: a check against a fixed list of words lets every other word through.

## CI checks

**What to watch.** Each change to a Worker before the deploy, and production after it.

- **Recommended.** Fail CI when a generated API contract differs from the file in git. A test writes the contract of each module, such as `openapi/<module>.json`, and the admin generates its types from it.
- **Recommended.** Measure the startup time of each Worker in CI with `wrangler check startup`, and fail above a threshold well under the limit, such as 500 ms. A deploy whose startup takes more than 1 second fails with error 10021 (Cloudflare limits, read 2026-10-18. Check before use).
- **Recommended.** Check the dependency rules with the package tool. For example, only one adapter package depends on the platform API, and no module depends on another module.
- **Recommended.** Give each Worker a preview environment with its own databases, queues and secrets. A pull request deploys there. A merge to `main` deploys to production and runs a smoke test that signs in with a Cloudflare Access service token.

**What it does not catch.** The smoke test runs once after a merge, and nothing runs it again later.

## Speed

**What to watch.** The lab speed of every page: LCP, INP and CLS.

- **Recommended.** Run Lighthouse CI on each build, and a crawl of the whole site with a tool such as Unlighthouse. Use fixed thresholds that fail the build, and upload no report to a public service. The thresholds that Google publishes are LCP of 2.5 s or less, INP under 200 ms and CLS under 0.1 (check before use).
- **Recommended.** Keep PageSpeed Insights and WebPageTest for one-off checks.

**Why.** Google says that its ranking systems use Core Web Vitals. Both build tools are free and run in the build, so no outside service keeps the data.

**What it does not catch.** A real visitor on a real device and network. "Real-user vitals" covers the field data.

## Own visit statistics (public site)

**What to watch.** The page views by path, referrer host, UTM fields, country, device class and browser language. The visits. The leads, and the conversion rate per landing page and source.

- **Recommended.** Count page views on the server into Analytics Engine, with no IP and no identifier. The site Worker lists the HTML routes in `run_worker_first`, and passes the facts of each page view on inside `waitUntil`.
- **Recommended.** Count only the requests with `Sec-Fetch-Dest: document` and no `Sec-Purpose: prefetch`. Count a visit when the referrer host is not your own.
- **Recommended.** Roll the data up into narrow D1 tables every night, before the 3-month limit, and run the last 3 days again. Count with `SUM(_sample_interval)`, because Analytics Engine samples.
- **Recommended.** Read Analytics Engine from a Worker, such as the nightly roll-up or an admin page, through the Analytics SQL binding (the `analytics` key, Wrangler 4.145.0 or later). The query takes parameters and needs no API token. The binding does not retry a failed query, so the roll-up runs the last 3 days again. Read from outside a Worker, such as a script on a laptop, through the SQL API with a token that has only Account Analytics Read. The facts and their sources are in [`providers/cloudflare.md`](../providers/cloudflare.md), "Analytics Engine".
- **Recommended.** Store the attribution on the lead row when the lead arrives: the landing page, the first referrer and the UTM fields. Analytics Engine has no JOIN, so it cannot attribute a lead later.
- **Recommended.** Set a first-party visitor id only after the visitor accepts statistics. A visitor who refuses counts only in the totals.
- **Not recommended.** An outside analytics tool, or a fork of one, for the counts or the vitals. Cloudflare Web Analytics keeps no query strings, so it keeps no UTM fields, and its data stays in the US unless an Enterprise add-on is bought. The other tools that were compared do not run on Workers, or they lack the dimensions and the bot filter that a product needs (compared 2026-10-12. Check before use).

**Why.** A count on the server carries the least legal risk. Under ePrivacy Art. 5(3), storage on the device or access to it needs consent, and EDPB Guidelines 2/2023, paragraph 33, put JavaScript that sends requests in scope.

**What it does not catch.** A navigation from the browser cache or the back-forward cache never reaches the server. Some AI chat apps almost never send a referrer, and a click in an AI answer on a search page arrives as plain search. Analytics Engine keeps data 3 months, and it samples when writes come fast into one index (read 2026-10-12. Check before use). Where it stores the data is not known.

## Traffic alerts and the weekly report

**What to watch.** A jump, a drop, or no data for a number of days. Once a week, the change against the last week.

- **Recommended.** Put a "no data for N days" alert on every metric pipeline. It also finds a broken collector.
- **Recommended.** Send a weekly summary with the change against the last period, because small numbers need context.

**How.** Both read the nightly D1 rollup, and the notification module sends them.

**What it does not catch.** The rollup runs once a night, so an alert comes the next day at the earliest.

## Bots and 404s (public site)

**What to watch.** The crawler and AI agent fetches by purpose, the verified bots, and every 404.

- **Recommended.** Report the 404s and the bot fetches from the server, from the requests that the site Worker passes on and the status of each response. A 404 creates a fix task.
- **Recommended.** Treat a 200 for an address that does not exist as a fault to look for. A site measured on 2026-10-19 answered `/robots.txt` with its HTML home page and status 200.

**Why.** The Worker sees fetches that no JavaScript tool sees, and a 404 report needs no beacon. Since 2026-09-15, a "Block" of the training bots in the Cloudflare AI bot settings also applies to Applebot, Bingbot and Googlebot, so it can remove a site from Google and Bing (2026-10-19. Check before use).

**What it does not catch.** A soft 404, when the report reads only the status. A request for a static asset that skips the Worker.

## Real-user vitals (public site)

**What to watch.** LCP, INP and CLS at the 75th percentile per page, from real visitors.

- **Recommended.** Collect the field vitals with the `web-vitals` library behind consent, into the same event store as the page views. Report the 75th percentile per page with `quantileExactWeighted`.

**Why.** A lab test misses the real devices. For an outside source, see the outside analytics tools under "Own visit statistics". The public CrUX data is free, but it covers only the eligible addresses, and a new site often has no data (read 2026-10-12).

**What it does not catch.** A visitor who refuses consent sends nothing.

## Heatmaps (public site)

**What to watch.** The clicks on marked elements and the maximum scroll depth, per page, width bucket and deploy version.

- **Recommended.** Record the clicks by element key, such as a `data-hm` attribute, and not by page coordinate. The layout moves across languages and widths, and the key does not.
- **Recommended.** Load the collector only after consent. Set no cookie and no storage, and never record text, input or the IP. Send the clicks with `navigator.sendBeacon` at `pagehide`.
- **Recommended.** Round every count in the overlay to the nearest ten.
- **Recommended.** Run tester sessions only on a host that only the testers can open, such as a host behind Cloudflare Access, with the written consent of each tester.
- **Not recommended.** Session replay, cohorts, visitor profiles and the identification of visitors. They need identifiers, and replay fits no frame without consent.
- **Not recommended.** An outside heatmap or replay tool. Of the tools compared on 2026-10-12, one sends the data to a vendor that calls itself a controller, the self-hosted ones need a server with 8 to 16 GB of memory, and one is near its end of sale.

**How.** Analytics Engine stores one data point per click. The overlay takes a Browser Run screenshot per width bucket, and reads the element boxes in the same browser session. It draws SVG rectangles on a five-step scale, with a legend and a data table, and never a canvas, as the chart rules of [`DESIGN.md`](../DESIGN.md) ask.

**Why.** A heatmap script with no cookie and no identifier is still in scope of ePrivacy Art. 5(3) (EDPB Guidelines 2/2023, paragraph 33). Some countries have a narrow exemption for analytics, and some have none (read 2026-10-12).

**What it does not catch.** The visitors who refuse consent. Mouse movement, hover and replay, by design.

## Consent and outside tags (public site)

**What to watch.** The choice of each visitor per category, such as statistics, heatmaps and ads, and the version of the notice that the visitor saw.

- **Recommended.** Ship one consent component with categories, and a stored record that holds the time, the choice and the version of the notice.
- **Recommended.** Load no beacon and no tag before consent, and treat no choice as a refusal.
- **Recommended.** When the app needs an outside analytics tag, such as GA4, gate it behind the consent component and use the basic consent mode.
- **Recommended.** Test the Google tag gateway against your consent check before you turn it on. The vendor page speaks of tag injection, and the gateway applies to every hostname of the zone, never to one subdomain only (Cloudflare page updated 2026-10-08, read 2026-10-17. Check before use).
- **Recommended.** Send the ad conversions from the server, with hashed identifiers, and only after consent. Keep the plain email address away from the ads code. Show the cost per lead per channel in the admin.

**Why.** Under ePrivacy Art. 5(3), storage on the device or access to it needs consent, and the EDPB guidance puts JavaScript beacons in scope.

**What it does not catch.** The banner does not prove that a tag stayed off before consent. Only a check of the live page shows that. The retention period of the consent records is a legal decision for each product.

## Search engine tools (public site)

**What to watch.** The impressions, clicks and position by query, page, country and device. The index status of each address. The sitemaps and the robots rules.

- **Recommended.** Create the Google Search Console domain property by a DNS TXT record on the first day of a public site, and import it into Bing Webmaster Tools.
- **Recommended.** Store the daily rows of Search Console in D1 before its 16-month limit, and run the last 3 days again, because the data arrives late.
- **Recommended.** Call IndexNow from the deploy with the changed addresses. The build serves the key file.
- **Recommended.** Check the sitemap and `robots.txt` every night.
- **Recommended.** Measure the AI answers for a fixed set of questions on a schedule, through a licensed data route.
- **Not recommended.** A script that queries a consumer chat product, or a model API with search grounding used as a tracker. The terms of the vendors forbid scripted queries to their consumer products, and the terms of one model API forbid any analysis of grounded results (read 2026-10-13. Check before use).

**Why.** Search Console is free and shows your own position for every query where Google showed the site. IndexNow is free, and it reaches Bing and several other engines with up to 10,000 addresses per call. Google does not take part, so Google reads the sitemaps. (Read 2026-10-12. Check before use.)

**What it does not catch.** The Search Console API returns the top rows, and not all rows. IndexNow does not reach Google, and does not say whether an address is indexed. The Search Console report on the Google AI features has no API, and counts impressions only (read 2026-10-13).

## Cost and usage

**What to watch.** The money that each metered service spends in the current month.

- **Recommended.** Give each metered outside API a ledger and a monthly ceiling in your own code. Check the ceiling before each call, stop the calls at the ceiling, and show the spend of the month in the admin. Do this also for a self-hosted tool that calls a metered API, because such a tool may not count the spend.
- **Recommended.** Read the price pages again before a known price change. Workers Logs moves to the Observability pricing on 2026-12-01, and Analytics Engine says that it does not bill "currently".

**How.** The allowances of the Workers paid plan follow. The source is the Workers pricing page, read 2026-10-18, unless the row names another date. Check before use.

| Item | Included each month | Above that |
|---|---|---|
| Plan | Minimum charge USD 5 | |
| Worker requests | 10 million | USD 0.30 per million |
| CPU time | 30 million ms | USD 0.02 per million ms |
| Static asset requests | Free and unlimited | |
| Workers Logs | 20 million events, kept 7 days | USD 0.60 per million, until 2026-12-01 |
| Queues | 1 million operations, each 64 KB written, read or deleted | USD 0.40 per million |
| D1 rows written | 50 million | USD 1.00 per million |
| D1 storage | 5 GB | USD 0.75 per GB-month |
| Analytics Engine writes (read 2026-10-12) | 10 million | USD 0.25 per million, not billed "currently" |
| Analytics Engine reads (read 2026-10-12) | 1 million queries | USD 1.00 per million, not billed "currently" |
| Browser Run (read 2026-10-12) | 10 hours | USD 0.09 per hour |
| Workers Builds | 6,000 minutes | USD 0.005 per minute |
| Email Service (read 2026-10-12) | 3,000 emails, in beta. Mail to the verified addresses of the account is free on all plans | not read |

**What it does not catch.** A ceiling covers only the calls that go through it, and not the Cloudflare bill or an ad budget. Nothing measures the usage above the allowances.

## Open questions

The evidence does not settle these yet. A product that settles one sends the result back.

- Error grouping: Workers Issues (`observability.issues`, which needs Wrangler 4.134.0 or later), an outside error tracker, or logs only. Nobody has compared them. An outside tracker was turned down by the rule "Build on the platform first", and not by a comparison.
- Traces: the block in "Logs" turns them on at 10 percent, and nobody has read one yet.
- Logs that live longer than 7 days, through Logpush or another log store. Logpush is on the paid plan only, with 10 million requests a month included, then USD 0.05 per million (read 2026-10-18. Check before use).
- An uptime check from outside, and a health route in each Worker.
- A check that each cron ran. A cron that does not run sends nothing.
- The expiry of the certificates and of the domain.
- A usage check and a bill alert on each Cloudflare account. Every app needs one, and STACK has not chosen the tool.
- A second channel for a failure of the notification module itself, such as a chat message or a text message.
- The thresholds of the traffic alerts.
- How Cloudflare will bill a query through the Analytics SQL binding. The pricing page counts each post to the SQL API as one read query, and it does not name the binding (read 2026-10-23).

## What a new project sets up on its first day

1. In every `wrangler.jsonc`: Workers Logs on, `version_metadata` bound, and a decision on traces and issues ("Logs").
2. A request id and the version in the error envelope of the first route ("Errors and request ids").
3. The `audit_event` table in the first migration of each database ("The audit trail").
4. A dead-letter queue and the `job` table with the first queue ("Jobs and failed work").
5. The notification module, or at least its queue, before the first job exists ("Notices and mail").
6. The build gates, and a scripted check after each deploy that fails the deploy ("Checks after a build and after a deploy").
7. An uptime check from outside, and a usage check with a bill alert on the account. STACK has not chosen the tools yet ("Open questions").
8. For a public site: the Search Console domain property by DNS, the Bing import, an IndexNow key, and page counts on the server with no identifier. No tag and no beacon until the consent component exists.
9. A ledger and a ceiling for each metered API before its first call ("Cost and usage").
10. One API token for the project, with only the permissions that monitoring needs ("Logs").
