# Providers

This folder holds one file for each provider that a back office or a dashboard app builds on. A provider file gives the limits, the prices and the quirks of its provider, and the facts that an agent needs before it uses the provider. [`architecture/`](../architecture/) gives the shape that uses these facts, and [`operations/monitoring.md`](../operations/monitoring.md) gives what to watch once the app runs.

## The files

| File | Provider | What it covers | Last read |
|---|---|---|---|
| [`cloudflare.md`](cloudflare.md) | Cloudflare | Workers, Queues, Workflows, Browser Run, D1, KV, R2, Analytics Engine, Containers, Cloudflare Access, the prices of these products, and the Rust crate `worker` | 2026-10-23 |

## The form of a provider file

A provider file is named after its provider, in lower case, such as `cloudflare.md`. It has these sections, in this order:

1. **The opening.** Two short paragraphs: what the file covers, the plan of the provider that the values hold for, and a link to the platform file in `architecture/` when one exists.
2. **What to know first.** A numbered list of the facts that change a design, the most important first. An agent that reads only this list must not build something that the provider refuses.
3. **One section for each product of the provider.** Each section has a table of limits with four columns: the limit, the value, the source and the read date. The quirks of the product follow the table, as a list. A quirk is a behavior that a value in a table cannot show, such as a setting that does not apply in local development.
4. **Prices.** One table with five columns: the item, what the plan includes each month, the price above that, the source and the read date.
5. **Where the sources disagree.** Each case where two pages of the provider give different values for one limit. Give both values with their sources, and the value to design for. Design for the lower value.
6. **Sources.** One line for each page: its title, the date that the page showed as its last update, and its URL. All the pages of one read share one read date, which the section states once.

The rules for each fact:

- Each fact carries its source URL and the date on which somebody read it, in the form `YYYY-MM-DD`. A fact that no source confirms stays out of the file.
- Give a value as the source gives it, in the unit of the source. Write `MB` and `MiB` as the source writes them.
- Give the plan when a value differs between plans. The opening names the plan that the other rows hold for.
- A provider file holds facts, and no recommendation. A recommendation goes into the platform file in `architecture/`, with its tier: Proven, Recommended or Not recommended.
- A provider file names the products of its own provider, and no other product. A library that the provider publishes counts as a product of the provider.
- Write in the voice of the rest of STACK: short sentences, active voice, one word for one meaning, and one line for each paragraph.

## How to tell a stale fact

A provider changes its limits and its prices without notice to STACK. A fact is stale when one of these is true:

- Its read date is more than 90 days old.
- The source page now shows a last update that is later than the date in "Sources".
- A date that the file names has passed, such as the start of a new price.
- A product reports a value that differs from the file.

Before a design depends on a stale fact, read the source again. Then change the value, set the new read date in its row, change the update date of the page in "Sources", and change the "Last read" date in the table of files above. A fact that the source no longer gives leaves the file, and the commit says why. A product that finds a stale fact sends the new value and its source to STACK as a pull request.
