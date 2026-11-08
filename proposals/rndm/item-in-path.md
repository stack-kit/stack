### Product

rndm.rs, v2.2.0

### Kind

missing

### What the product found

`itemInAddress` of `@stack-kit/stack/behaviour/item` keeps the open item of a ListSplit in the query string, as `?item=<key>`, and it reads `page.url.searchParams`. "Item column" in `### Detail pane` of DESIGN.md names that form.

The back office of rndm.rs decided that every address of the admin is a path with slashes and no query string (ticket RNDM-174, 2026-11-07). The item of a list is the last segment of the path: `/mail/desk/<conversation>`, `/inquiries/<id>` and `/deals/week/<id>`. The notices that the admin sends by mail link those paths, so the form must not change with the page.

STACK has no path form. A page that uses `itemInAddress` gets `?item=`. A page that uses the other mode of ListSplit (`open`, `key` and `onopen`) can keep the item in the path, but it loses J, K, Down, Up and Esc, because ListSplit binds those keys through `address`.

### Evidence

The product keeps a stopgap in `admin/src/lib/path.ts` of rndm-doo/rndm-code, on branch `feat/rndm-174-paths` (pull request #103). It is an adapted copy of `behaviour/item.ts` with the function `itemInPath`. The function returns an `ItemInAddress`, so ListSplit and SplitRow take it as `address` with no change.

The file shows what the product needs from a path form:

- The call takes four functions of the page. `list()` gives the path of the list, such as `/mail/desk`, with no slash at the end. `named()` gives the item that the path names, which is the param of the route, or null. `shown()` gives the keys of the rows that show. `keysOff()` is optional and works as it does today.
- `show(key)` writes `<list>/<key>` with `goto(path, { replace: true, reset: false })`, and the key is encoded with `encodeURIComponent`. It writes nothing when the path already names that key.
- `step(by)` and the first row work as they do in `itemInAddress`. From 1024 px, a path that names no item shows the first row that shows, the path does not change, and that item stays unread. A new first row of a refresh does not replace it until its row leaves the list.
- A path that names an item keeps the column on that item, also when its row leaves the list.
- `close()` writes the path of the list, `list()`, and no item. A path of the list alone also means "no item", so the closed column needs a second signal. The stopgap writes the history state `closed: true` with `persistState: true`, and it reads `page.state.closed`. A reload then keeps the column closed, and the closed column stays out of the path. After `close()` the focus goes to the row of the item.
- The rows keep the interface `key`, `open`, `firstRow`, `keysOff`, `show`, `step`, `close`, `openPage` and `rowId`.
- The stopgap has no `onread` option. A path form in STACK should keep `onread`, so that it runs when the path changes to name a key, as it does for `?item=`.

The same file holds `pathOf(url)`, which maps an old address with a query string to its path. That function belongs to the product and is not part of this proposal.

### Proposed rule or change

Add a path form to `itemInAddress`, or a sibling function `itemInPath` with the same return type `ItemInAddress`. A new option makes the choice, for example `itemInAddress({ shown, path: { list: () => '/inquiries', named: () => page.params.id ?? null } })`. The names are the maintainer's to choose.

Text for "Item column" in `### Detail pane`, after the sentence about `?item=`:

"A page can keep the key as the last segment of the path instead, such as `/quotes/QUO-0042`. The page gives `itemInAddress` the path of the list and a function that reads the key from a param of the route. The path of the list alone names no item, so `itemInAddress` keeps the closed column in the history state of the page. A reload keeps the column closed, and the path stays the path of the list."

Text for "Esc and Close" in `### Detail pane`, after the sentence about the key with no value:

"With the path form, `close()` writes the path of the list and sets the history state `closed`. The state is not part of the address, so a link to the list opens the first row again."

The path form must give ListSplit the same J, K, Down, Up, Enter and Esc as the query form, so a product does not choose between the address form and the keys.

### What the product does until a release ships it

The product keeps `itemInPath` in `admin/src/lib/path.ts` and marks it `stopgap #item-in-path` in the code. When this pull request has a number, the product replaces the mark with `stopgap #<number>`. When a release ships the path form, the product deletes the copy and imports the function from the package.
