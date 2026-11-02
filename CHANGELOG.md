# Changelog

Each release has a heading `## vX.Y.Z - YYYY-MM-DD` and the sections
Breaking, Behaviour, Added and Fixed. Breaking holds each change that a
product must act on: the change of the contract since the last release, and
one step for each part. Behaviour holds each change that reaches a product
with no edit, so that the product knows what its users see. Added holds each
new part, export, prop and snippet, and Fixed each fix.

A change that a product must act on is a major version: a removed or renamed
prop, callback, snippet, export or `data-slot`, a narrowed type, a new
required input, a changed default that changes what a page shows, a
behaviour that needs a new function from the product, or a change of a rule
of the frame. A new part, a new optional prop or snippet, a change of the
look, or a change of behaviour that needs no input from the product is a
minor version. A fix that keeps the contract and the documented behaviour is
a patch. The release step writes each entry from the commits since the last
tag.

## v2.0.0 - 2026-11-02

### Breaking

- The package now ships every component, every part that STACK adds,
  the behaviour modules and the pages outside the frame of a product. A
  product imports each one from the package, and it holds no copy.
  Before, a product copied the component folders, `utils.ts`, `hooks/`
  and the parts into its own `src/lib/`. The `exports` map of
  `package.json` names each public path: `@stack-kit/stack/ui/<name>`,
  `parts/<Name>`, `behaviour/<name>`, `outside/<Name>`, `outside/codes`,
  `utils`, `hooks/<name>`, `patterns`, `email`, `architecture/keys.json`,
  the CSS paths of "Import the CSS" in `README.md`, `DESIGN.md`,
  `chart-patterns.svg`, `preview/components.lock.json`,
  `preview/contract.json` and `package.json`. The map refuses each
  other path of the package, so each old deep import path ends. For
  example, an import of
  `@stack-kit/stack/preview/src/lib/stack/ListSplit.svelte` gives
  "Cannot find module" in `svelte-check`, "is not exported under the
  conditions" in `vite build`, and a 500 in `vite dev`. A read of a file
  by its path on the disk still works. A product on v1.0.0 or on an
  earlier release takes these steps once:
  1. Change the pin to `#v2.0.0`, and run `npm install`. Then print the
     install line with the command of "Install the packages" in
     `README.md`, and run it. The line starts with `npm install -D -E`,
     so npm moves each of its packages from `dependencies` to
     `devDependencies`. Never keep one of them in `dependencies`: the
     server build then stops on `tw-animate-css`.
  2. Delete the copies, as "Delete the copies" in `README.md` says:
     each folder of `src/lib/components/ui/` that the record lists,
     `utils.ts`, `hooks/`, and each file that copies a part, a module
     or a print file of the release. Then change each import line to
     its export path. The migration table below gives the export path
     of each kind of file.
  3. Set up the root layout, as "Set up the root layout" in `README.md`
     says. The layout renders one `<Toaster />` from
     `@stack-kit/stack/ui/sonner`, and the parts show their toasts in
     it. A second `<Toaster />` on a page shows each toast twice. In
     `onMount`, the layout calls `listenForPrint()` from
     `behaviour/print`, and returns its result. When a person can
     change a key, it also calls `provideKeys(keyOf)` from
     `behaviour/keys` there.
  4. Wrap the content of the top bar of the frame in
     `<FramePlace name="top-bar">`, and the content of the phone header
     in `<FramePlace name="phone-header">`, from `parts/FramePlace`.
  5. Run `npx svelte-kit sync` and the check of the product, such as
     `npm run check`. `svelte-check` names each file that imports a
     deleted file or an old deep path, and each prop that changed. Fix
     each file by the step of its part below, and run the check again
     until it gives 0 errors.
  6. Search the product for each word of the Find column of the
     migration table, and replace each hit by the part of its row.
- The package names the packages of its files as peers in
  `peerDependencies`, each with a caret range from the version of the
  record. Before, it named none. 13 peers are required for every
  product, such as `svelte`, `@sveltejs/kit`, `bits-ui`, `tailwindcss`
  and `svelte-sonner`. `svelte-sonner` is required also for a product
  that shows no toast of its own: `behaviour/undo` shows the Undo toast
  with it, and the board and the reorder list call `behaviour/undo`.
  The other 12 peers are optional, such as the CodeMirror packages of
  `parts/CodeEditor`. They come only with the export paths that need
  them.
- The parts import `$app/state`, `$app/navigation` and `$app/env` of
  SvelteKit 3, and they write the web address with
  `goto(url, { replace: true, reset: false })`. So a product runs
  SvelteKit 3, and the peer range of `@sveltejs/kit` is `^3.0.1`.
- The record `preview/components.lock.json` takes a new form. The
  record keys its `components` by export path, such as `./ui/button` and
  `./parts/ListSplit`, and each entry holds only `uses`, `packages` and
  `edited`. The keys `source`, `root`, `shared` and `css`, and the
  `files` key of each entry, go. A script of a product that reads the
  record takes the new keys, as the command of "Install the packages"
  in `README.md` does.
- An entry of `architecture/keys.json` can have an `id`: the
  `KeyAction` of `behaviour/keys` that runs the key. A key test of a
  product that refuses each field other than `key`, `action`, `scope`
  and `owner` accepts `id`.
- The contract diff from v1.0.0 gives the 39 Breaking lines below.
  v1.0.0 has no `preview/contract.json`, so the diff takes the contract of
  v1.0.0 from the files of its tag:
  `node scripts/contract.mjs diff v1.0.0 v2.0.0`.

  ```text
  - ./email Colors: type changed: { [x: string]: string; } -> { "muted-foreground": string; "primary-foreground": string; background: string; border: string; card: string; destructive: string; foreground: string; link: string; muted: string; primary: string; success: string; warning: string; }
  - ./email MONO: removed
  - ./email ROLES: value changed: any -> readonly ['background', 'card', 'border', 'muted', 'foreground', 'muted-foreground', 'link', 'primary', 'primary-foreground', 'success', 'warning', 'destructive']
  - ./email Role: type changed: any -> 'background' | 'border' | 'card' | 'destructive' | 'foreground' | 'link' | 'muted' | 'muted-foreground' | 'primary' | 'primary-foreground' | 'success' | 'warning'
  - ./email addressLines: removed
  - ./email buttonLines: removed
  - ./email footLines: removed
  - ./email head: removed
  - ./email heading: removed
  - ./outside/LinkPage default: new required callback act: () => Promise<LinkFailed | Refused<'changed' | 'expired' | 'used'> | { facts?: Fact[]; ok: true; }>
  - ./outside/LinkPage default: new required prop facts: Fact[]
  - ./outside/LinkPage default: new required prop product: OutsideProduct
  - ./outside/LinkPage default: new required prop text: string
  - ./outside/LinkPage default: new required prop texts: LinkTexts
  - ./outside/LinkPage default: new required prop title: string
  - ./outside/LinkPage default: new required prop verb: string
  - ./outside/LinkPage default: prop initial narrowed: 'changed' | 'done' | 'expired' | 'failed' | 'not-valid' | 'ready' | 'used' | 'working' -> 'changed' | 'done' | 'expired' | 'failed' | 'not-valid' | 'ready' | 'used'
  - ./outside/OutsidePage default: new required prop product: OutsideProduct
  - ./outside/ReadOnlyPage default: new required prop initial: 'expired' | 'not-valid' | 'ready'
  - ./outside/ReadOnlyPage default: new required prop product: OutsideProduct
  - ./outside/ReadOnlyPage default: new required prop title: string
  - ./outside/ReadOnlyPage default: new required prop until: string
  - ./outside/ReadOnlyPage default: new required snippet children()
  - ./outside/RecoveryPage default: new required callback addPasskey: () => Promise<Refused<'cancelled' | 'failed'> | WithCode>
  - ./outside/RecoveryPage default: new required callback notNow: () => Promise<Refused<'failed'> | WithCode>
  - ./outside/RecoveryPage default: new required callback ondone: Done
  - ./outside/RecoveryPage default: new required callback recoveryCode: (email: string, code: string) => Promise<Refused<'code-wrong' | 'paused' | 'paused-100'> | { ok: true; }>
  - ./outside/RecoveryPage default: new required callback setupCode: (code: string) => Promise<Refused<'paused' | 'setup-used' | 'setup-wrong'> | { ok: true; }>
  - ./outside/RecoveryPage default: new required prop product: OutsideProduct
  - ./outside/RecoveryPage default: prop initial removed
  - ./outside/SignInPage default: new required callback addPasskey: Passkey
  - ./outside/SignInPage default: new required callback deviceCode: (email: string, code: string) => Promise<Refused<'code-expired' | 'code-wrong'> | { ok: true; }>
  - ./outside/SignInPage default: new required callback ondone: Done
  - ./outside/SignInPage default: new required callback passkey: Passkey
  - ./outside/SignInPage default: new required prop links: { recovery: string; }
  - ./outside/SignInPage default: new required prop product: OutsideProduct
  - ./outside/SignInPage default: prop initial removed
  - ./parts/ComponentMenu: export path removed
  - ./ui/sidebar useSidebar: type SidebarStateProps: member open type changed: Getter<boolean> -> () => boolean
  ```

  The type of `open` is the same: `Getter<boolean>` was a local name for
  `() => boolean`, so a product changes nothing.

  The nine lines of `./email` ask nothing of a product. v1.0.0 did not
  ship the email module, so the diff reads the file of the preview at
  v1.0.0, and no product imported a name of it. A product that copied
  the module deletes its copy, as the table below says.

  Take one step for each part:
  - `outside/OutsidePage`, `outside/SignInPage`, `outside/RecoveryPage`,
    `outside/LinkPage` and `outside/ReadOnlyPage`: v1.0.0 held these
    pages only as pages of the preview, with sample data, and its
    package did not ship them. Now each page takes the `product`, and
    one function for each call to the server of the product.
    `svelte-check` names a page that lacks a required one. A product
    with its own sign-in page keeps its route, deletes the body of the
    page, and renders the page of STACK. SignInPage takes `passkey`,
    `addPasskey`, `deviceCode`, `ondone` and `links.recovery`, and
    `appCode` for the form of an authenticator app. RecoveryPage takes
    `addPasskey`, `notNow`, `recoveryCode`, `setupCode` and `ondone`.
    The prop `initial` of both pages goes. The new SetupLinkPage takes
    `addPasskey`, `notNow` and `ondone`. LinkPage takes `title`,
    `text`, `verb`, `texts`, `facts`, `initial` and `act`. Its
    `initial` has no `working` state, and it takes `done` and `failed`,
    so that a page with no script answers the POST with the page in its
    next state. ReadOnlyPage takes `title`, `initial`, `until`, which is
    a date that the product writes, and the content as children. Each
    function except `ondone` returns `{ ok: true }`, or a refusal
    `{ ok: false, state }` with the state that the page shows, and
    `until` where a pause ends. `addPasskey` and `notNow` of
    RecoveryPage and SetupLinkPage add the new recovery code, as
    `{ ok: true, recoveryCode }`, and `act` can add `facts`. `ondone`
    returns nothing, or a Promise.
    LinkPage shows no link that opens the object, and no report that
    signs in first.
  - `parts/ComponentMenu`: the component menu is a tool of the preview,
    and the package does not ship it. A product that copied it keeps
    the copy as code of its own.
  - `parts/SelectionBar`: while one or more rows are selected, the bar
    takes the place of the content of the top bar from 768 px, and of
    the phone header below 768 px, through `FramePlace`. With no
    `FramePlace` of that name, the bar shows where the page puts it,
    such as in a card. The bar says the count in the live region of the
    place, or in a region of its own. Delete the live region of the
    page that said the count, and a store that moved the bar into the
    top bar. Keep the bar in the page at a count of 0, so that its
    region says "Selection cleared". An action with a submenu goes into
    the `menu` snippet, because a `SelectionAction` has no submenu
    form.
  - `parts/CodeBlock`, `parts/CodeEditor` and `parts/Diff`: the `class`
    goes on a new root element, with the `data-slot`
    `code-block-wrapper`, `code-editor-wrapper` or `diff-wrapper`. The
    box keeps its `data-slot` (`code-block`, `code-editor`, `diff`),
    and it no longer takes the class. A class that places the part,
    such as a margin, a width or a `max-h-` class, still works. A class
    that changed the look of the box, such as `rounded-none`, has no
    effect now. Remove it, or propose the look.
  - `parts/ListSplit`: below 768 px the item column does not show, and
    the keys of the list do nothing. A page that showed its item in the
    column below 768 px gives the item a screen of its own, as "Band 1"
    in `### Width bands` of `DESIGN.md` says.
  - `parts/TimeField` and `parts/TimeZoneField`: v1.0.0 held them only
    as showcase files of the preview. A field of a product that copied
    a showcase imports the part. TimeField needs `label` and `locale`,
    and TimeZoneField needs `locale`. Bind `error` of TimeField, so
    that the same error shows again after a new time clears it.

  The migration table names each kind of file that a product can hold
  in place of a part of v2.0.0: a part of its own, or a copy of a file
  of STACK. Each export path follows `@stack-kit/stack/`. Search the
  product for each word of the Find column. A hit is code that a part
  of the release now owns. A hit in an import of `@stack-kit/stack/` is
  the part itself.

| What the product holds, by role | Find | STACK export | Props and functions | Step |
|---|---|---|---|---|
| an own list split: a list column and an item column | `ListSplit.svelte`, `headLabel` | `parts/ListSplit` | `address`, `listLabel`, `itemLabel`, `list`, `item(layout)`, `head` | Delete the own part. Give the band across both columns as `head`. The `item` snippet takes the layout, `'item'` or `'pane'`. |
| an own row of a list split | `SplitRow.svelte`, `data-key` | `parts/SplitRow` | `key`, `checked`, `oncheck`, `selected`, `unread`, `lines`, `lead`, `line1` to `line3`, `end1` to `end3` | Delete the own part. Inside a list split with an `address`, give each row its `key`. The part draws the check box from `checked` and `oncheck`. |
| own item columns: the content of an item beside its properties | `ItemColumns.svelte` | `parts/ItemColumns` | `content`, `header`, `properties`, `sideLabel` | Delete the own part. Name the properties with `sideLabel`. Put the head of the item into `header`, not into a padded box around the part. |
| an own module of the split: the width bands, the item in the address and the first row | `get('item')`, `closeItem` | `behaviour/item`, `behaviour/width` | `itemInAddress({ shown, onread, href, keysOff, itemParams })`, `bands.md`, `bands.lg` | Delete the module, and the page code that reads or writes the item. Give the result of `itemInAddress` to the list split as `address`. |
| an own selection bar, and a store that moves it into the top bar | `SelectionBar.svelte`, `selection = ` in the top bar | `parts/SelectionBar`, `parts/FramePlace` | `count`, `page`, `total`, `all`, `actions`, `onpage`, `onall`, `onclear`, `menu`; FramePlace `name` | Delete the own bar, the store and the live region of the count. Wrap the content of the top bar and of the phone header in FramePlace. |
| an own toast with Undo, and its Cmd+Z | `toastWithUndo(`, `label: 'Undo'` | `behaviour/undo` | `undoToast(text, { undo, id, duration })` | Delete the own module, and call `undoToast`. Cmd+Z runs `undo` while the toast shows. |
| an own dialog of one short form | `FormDialog.svelte` | `parts/FormDialog` | `id`, `title`, `description`, `short`, `action`, `onsubmit`, `runKey`, `wide`, `disabled`, `cancelLabel`, `open`, `onOpenChange`, the fields as children | Delete the own part. |
| an own button that a rule blocks | `ReasonButton.svelte`, `aria-disabled` on a button | `parts/ReasonButton` | `reason`, `describedby`, `variant`, `size`, `href`, `type`, `onclick` | Delete the own part. |
| an own menu item that a rule blocks | `ReasonMenuItem.svelte` | `parts/ReasonMenuItem` | `label`, `reason`, `onSelect` | Delete the own part. |
| an own check box that a rule holds | `HeldCheckbox.svelte` | `parts/HeldCheckbox` | `checked`, `reason`, `aria-label`, `describedby` | Delete the own part. |
| an own table cell with no value | `Gap.svelte`, an em dash in a cell | `parts/Gap` | `reason` | Delete the own part. Give the reason that a screen reader says. |
| own keys of the shell: Cmd+Z, the keys of a list, the text-field rule and a registry of keys | `GlobalKeys`, `svelte:window onkeydown` | `behaviour/keys` | `provideKeys(keyOf)`, `matches(e, key)`, `keyHint(action)`, `bindKey`, `onEscape`, `DEFAULT_KEYS` | Delete the own Cmd+Z and the keys of the list. The frame keeps its own keys, such as Cmd+K, `?`, `[` and G then a letter. A key of the frame calls `matches(e, key)`, which holds the text-field rule. A sequence such as G then a letter calls `inText(e)`, because `matches` never matches a sequence. Give the keys that a person chose to `provideKeys(keyOf)`. |
| an own text-field rule of the keys of the frame | `inTextField`, `isContentEditable` | `behaviour/keys` | `inText(e)` | Delete the own rule. A key of the frame that `matches` cannot read calls `inText(e)`, and runs only when it returns false. |
| a copy of the email module | `blockLines(`, `footLines(` | `email` | `html(email, colors)`, `text(email)`, `Email`, `Colors`, `ROLES` | Delete the copy and its own list of the roles, and import the module. |
| an own page with no session: the head line, one column, the title and the state | `AuthPage`, `navigator.credentials` | `outside/OutsidePage`, `outside/SignInPage`, `outside/RecoveryPage`, `outside/SetupLinkPage` | `product`, `title`, `tab`, `text`, `noscript`, and the functions of each page in the steps above | Keep the route, and delete the body of the page. |
| an own state line under the buttons of a page outside the frame | `StateLine.svelte` | `outside/StateLine` | `kind` (`wait`, `cancel`, `fail`), `text`, children | Delete the own part. |
| an own code input of a sign-in | `CodeInput.svelte`, `InputOTP` | `outside/CodeInput`, `outside/codes` | `kind` (`device`, `app`), `value`, `invalid`; `CODE_PATTERN`, `readCode`, `pasteCode` | Delete the own part. |
| an own band of key figures | `FigureBand.svelte` | `parts/FigureBand` | `label`, `figures` (`label`, `value`, `note`, `href`, `trend`), `inset`, `loading` | Delete the own part. Format each value in the page, and give it as a string. |
| an own meter that turns to warning past a share of the maximum | `warnAt`, `Meter.svelte` | `parts/Meter` | `value`, `max`, `label`, `figure`, `ticks` | Delete the own part. Give the share as a tick: `{ at, name, role: 'warning', text }`. |
| an own reader of the chart values of `DESIGN.md` at build time | `DESIGN.md?raw`, `readChart` | `patterns` | `PATTERNS`, `chartColor`, `heatColor`, `HEAT_STEPS` and the other exports of `patterns` | Delete the reader and its step in the Vite config. The chart parts and `patterns` read the values of the release. |
| a copy of the board | `Board.svelte` | `parts/Board` | `blocked`, `onmove(item, from, to, undo)`, `menu` | Delete the copy. A rule that keeps a card out of a column goes into `blocked`. |
| a copy of the reorder list | `ReorderList.svelte`, `{#snippet more(`, `more=` | `parts/ReorderList` | `blocked`, `menu`, `onsave`, `fixed`, `readonly` | Delete the copy, and rename `more` to `menu`. A row that never moves goes into `fixed`, and a locked list takes `readonly`. |
| a copy of the diff | `Diff.svelte` | `parts/Diff` | the props of v1.0.0, and `ref` | Delete the copy. A class that changed the look of the box has no effect now. |
| a copy of the code block | `CodeBlock.svelte` | `parts/CodeBlock` | the props of v1.0.0, and `ref` | Delete the copy. A class that changed the look of the box has no effect now. |
| a copy of the QR code | `QrCode.svelte` | `parts/QrCode` | the props of v1.0.0, and `ref` | Delete the copy. |
| a copy of the classes of a read-only check box | `checkbox-readonly` | `parts/HeldCheckbox` | `checked`, `reason` | Delete the copy, and replace each box that takes the classes by HeldCheckbox. The package exports no path to the classes. |
| a copy of the width query that answers for the paper in print | `screen-query.svelte`, `new ScreenQuery(`, `new MediaQuery(` | `behaviour/width` | `bands.md`, `bands.lg`, `bands.xl`, `bands['2xl']`, `ScreenQuery`, `isPrinting` | Delete the copy and each own width query, and read the band of its line. |
| a copy of the time chart | `TimeChart.svelte` | `parts/TimeChart` | the props of v1.0.0, with `style` and `ref` | Delete the copy. The part fits the column of the paper in print. |
| a copy of the line tile | `LineTile.svelte` | `parts/LineTile` | `look` | Delete the copy. |
| a copy of the pattern chart | `PatternChart.svelte`, `time-bar` | `parts/PatternChart` | the props of v1.0.0, with `kind`, `tick` and `style` | Delete the copy. A `time-bar` chart becomes `stacked-bar`, and `tick` gives the short name of each x value. |
| a copy of the chart legend | `PatternLegend.svelte` | `parts/PatternLegend` | `categories`, `context`, `prefix`, `style` | Delete the copy. |
| a copy of the chart tile | `PatternTile.svelte` | `parts/PatternTile` | `n`, `prefix`, `style` | Delete the copy. |
| a copy of the pattern definitions, also under another name | `PatternDefs.svelte`, `<pattern` | `parts/StackPatternDefs` | `prefix`, `style` | Delete the copy, and import the part by its name. |
| a copy of the heat map | `HeatMap.svelte` | `parts/HeatMap` | the props of v1.0.0, with `style` | Delete the copy. |
| a copy of the chart helpers | `patterns.ts` | `patterns` | `PATTERNS`, `chartColor`, `markColor`, `lineLook` and the other exports | Delete the copy. |
| the classes that make a dialog fill the screen below 768 px | `phoneFull`, `max-md:inset-0` | `stack.css` | none | Delete the classes from each dialog and alert dialog. `stack.css` draws the form. |
| a copy of the part that closes the sheet of the sidebar after a link | `CloseSheetOnNavigate.svelte` | `parts/CloseSheetOnNavigate` | children, optional | Delete the copy. Put the part once inside `Sidebar.Provider`. |

### Behaviour

- Below 768 px, each dialog and each alert dialog of the kit fills the
  screen, with its content at the top and the four safe-area insets.
  `stack.css` draws the form, and the rule beats the place, the width
  and the radius classes of the content. Before, each product gave the
  phone classes to each dialog. Those classes now do nothing more.
- An empty state of the kit (`[data-slot=empty]`) is never centered:
  its content starts at the left edge, 32 px under the top of its
  region. The rule of `stack.css` comes after the utilities of
  Tailwind, so it beats the center and the padding classes of the
  component, and also a padding class of a page of the same weight,
  such as `px-4 md:px-6`. A class with `!` beats the rule: an empty
  state with an edge takes `border p-6!` (`### empty` in `DESIGN.md`).
- A link button of the kit with `aria-disabled="true"` draws at 50%.
- The text of a toast takes the body step in the sans font of the
  theme, and its description takes `muted-foreground`.
- While the Undo toast of a move on the board or on the reorder list
  shows, Cmd+Z runs its Undo (Ctrl+Z on each system other than macOS).
  In a text field, Cmd+Z does nothing to the toast. The key ends when
  the toast closes or times out.
- When a page gives `blocked` to the board or to the reorder list, a
  move that the rule blocks stops: the card or the row stays, and the
  sentence of the rule shows in a toast and in the live region. Move to
  in the More menu of a card shows the sentence as its reason. When
  `onmove` or `onsave` returns a Promise that rejects, the card or the
  row goes back, and the part says so in a toast and in the live
  region. Undo shows only after the Promise resolves. On the reorder
  list, `blocked(item, to)` checks only the row that moves. For a rule
  of another row, the product rejects the Promise of `onsave`, and the
  row goes back.
- The reorder list counts its `fixed` rows first, so the live region
  says the place of a row as "position n of m" over all the rows.
- When a page gives a list split an `address`, the open item is in the
  web address, such as `?item=QUO-0042`, so a reload and a link keep
  it. `?item=` with no value keeps the item column closed. From
  1024 px, with no item in the address, the column shows the first row,
  which stays unread, and the address does not change. From 768 px, J
  and Down show the next row, K and Up the row before, and Enter opens
  the item on its full page when the page gives `href`. Esc closes the
  item column after an open layer and after the selection, and the
  focus goes back to the row.
- The selection bar clears the selection on Esc. With the More menu
  open, the first Esc closes only the menu. At a count of 0 the bar
  shows nothing. Before, it showed the text "Selection cleared". Its
  live region still says "Selection cleared" when the count falls to 0.
- The bands of the parts are in rem, as the breakpoints of the CSS are.
  So with a larger font in the browser, the selection bar and the list
  split change their form at the same width as the `md:` and `lg:`
  classes.
- A page that reads `bands.md` of `behaviour/width` in place of an own
  width query takes the narrow form of the column of the paper in
  print, before the layout. Each chart fits the column of the paper in
  print when the root layout calls `listenForPrint()`.
- A stacked chart of one category shows no legend, because its caption
  names the metric. When the names of the x values do not fit under
  the bars, the axis names every nth x value. When the value of a bar
  is wider than its bar, only the tallest bar shows its value.
- The `class` of HeatMap, PatternChart and TimeChart: a height class,
  such as `h-56`, sizes the chart container, as in v1.0.0. Each other
  class now places the root of the part. The legend of PatternLegend
  has a new `div` root, with `data-slot="pattern-legend"`.
- The sections of the properties of ItemColumns stand 16 px apart.
  Before, they had no gap.
- CodeBlock, Diff, ReasonButton and HeldCheckbox give their own tooltip
  provider. So a delay on the root `Tooltip.Provider` of a product does
  not reach their tooltips.
- When a code function of SignInPage or RecoveryPage rejects, the field
  shows "This app could not check the code. Choose Continue to try
  again." After its step, RecoveryPage shows the new recovery code
  once, and Continue then runs `ondone`.
- The global CSS of a product grows, because the `@source` lines of
  `stack.css` make Tailwind scan every part of the package, also a part
  that the product does not import. In a test move of one product, the
  global CSS file grew from 184.43 kB to 242.03 kB, and from 28.23 kB
  to 35.55 kB with gzip.
- The contract diff from v1.0.0 gives the Behaviour lines below.
  v1.0.0 documented no behaviour in its contract, so each documented
  behaviour shows as added, also a behaviour that v1.0.0 had, such as
  N and Shift+N in the diff, or a click on an item of the chart legend.

  ```text
  - ./parts/Board default: behaviour blocked added
  - ./parts/Board default: behaviour keys:undo added
  - ./parts/Board default: behaviour put-back added
  - ./parts/Board default: behaviour undo added
  - ./parts/CodeEditor default: behaviour escape:kept added
  - ./parts/Diff default: behaviour next-change:N added
  - ./parts/Diff default: behaviour previous-change:Shift+N added
  - ./parts/HeatMap default: behaviour print:fit-column added
  - ./parts/ListSplit default: behaviour escape:item added
  - ./parts/ListSplit default: behaviour first-row added
  - ./parts/ListSplit default: behaviour item-in-address added
  - ./parts/ListSplit default: behaviour keys:next-row,previous-row,open-item added
  - ./parts/ListSplit default: behaviour read added
  - ./parts/PatternChart default: behaviour print:fit-column added
  - ./parts/PatternLegend default: behaviour highlight-series added
  - ./parts/PatternLegend default: behaviour toggle-series added
  - ./parts/ReorderList default: behaviour blocked added
  - ./parts/ReorderList default: behaviour keys:undo added
  - ./parts/ReorderList default: behaviour put-back added
  - ./parts/ReorderList default: behaviour undo added
  - ./parts/SelectionBar default: behaviour escape:selection added
  - ./parts/SelectionBar default: behaviour live-region added
  - ./parts/SelectionBar default: behaviour place:top-bar,phone-header added
  - ./parts/Sparkline default: behaviour print:fit-column added
  - ./parts/StackPatternDefs default: behaviour print:marks-as-shapes added
  - ./parts/TimeChart default: behaviour print:fit-column added
  ```

### Added

- New parts:
  - `parts/Banner`: a banner under the top bar, across the list and the
    pane, with `title`, `tint` (`info`, `success`, `warning`,
    `destructive`), and the snippets `icon`, `action` and children.
    The part takes the role `alert` for `destructive` and `status` for
    the other tints. A `role` that the page gives wins, such as
    `role="alert"` for a warning that must speak at once.
  - `parts/CloseSheetOnNavigate`: it closes the sheet of the sidebar
    after a link opens a page.
  - `parts/FormDialog`: a dialog of one short form. Below 768 px it is
    a form screen with Cancel, the title and the action in its header.
    It puts the focus in the first field, and with `runKey`, Cmd+Enter
    runs the action.
  - `parts/FramePlace`: a place of the frame, `top-bar` or
    `phone-header`, that a part such as the selection bar takes, with a
    polite live region.
  - `parts/Gap`: a table cell with no value: a muted em dash that a
    screen reader skips, and a hidden text, `reason`.
  - `parts/HeldCheckbox`: a check box that a rule holds, with `checked`
    and `reason`. It stays in the tab order, and a click or Space does
    not change it.
  - `parts/PageColumns`: the main column of a page, and an optional
    `side` column with `sideLabel`, which stands at the right from
    1280 px.
  - `parts/ReadingColumn`: a column of running text, at most 720 px
    wide, at the start edge of its region.
  - `parts/ReasonButton`: a button that a rule can block. With a
    `reason`, it stays in the tab order, and a tooltip and a line give
    the reason.
  - `parts/ReasonMenuItem`: a menu item that a rule can block, with
    `label`, `reason` and `onSelect`.
  - `parts/SummaryBands`: the bands of a summary page. Each child is one
    band.
  - `parts/TimeField` and `parts/TimeZoneField`: the time field and the
    time zone field.
  - `outside/SetupLinkPage`, `outside/StateLine`, `outside/CodeInput`
    and `outside/codes` (`CODE_PATTERN`, `readCode`, `pasteCode`).
- The behaviour modules:
  - `behaviour/item`: `itemInAddress(options)` with `shown`, `param`,
    `itemParams`, `onread`, `href` and `keysOff`. It gives `key`,
    `open`, `firstRow`, `keysOff`, `show`, `step`, `close`, `openPage`
    and `rowId`. Also `setItemContext` and `getItemContext`.
  - `behaviour/keys`: `KeyAction` (`undo`, `escape`, `next-row`,
    `previous-row`, `open-item` and `submit`), `DEFAULT_KEYS`, `KeyOf`,
    `provideKeys`, `bindKey`, `matches`, `inText`, `keyHint` and
    `onEscape`. `inText(e)` is the text-field rule of `matches`, for a
    key of the frame that `matches` cannot read, such as G then a
    letter. A control with `data-keys-enter` gives its Enter to the
    bindings.
  - `behaviour/place`: `PlaceName`, `claimPlace` and `announce`.
  - `behaviour/print`: `listenForPrint` and `registerChart`.
  - `behaviour/undo`: `undoToast(text, { undo, id, duration })` and
    `UndoOptions`.
  - `behaviour/width`: `bands` (`md`, `lg`, `xl`, `2xl`), `ScreenQuery`
    and `isPrinting`.
- The export path `@stack-kit/stack/email`: `html(email, colors)` gives
  the HTML part of an email of `## Email` in `DESIGN.md`, with inline
  styles, and takes the colors of `### Email colors`. `text(email)`
  gives the plain text part. The path also exports `blockLines`,
  `ROLES`, `SANS` and the types `Email`, `Block`, `Colors`, `Role`,
  `StateRole`, `Link`, `Fact`, `Figure` and `Table`. `html` and
  `blockLines` throw an Error when a color is not a hex value (`#rgb`,
  `#rrggbb` or `#rrggbbaa`), and `html` throws when an address does not
  start with `https://`, so a value never carries markup into the
  email.
- Each of the 50 parts of `parts/` and `outside/` has the five
  extension points: its `<Name>Props` type, `bind:ref`, the other
  attributes of its root element, a `class` that `cn()` merges on the
  root, and a `data-slot` on the root. The contract diff lists each
  point that a part of v1.0.0 lacked.
- New props, callbacks and snippets of the parts of v1.0.0:
  - `parts/Board`: `blocked(item, column)`. `onmove` widens: it takes
    `undo` as a fourth argument, and it can return a Promise.
  - `parts/ReorderList`: `blocked(item, to)`, `fixed`, `readonly` and
    the snippet `menu(item)`. `onsave` can return a Promise.
  - `parts/ListSplit`: `address` and the snippet `head`. The snippet
    `item` takes the layout, and the type `ListSplitLayout` names it.
    `open` becomes optional.
  - `parts/SplitRow`: `key`, `checked` and `oncheck`. `id` becomes
    optional.
  - `parts/ItemColumns`: `sideLabel`.
  - `parts/SelectionBar`: the snippet `menu`.
  - `parts/PatternChart`: `tick`.
  - `parts/CodeBlock`: `copyValue` widens to `string | undefined`.
    `parts/MailMessage`: `onopenfile` widens to take `undefined`.
  - `parts/FlowTable`, `parts/Meter` and `parts/TableTree`: `class`.
    FlowTable and TableTree have a new `div` root (`flow-table`,
    `table-tree`) that takes the class. The table keeps its `data-slot`
    `table`.
  - `outside/OutsidePage`: `text`, `noscript` and `titleRef`.
    `outside/SignInPage`: `appCode`, `action` and `codeHelp`.
    `outside/RecoveryPage`: `action`. `outside/LinkPage`: `resend`,
    `action`, `requestId` and `variant`. `outside/ReadOnlyPage`:
    `text`.
- New types and values: `Transition` of FlowTable, `Tick` of Meter,
  `LinkFailed`, `LinkState`, `LinkTexts` and `NOT_VALID` of LinkPage,
  and `Done`, `OutsideProduct`, `OutsideRoot`, `Passkey` and `Refused`
  of OutsidePage.
- New `data-slot` names: `list-split`, `list-split-head`,
  `list-split-list`, `list-split-item`, `split-row`, `item-columns`,
  `item-columns-properties`, `selection-bar-actions`,
  `selection-bar-more`, `selection-bar-clear`, `reorder-list-wrapper`,
  `code-block-wrapper`, `code-editor-wrapper`, `diff-wrapper`,
  `heat-map`, `pattern-chart`, `pattern-legend`, `pattern-tile`,
  `line-tile`, `stack-pattern-defs`, `sparkline`, `time-chart`,
  `flow-table`, `meter`, `table-tree`, `outside-page`,
  `outside-page-title`, `sign-in-page`, `recovery-page`, `link-page`,
  `read-only-page` and `facts`.
- The export path `@stack-kit/stack/architecture/keys.json`, which the
  key test of a product reads.
- `preview/contract.json`: the contract of the release. For each export
  path that holds code, it gives each name that the path exports, and
  for a part its props, callbacks, snippets, `data-slot` names and
  documented behaviour. The file is 441.8 kB of the 2.6 MB of the
  unpacked package, and the packed package is 619.0 kB.
- The `###` definition of each part in `DESIGN.md` names its export
  path.

### Fixed

- The check of the public repository failed on v1.0.0 at `npm ci` in
  `preview/`, with ERESOLVE: `sveltekit-superforms` 2.31.0 accepts only
  `@sveltejs/kit` 1.x or 2.x, and the preview pins SvelteKit 3. The
  preview now pins `sveltekit-superforms` 3.1.0 and `formsnap` 2.1.0,
  which accept SvelteKit 3, and the form showcase calls `superForm()`.
  A product still builds each form with `field`, because the
  `packages` list of `form` in the record holds `@sveltejs/kit` and
  `vite` (`### form` in `DESIGN.md`).
- DayLog renders on a runtime with no `Intl.DurationFormat`, such as a
  server on Node 22. Before, it threw.
- TimeChart with no rows, and with two metrics or a comparison line,
  draws, and its labels stand at 0. Before, it threw.
- Meter keeps `aria-valuenow` inside 0 to `max`, also for a value past
  its limit. Before, a value past `max` went to `aria-valuenow`.
- The legend of HeatMap has the name "The steps of the heat map" for a
  screen reader. Before, it had no name.

## v1.0.0 - 2026-10-27

### Breaking

- Each release now comes from the public repository
  `https://github.com/stack-kit/stack`. A read of a release needs no
  GitHub login and no key ("Use a release in a product" in
  `README.md`). The package name stays `@stack-kit/stack`. In
  `README.md`, each command that prints the newest tag, clones a tag
  or reads a change log uses the public https address. The change log
  of a tag now comes through `curl` with no login. Before, it came
  through the GitHub API with a `gh` login. A product on v0.9.0 takes
  these steps at this update:
  1. Replace the whole dependency line in `package.json` with this
     line. Then run `npm install`:
     `"@stack-kit/stack": "git+https://github.com/stack-kit/stack.git#v1.0.0"`.
     npm writes the SSH form
     `git+ssh://git@github.com/stack-kit/stack.git#<commit>` into
     `package-lock.json`. But `npm ci` reads the public repository
     over https. So a build host with no SSH key installs the tag
     ("Pin a release with npm").
  2. A project with no Node points its reference clone to the public
     repository with
     `git -C _reference/stack remote set-url origin https://github.com/stack-kit/stack`.
     Then it fetches the tag, as "Update a product to a new release"
     says.
  3. Replace the design line in `AGENTS.md` with the line of "Follow
     the rules for a product" in `README.md`. Its source and its tag
     check name `https://github.com/stack-kit/stack`.
- A proposal is a pull request into `main` of `stack-kit/stack` from a
  branch `proposal/<topic>` of a fork ("Contribute from a product" in
  `README.md`). Before, the branch was `proposal/<product>/<topic>` in
  the repository itself. "Open the pull request" gives the new steps,
  and they still need a `gh` login. A product opens no issue for a
  proposal. Only a release changes `main`
  of `stack-kit/stack`, so STACK merges no pull request. When STACK
  accepts a proposal, it takes the ready change in, or it writes the
  change itself. The next release carries the change. STACK then
  closes the pull request with a link to that release. When STACK
  declines a proposal, it closes the pull request with the reason. A
  ready change under `preview/` also passes `npm ci`, `npm run check`
  and `npm run build:static` in `preview/`, on Node 22.17 or later.
- `### Type steps` and "Phone type" in `### Width bands`: the new type step
  `reading-phone` sets running text to 15 px on a 22 px line below
  768 px. Before, running text kept the `reading` step on a phone,
  14 / 21 px. Now it is as large as the 15 px `body` text around it.
  `stack.css` and `stack-plain.css` change `--text-md` in the phone
  media query, so every `text-md` class follows with no new class. So
  five type steps grow below 768 px, not four. The body, an open quote
  and the translation of a `mail-message` take the step, and so does a
  diff of text (`### diff`). A product that imports `stack.css` or
  `stack-plain.css` changes no code.
- `### figure-band`: a band holds one to four key figures. Before, it
  held two to four. A page with one key figure shows it in a band of
  one under the title of the page, with no card. The list of a band of
  one takes `grid-cols-1` in place of `grid-cols-2`, and its figure
  takes `justify-self-start`. So the figure stands at the start of the
  band, also on a phone, and it is as wide as its parts. The line
  under it crosses the band. `FigureBand.svelte` of the preview takes
  a band of one. A product that copied `FigureBand.svelte` copies it
  again. A product that shows one key figure in a card moves it into a
  band of one.
- "Sorting and search" in `architecture/web-app.md`: the search fold
  changes both texts to lower case, and then it replaces four letters
  that NFD does not split. It replaces ß with ss, ł with l, ø with o,
  and U+0111, the d with a stroke, with d. This order also covers ẞ,
  Ł, Ø and U+0110. Before, the fold replaced only U+0111 and U+0110,
  and it changed the case last. So "strasse" now finds "Straße", and
  "muller" still finds "Müller". A product that folds search text adds
  the three new replacements after the change to lower case.

### Added

- "Make a theme with the generator" in `README.md`: a product makes its
  own theme with the theme generator, `scripts/generate.mjs`. The
  generator takes a base color, an accent color and a contrast level
  from 0 to 100. It writes a theme file with every color role of
  `DESIGN.md` in light and in dark, and `--radius`. The generator
  needs the dev dependencies of STACK, so the npm package does not
  carry it. A product clones its pinned tag into a temporary folder and
  runs `npm ci` there. Then it runs the generator from its own root
  folder, and `--out` names the theme file as a path from that folder.
  When a pair of the contrast check fails, the generator moves the
  lightness of the value until the pair passes. It prints each value
  that it moved. It refuses a theme that fails, with exit code 1. At
  each update, run the command again from a clone of the new tag. The
  first line of the theme file gives the inputs. A block of the Theme
  tab of the create page stays the second way ("Take a theme from the
  Theme tab").
- `CONTRIBUTING.md` of the public repository gives the route of a
  proposal for every contributor. It also gives the checks to run
  before the push of a ready change, and the licence of a
  contribution. A contribution is under the MIT licence of `LICENSE`.
- `scripts/hooks/stack-checks.sh`: the checks of the `pre-commit` hook,
  in one script. It runs the theme check, the names check and the
  markers check on the staged files. It refuses the commit when
  `CHANGELOG.md` has no heading for the version in `package.json`. It
  also refuses every commit when `node` or the packages of `npm ci`
  are missing. The `pre-commit` hook in `.githooks/` runs the script.
  Before that, the hook refuses a staged path with a part that starts
  with `_`, and an embedded repository. The `commit-msg` hook runs the
  names check on the message. To turn the hooks on in a clone, run
  `git config core.hooksPath .githooks`.

### Fixed

- `### table`: below 768 px the header row of a tree is 44 px high
  (`max-md:h-[44px]` on its `Table.Row`). So a box in it, such as
  "Select all", has a target of 44 by 44 px. A product with a tree adds
  the class. `TableTree.svelte` of the preview has it. Before, the
  header row was 40 px, so a tap reached only 40 px of the height of
  that target.
- Step 1 of "Update a product to a new release" in `README.md` copies
  again only the folders that the release holds. A `test -d` guard in
  its command keeps every other folder. The step of v0.9.0 removed a
  folder that the release does not hold, such as `trace`, and then its
  copy failed. A product that lost such a folder takes it back from its
  own git history. Any other folder of `src/lib/components/ui/` stays
  as code of the product, and it must work with the package versions
  of the lock.
- `preview/src/lib/components/ui/LICENSE.md`: the licence notice of
  shadcn-svelte also covers `utils.ts` and `hooks/is-mobile.svelte.ts`.
  They come from the same release of shadcn-svelte. Before, the notice
  named only the component folders and `shadcn-svelte.css`. A product
  copies `LICENSE.md` again at this update, as step 1 of "Update a
  product to a new release" says.
