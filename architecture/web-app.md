# Web app

This file holds the behavior that every web app and every admin area of a website follows. It has nine parts: localization, the keyboard model, the command palette, the screen states, accessibility, the text that people and agents write, the content that the product did not write, the pages with no session and the app on a phone. [`DESIGN.md`](../DESIGN.md) holds the look of the same things. Where a rule here has a look, this file names the part of `DESIGN.md` that holds the look, and does not repeat it. "The `kbd` definition" means the `### kbd` definition in `## Components` of `DESIGN.md`.

A product adds its own keys, words and formats in its own code, and it does not override a rule of this file. When a product needs a rule that this file lacks, it proposes the rule as a pull request, as "Contribute from a product" in `README.md` says, and a later release adds it.

## Localization

### Message keys

Every text that a person sees or hears comes from a message key. This includes the labels, the help texts, the errors, the empty states, the banners, the accessible names and the `aria-live` announcements. A component holds no text literal.

Some vendored components hold English text of their own. The `command-dialog` part of `command` has a default `title` and `description`, and `sidebar-trigger` and `sidebar-rail` have the English accessible name "Toggle Sidebar". A product gives each of these a message key through a prop: `title` and `description` on the command dialog, and `aria-label` on the two sidebar parts. The two sidebar parts spread the props of the product after their own name, so the value of the product wins. A product checks each component that it adds for such text. It never edits a vendored component to change a text.

The shared locales are Serbian in Latin script and English. A product picks the locales that it ships, and its default locale.

- Write Serbian as `sr-Latn-RS`. `Intl` reads `sr` alone as the Cyrillic script.
- Give English its region, such as `en-GB` or `en-US`. The region sets the order of a date and the first day of the week.
- The `lang` attribute of the `html` element names the current locale, so that a screen reader reads each language with its own rules.
- The interface runs left to right only, also in a locale that writes from right to left. A product ships no such interface (`### Direction` in `DESIGN.md`).

A message with a count uses the plural forms of its locale. Serbian has three forms, `one`, `few` and `other`, and English has two, `one` and `other`. Never write "item(s)". Never build a sentence from parts, because the order of the words is different in each language.

This file names no message library. A product picks one until `STACK.md` records a shared choice.

### Content in another language

The interface has one language, that of the locale of the person, and it runs left to right (`### Direction` in `DESIGN.md`). Content can have another language or another direction, such as a message, a field of a record, a document or a name. The look of each case is in `### Content in another language` in `DESIGN.md`.

- Content in another language than the interface carries its own `lang` on the element that holds it, such as a paragraph, a title, a cell or a field. A screen reader then reads it with the rules of its language, and the system picks the face of its script (`### Other scripts` in `DESIGN.md`).
- Content in a language that writes from right to left, such as Arabic or Hebrew, also carries `dir="rtl"` on the same element. The interface around it keeps its own direction.
- Text that a person or an agent wrote in a language that the product does not know takes `dir="auto"`: on the field where a person types it, and on each element that shows it. The browser takes the direction from the first letter that has one. So a text that starts with a Latin identifier runs left to right, also when the rest is Arabic (measured). A product that knows the language sets `lang` and `dir` from it.
- A value inside a sentence of the interface, such as a name, goes into `<bdi>`, so that the words, the figures and the marks around it keep their order. Without it, "Reviewed by", an Arabic name and "· 3 comments" show the count before the name (measured). An element with a `dir` attribute isolates its text in the same way, and in CSS `unicode-bidi: isolate` does.
- A cell of a table keeps the alignment of its column, and the value in a cell goes into `<bdi>`. A `dir` on the cell itself aligns the cell to the start of its value: `dir="auto"` moves an Arabic name to the right edge of the cell (measured). The `lang` and the `dir` of the value go on that `<bdi>`, not on the cell.
- Code, a command and a log keep `dir="ltr"`, also inside content in a right-to-left language. Without it, a line of code in an Arabic block aligns right and moves its semicolon to the other end (measured). The `code-block` and `code-editor` definitions set it.
- A sort and a search of such content follow `### Sorting and search`.

### Formats

Dates, times, numbers, percents and amounts of money go through `Intl` with the current locale: `Intl.DateTimeFormat`, `Intl.NumberFormat` and `Intl.DurationFormat`. Never write a format pattern by hand, except the exact time of a history, an audit trail or a log (see below). Each locale has its own order and its own separators. The exact time is the one form that is the same in every locale, and it too takes its parts from `Intl`.

- An amount of money uses `Intl.NumberFormat` with `style: 'currency'` and the ISO 4217 code of the amount. The look of an amount in a column is the `table` definition.
- A time shows by its age, except in a history, an audit trail or a log. Each of these is a list of past events, one event on each line, in a table or in a list with a column for the time. The activity of a record and a conversation are not such lists, even when they are called a log. They show a time by its age. A time of today shows the time only. A time of this year shows the day, the month and the time. An older time shows the full date. A tooltip shows the full date and time. A duration uses `Intl.DurationFormat`. An email never shows a time by its age, because the person reads it later: `### Language, dates and times` in `DESIGN.md` gives its form.
- A history, an audit trail or a log shows the exact time of each line, to the second, in one form in every language: `YYYY-MM-DD HH:mm:ss`, the order of ISO 8601, such as 2026-10-18 14:20:05, except a log by day, which splits it (see below). The time is in the time zone that the product names for these lines. Visible text names that time zone once, such as the column header "When (Europe/Belgrade)" or a caption. The tooltip of the time repeats it with the full date and time of the locale, with `dateStyle: 'full'` and `timeStyle: 'full'`, such as "Sunday, 18 October 2026 at 14:20:05 Central European Summer Time" in `en-GB`. A tooltip is never the only copy of information, and a phone shows no tooltip (see `### tooltip` in `DESIGN.md`). The form is the same on every line, and each part has a fixed number of digits, so the text of the lines sorts in the order of their times. The one exception is the hour that repeats when the clock of the time zone goes back, such as 02:00:00 to 02:59:59 on 2026-10-25 in `Europe/Belgrade`. There the text of a later line can sort before the text of an earlier line. So a product sorts the lines by the stored instant, never by the text. The tooltip also tells the two hours apart by the name of the time zone. A product that names UTC has no such hour.
- The exact time takes its parts from `new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(time)`, and the product joins them in the order of the form, with `-`, a space and `:`. The fixed locale keeps the Gregorian calendar and the Latin digits. With the locale of the person, `th-TH` writes the year 2569 and `ar-EG` writes Arabic digits. `hourCycle: 'h23'` writes midnight as 00. Do not take the whole form from a locale whose pattern matches it today, such as `sv-SE`. The pattern of a locale is CLDR data, and a release of CLDR can change it, but the parts do not depend on a pattern.
- The column of the exact time takes tabular figures on the whole time, the hyphens included, as `## Typography` in `DESIGN.md` asks for a date and a time. Inter then gives each hyphen the width of a figure. The hyphens stand in the same places on every line, so every time in the column has the same width: 145.36 px at the `body` step, against 108.11 to 130.83 px with proportional figures (measured). A time is not an identifier, so the rule that puts tabular figures on the number part of an identifier only does not apply.
- A log by day (the `day-log` definition) splits the exact time between two places. The head of each day holds the date part, `YYYY-MM-DD`, and each entry holds the time part, `HH:mm:ss`, from the same parts. Together they give the exact time, and the `datetime` attribute of each time holds the whole instant. An end on a later day shows its date part too. The product groups the entries by the date part, in the time zone that the caption names.
- Each product names the time zone that counts a calendar day, such as "today" and the day of a due date.
- A time of day, such as the time of a schedule, goes through `Intl.DateTimeFormat` with `hour: '2-digit', minute: '2-digit'`, which follows the hour cycle of the locale and writes the time as the time field shows it, such as 03:30 PM in `en-US`. With `hour: 'numeric'`, `en-US` writes 3:30 PM. The look of a time field is the `time-field` definition, and the look of a time zone field is the `time-zone-field` definition.
- A product that renders a document, such as an invoice, decides the locale of that document. The interface keeps the locale of the person.
- A number field reads the group separator and the decimal separator of the locale from `Intl.NumberFormat(locale).formatToParts()`. It accepts a value with or without the group separators and with fewer decimals, and it shows the full format on blur. The look of a money field is the `input-group` definition.

### Sorting and search

- A list that is sorted by a name uses `Intl.Collator` with the locale. In German, ä, ö and ü then sort with a, o and u, and not after z: Apfel, Äpfel, Ofen, Öl, Übel, Ufer, Zebra. Straße sorts directly after Strasse (measured). A value in another script sorts with the same collator, so that one list has one order. The collator puts each script in a group after the Latin letters: in `en-GB`, Greek, Cyrillic, Hebrew, Arabic, Devanagari, Thai, Hangul, kana and Han follow in this order (measured).
- A search ignores case and diacritics, so that "muller" finds "Müller" and "strasse" finds "Straße". Fold both texts before the comparison: normalize them to NFD, remove the combining marks of U+0300 to U+036F and the marks of Arabic and Hebrew, and change them to lower case. Then replace four letters that NFD does not split. Replace ß with ss, ł with l, ø with o, and U+0111, the d with a stroke, with d. NFD splits ü into u and a mark, but it does not split ß or a letter with a stroke, so the replacement is necessary. The change to lower case comes first, so the replacement also covers ẞ, Ł, Ø and U+0110 (measured).
- The marks of U+0300 to U+036F are the accents of the Latin, the Greek and the Cyrillic letters. The marks of Arabic and Hebrew include their vowel signs, so that "كتب" finds "كَتَبَ" (measured). A mark of another script makes another word, so the fold keeps it: with every mark removed, "कल" (tomorrow) finds "कुल" (total), and "ขาว" (white) finds "ข้าว" (rice) (measured). The removal is `s.normalize('NFD').replace(/[\u0300-\u036f]|(?=[\p{scx=Arabic}\p{scx=Hebrew}])\p{M}/gu, '')`. The Arabic vowel signs belong to the script Inherited, so the expression reads the script extensions (`scx`). The fold also removes the hamza and the madda that NFD splits from a letter, so "احمد" finds "أحمد".
- A search finds the query anywhere in a text, also inside a word, because Chinese, Japanese and Thai put no space between words.

### Words

- Use short verbs and nouns. No celebration, no marketing tone, and no marketing copy inside the app.
- A label is an action. It starts with a verb and names the result, such as "Send 3 documents", and never says "OK" alone. A label keeps its name through the flow: the button that opens a confirmation and the button that confirms have the same verb.
- The result of an action confirms inline, where the action was.
- An error says what went wrong and how to fix it, with no apology.
- A middle dot with a space on each side ( · ) separates the facts on one line.
- A proposal from the system has a reason line, which names the rule that made the proposal.
- A line of activity names the actor and the object. When the system acted, the line also names the reason. When an agent acts for a person, the line names the agent and the person. A row of the audit page names the agent and the person in the same way ("The audit trail" in `operations/monitoring.md`).
- Each product keeps a glossary with one word for each meaning, in each locale, and checks its copy against the glossary. The words of one product stay in that product.
- Sample data is invented: no lorem ipsum, no real client and no real person.

## Keyboard model

The app is keyboard first. The command palette reaches every action, and a frequent action has one key or a two-key sequence. In this file, Cmd means ⌘ on macOS and Ctrl on Windows and Linux.

### One registry

- Each product has one registry of keys. An entry holds the id of the action, the key, the label as a message key, the scope and the action. Each key is defined once.
- The key of an entry is its default. A person may change the key of an action, or turn the key off, in the preferences of the person, and the product keeps the choice with the person.
- A change that takes a key that a component owns, or the key of another entry in the same scope, is refused with the name of the action that holds the key.
- The palette, the tooltips, the menus and the key sheet read the keys from the registry. No product code binds a key outside the registry.
- The palette, the tooltips, the menus and the key sheet show the key of the person. An action whose key is off shows no key, and the palette still reaches it.
- Each key shows beside its action in the palette, in a tooltip and in a menu, with the `kbd` component. The look of a key is the `kbd` definition.
- A test of the product fails when two entries have the same key in the same scope, or when an entry takes a key that a component owns (see [Keys that the components own](#keys-that-the-components-own)). The test reads `architecture/keys.json` of the pinned release together with the registry of the product. A key collides with a key of a component only where their scopes overlap, and the test reads Cmd as Ctrl off macOS, so Cmd+K and Ctrl+K are one key.
- `architecture/keys.json` holds the two tables of this part as data, one entry for each key, with the key, the action, the scope and the owner. The owner of a shared key is `shared`. The owner of a key of a component is the text before the colon in the table of [Keys that the components own](#keys-that-the-components-own), such as `sidebar`. A cell with two keys gives two entries, such as J and Down, and "The arrow keys" gives Up, Down, Left and Right. A check in this repository fails when the file and the tables disagree.
- A person can turn off each key that uses only characters, such as `/`, `?`, X, Shift+X and the sequence G, then a letter. Shift prints no character of its own, but the criterion counts an upper-case letter as a character, so Shift+X is a key of characters only. This meets WCAG 2.2 success criterion 2.1.4, Character Key Shortcuts (level A). The criterion covers a shortcut of letters, punctuation, numbers or symbols only, and a sequence of them too. It asks for a way to turn the shortcut off, or for a way to change it so that it includes a key that prints no character, such as Ctrl or Alt. A shortcut that fires only while its control has focus needs neither.
- The registry is code of the product. This file names no key library.

### Shared keys

Each product binds these keys to these actions. A product adds the keys of its own actions, such as "create an item" or "switch the workspace". It never gives a key of this table to a different action.

| Key | Action | Scope |
|---|---|---|
| Cmd+K | Open the command palette | Everywhere, a text field too |
| `/` | Search in the current list | Lists |
| `?` | Open the key sheet, which lists each key of the registry by scope | Everywhere |
| G, then a letter | Go to a page. The product picks the letters. | Everywhere |
| Esc | Close the open layer or the pane. A second Esc clears the selection. In the work form of the split, Esc closes the open layer, then clears the selection, then closes the item column. | Everywhere, except inside a `code-editor` that a person can edit, and on the handle of a lifted row of a `reorder-list` or of a lifted card of a `board` |
| J or K | Go to the next or the previous row. An open pane follows. | Lists |
| Down or Up | Go to the next or the previous row. An open pane follows. | Lists, except on the handle of a lifted row of a `reorder-list` or of a lifted card of a `board`, and on a day of a `month-view` |
| X | Select or clear the row that has focus | Lists |
| Shift+X | Select the range from the last selected row to the row that has focus | Lists |
| Shift+Down, Shift+Up | Extend or shrink the selection by one row | Lists |
| Cmd+A | Select all rows of the list | Lists |
| F | Open the filter menu | Lists |
| Enter | Open the item that has focus on its full page | Lists, except on a day of a `month-view` |
| Cmd+S | Save the draft | Forms |
| Cmd+Enter | Run the main action of the form | Forms |
| Cmd+Z | Undo the last action while its Undo toast shows | Everywhere |
| `[` | Collapse or expand the sidebar | Everywhere |

### Rules

- A single key, with or without Shift, never fires while focus is in a text field, a text area, a select, an editable region or the palette.
- A key with Cmd fires in a text field only when its entry allows it. Cmd+K, Cmd+S and Cmd+Enter fire there. Cmd+A and Cmd+Z do not, because the text field owns them.
- A two-key sequence waits 1 s for the second key. While it waits, a chip of 20 px (`spacing.chip`) at the bottom left of the window shows the first key.
- Each kind of input has one send key, and it is the same in every product. A one-line field submits with Enter. A text area, such as a comment or a chat message, adds a line with Enter and sends with Cmd+Enter.

### Selection

- Focus and selection are separate. Focus is on one row, and it shows as the ring. The selection holds zero or more rows, and it shows as the `selected` ground and a checked check box.
- The selection stays when the pane opens and when it closes.
- The selection stays while the list scrolls and while it sorts. A change of the filter or of the view clears it, because a selected row can leave the list.
- While one or more rows are selected, the selection bar shows their count and their actions in the place of the top bar. The look is the `selection-bar` definition in `DESIGN.md`.

### Actions with a lasting effect

- An action with a legal, financial or permanent effect is never a single key. Examples are to issue a document, to send it, to book a payment and to delete an item for good. The action uses Cmd+Enter, or it opens a confirmation with a summary: the object, and the facts that the action fixes, such as the number, the date, the amount and the recipient. The look of the confirmation is the `alert-dialog` definition.
- An action that a person starts from a link in an email, with no session, shows the same summary on a page outside the shell. Only the POST of its button runs the action (see [Pages with no session](#pages-with-no-session)).
- A product adds its own conditions, such as a second confirmation when a limit is crossed.

### Keys that the components own

The vendored components bind some keys themselves. No product action takes these keys.

| Key | Component and use | Where it fires |
|---|---|---|
| Cmd+B | `sidebar`: collapse or expand the sidebar | The whole window, a text field too |
| Ctrl+N or Ctrl+J, Ctrl+P or Ctrl+K | `command`: move the highlight down or up | Inside the palette, while `vimBindings` is on |
| Space, Enter | A button, a check box, a switch, a toggle, a menu item or a select item: run or change it | The control that has focus |
| The arrow keys | A menu, a select, a tab list, a radio group or a slider: move inside it | The control that has focus |
| A letter | An open menu or select: go to the first item that starts with the letter | The open list |
| Esc | An open menu, popover, select or dialog: close it, except from inside a `code-editor` that a person can edit, or from the handle of a lifted row or card | The open layer |
| Tab, Shift+Tab | The browser: move focus to the next or the previous control | Everywhere |
| Tab, Shift+Tab | `code-editor`: indent or outdent the line | Inside the editor |
| Esc | `code-editor`: stop Esc, so that a layer around the editor stays open, and let a Tab or a Shift+Tab within 2 s leave the editor | Inside the editor, when a person can edit it |
| Up, Down, Home or End | `reorder-list`: move the lifted row one place, or to the first or the last place | The handle of a lifted row |
| Esc | `reorder-list`: put the lifted row back in its place, so that the pane and the selection stay | The handle of a lifted row |
| N, Shift+N | `diff`: move the focus to the next or the previous change, and wrap at each end | Inside a diff |
| The arrow keys | `board`: move the lifted card one place in its column, or to the column before or after | The handle of a lifted card |
| Home, End | `board`: move the lifted card to the first or the last place of its column | The handle of a lifted card |
| Esc | `board`: put the lifted card back in its place, so that the pane and the selection stay | The handle of a lifted card |
| The arrow keys | `month-view`: move the focus by a day or a week, and past the edge of the month to the month before or after | A day of a `month-view` |
| Home, End | `month-view`: move the focus to the first or the last day of the week, inside the month | A day of a `month-view` |
| Page Up, Page Down | `month-view`: show the month before or after, on the same day | A day of a `month-view` |
| Enter, Space | `month-view`: open the day in a popover with all its records | A day of a `month-view` |
| Enter, Space | `table`: fold or unfold the rows under a parent row of a tree | The fold button of a parent row of a `table` |

`[` and Cmd+B both collapse the sidebar: `[` is the shared key, and Cmd+B is the key of the component.

## Command palette

- Cmd+K opens the palette from every screen of the shell, a text field too. The palette reaches every action of the registry, every page and every setting. A product adds its own objects, such as its documents or its tickets.
- The registry owns every action. The palette shows the entries of the registry and holds no action of its own. A new action goes into the registry and the palette in the same change, and a frequent action also gets a key.
- The results come in groups. When rows are selected, the actions for the selection come first. The first result is active when the palette opens. Each result shows its key.
- The search ignores case and diacritics, with the fold of [Sorting and search](#sorting-and-search). The default filter of the `command` component does not ignore diacritics. So the palette gives the `filter` prop a function that folds both texts and then calls `computeCommandScore` from `bits-ui`.
- Set `vimBindings` to false on the palette. While it is on, Ctrl+K inside the palette moves the highlight up, and Ctrl+K is the palette key on Windows and Linux.
- The palette is the `command-dialog` part of the `command` component. Its title and its description come from message keys. Its look is the `command` definition.
- A settings page also has a search, and it reaches every setting.

## Screen states

### Empty, loading and error

Every list and every pane has three states: empty, loading and error.

- **Empty.** One sentence and one action. The look is the `empty` definition.
- **Loading.** Skeleton rows at the height of the real rows, as the `skeleton` definition draws them. A list never shows a spinner (`DESIGN.md`, `## Do's and Don'ts`). A list that has cached data shows the cache, and never skeletons. When the refresh takes more than 2 s, the syncing banner shows. A local cache is the choice of each product.
- **Error.** The error shows inline, where the content would be. It says what failed and how to fix it, and it has a retry button.

### A failed write

A product can show the result of a write before the server confirms it. When the write fails, the input of the person stays, and nothing rolls back silently.

- A field keeps its value, shows the edge of an invalid field (the `input` definition), and shows a message that names the retry.
- A row keeps the state that the person chose. A line of 24 px under the row shows an icon, what failed, a retry button and a discard button.

### Connection banners

A product with a local cache shows the state of its connection in four banners. Their texts come from message keys. One banner shows at a time, and the strongest one wins. The table lists the four from the strongest down, and a banner of the product itself, such as a limit that comes close, ranks after Offline and before Syncing. Sync failed takes the `destructive` tint and the `alert` role, because the input of the person waits on this device. Offline, Syncing and Back online are neutral banners with the `status` role. The look of each kind is the `alert` definition in `DESIGN.md`.

| Banner | It shows when | It goes when |
|---|---|---|
| Sync failed | A write does not reach the server. The text says that the input is kept on this device. | The person retries or discards the change. |
| Offline | The connection stops. The text gives the time of the data on the screen, and says that the changes wait. | The connection comes back. |
| Syncing | A write runs for more than 2 s. | The write ends. |
| Back online | The connection comes back. | It fades after 4 s. |

An app with no local cache keeps no change on the device, and it shows the same banners with three changes. Its Offline banner gives the time of the data on the screen, and says that a change does not save until the connection comes back. While Offline shows, each action that writes is disabled. Sync failed does not show, because no input waits on the device: a write that fails shows where it was, as [A failed write](#a-failed-write) says.

### State in the URL

Filters live in the URL, so that a reload, a link and the back button keep them.

## Accessibility

Every screen meets WCAG 2.2 at level AA.

### Structure and order

- The shell has four landmarks: `nav` for the sidebar, `header` for the top bar, `main` for the list and `aside` for the pane.
- A skip link is the first element that takes focus. It moves focus to `main`.
- The tab order follows the reading order: the skip link, the sidebar, the top bar, the list and the pane.
- A side column of a page is an `aside` with a name, after the main column in the code. So the tab order reaches it after the main column (`### Side column` in `DESIGN.md`).
- A page outside the shell has two landmarks, `header` for the head line and `main` for the column, and no skip link, because the head line holds no control (`### Page outside the shell` in `DESIGN.md`).

### Focus

- The keyboard alone reaches and runs every control and every action. Focus shows on every control.
- The look of the focus ring is in `DESIGN.md`, `## Shapes`. Never remove the ring without a replacement that has the same contrast, 3:1 or more.
- A sticky part, such as the top bar, a group header, the foot of a form or a toast, never hides the element that has focus (WCAG 2.4.11).

### Names and announcements

- A status icon always has an accessible name.
- New lines in an activity log are announced through `aria-live="polite"`.
- The roles of a banner and of a toast are in the `alert` and the `sonner` definitions. The tooltip and the name of an icon button are in the `button` definition.

### Other criteria of WCAG 2.2

- Each drag, such as a move on a board or a change of order, also works with a single click or tap and no drag, such as through a menu item (WCAG 2.5.7). It also works with the keyboard. The `reorder-list` definition in `DESIGN.md` gives the handle, the keys and the menu items of a change of order, and the `board` definition gives them for a move on a board.
- A form does not ask again for a value that the person gave earlier in the same flow. It fills the value in, or it offers it (WCAG 3.3.7).
- A sign-in form allows paste and a password manager, so that a person does not have to remember or copy a password by hand (WCAG 3.3.8).

### Rules that DESIGN.md holds

- The contrast of text, edges and the focus ring: `## Colors`.
- Color is never the only carrier of a state: `## Do's and Don'ts`.
- Reduced motion: `## Elevation & Depth`.
- The size of a target, 24 px on a desktop and 44 px on a phone (WCAG 2.5.8): `## Layout`.
- A visible label on every field: the `field` definition.
- The first mode from the color scheme of the system, and the place where a product stores a later choice: `## Themes`.

### The check

Before a screen ships, a person uses it with the keyboard alone.

## Text that people and agents write

A product renders Markdown that a person or an agent wrote, such as a comment, a description, a summary or a document. The text can come from anyone, so the renderer reads it as data and never as code.

- Raw HTML in the text, such as a `<script>` tag, shows as text. Nothing in the text runs.
- A link keeps only an `http` or `https` address, a `mailto:` address, or a path on the same site. Any other address, such as `javascript:`, shows as plain text, because a browser runs the code of a `javascript:` address when a person follows the link.
- A path on the same site is an address that resolves to the origin of the site. So `//host/page` is not a path on the same site: it resolves to the origin of `host`. The renderer decides with a URL parser, such as `new URL(address, origin)`, and never with a match on the text, because the parser reads `JaVaScRiPt:` as `javascript:` too.
- A link that leaves the site has `rel="noopener noreferrer"`. `noopener` keeps the page of the link from reaching the app through `window.opener`, and `noreferrer` keeps the address of the app out of the `Referer` header.
- An image loads only from the hosts that the product names, such as in the `img-src` directive of its Content-Security-Policy. An image that a person or an agent uploaded comes from the host of "Content that the product did not write", never from the origin of the app. The host of an image receives the address of each reader on each load, as a font service does (`## Typography` in `DESIGN.md`).

The look is in `## Typography` of `DESIGN.md`. The prose takes the `reading` step and a width of at most `spacing.reading-width`. A code block takes the `code` step. A link takes the `link` role and its underline.

## Content that the product did not write

HTML or SVG that the product did not write, such as a mockup, a report or a picture from an agent, never runs in the origin of the app. An SVG from an agent comes from the host of the content also when it shows in `<img>`, because a browser runs the scripts of an SVG that a person opens at its own address. HTML shows in an `iframe`:

- The `iframe` has the `sandbox` attribute with only the rights that the content needs, such as `allow-scripts` for a mockup that a person clicks. It never has `allow-same-origin`. Without that right, the browser gives the content a special origin that fails every same-origin check, so the content cannot read the cookies, the storage or the page of the app.
- A host that holds no cookie of the app serves the content. A person can open the address of the frame in a tab of its own, where no sandbox applies, so the host is the second guard. A subdomain of the app is the same site as the app, so a page on it sends `SameSite` cookies with its requests to the app, and it can set a cookie for the parent domain. So a host on a registrable domain of its own serves the content. A subdomain serves it only when every cookie of the app has the `__Host-` prefix and the app checks the `Origin` header of each write.
- The host sends a Content-Security-Policy that allows the files of the content and the STACK files only, and a Permissions-Policy that allows no device, such as `camera=()` and `microphone=()`. "Content that no build sees" in `## Overview` of `DESIGN.md` says how the content gets the STACK files and the mode.
- The app draws a mark of the source around the frame: a dashed edge in `input` (`border-dashed`) and a badge that names the source, as `## Do's and Don'ts` of `DESIGN.md` marks content that no person has confirmed yet. The app draws the mark outside the frame, because the content can draw anything inside it.

## Pages with no session

A person opens some pages with no session. Three of them serve the sign-in: the sign-in page, the recovery page and the page of a setup link. The others are a page from a signed link in an email and a read-only link. Such a page has no shell. Its look and its states are in `### Page outside the shell` in `DESIGN.md`.

### Signed links

- A signed link lets one person run one action on one object with no sign-in, such as to approve a quote, to end a subscription or to erase the data of the person. A read-only link shows content and runs no action.
- The link holds a token that nobody can guess. The token is at least 128 bits from `crypto.getRandomValues`, in base64url. The server stores only its SHA-256 hash and finds the record by the hash. The server keeps one record for each token: the action, the object, the version of the object in the email, the locale of the email, the expiry, the time of the use and the address that got the email. With this record, the page tells Expired, Already used and Changed apart. A token with no record shows Not valid.
- A GET of the link shows the page and does nothing else. It never spends the token, never runs the action and never sends a message. A mail filter, a link preview or a prefetch of the browser can open a link before the person does, and that GET must change nothing.
- The button of the page posts a form, and only that POST spends the token. The POST spends the token with a write that can succeed only once: an insert keyed by the token hash, or an update `WHERE used_at IS NULL AND expires_at > now` whose changed-row count the code checks. That write goes in the same transaction or D1 batch as the action, so the batch of a second POST fails as a whole. So a second POST finds the token spent and shows Already used, and a POST that fails leaves the token unspent and runs nothing.
- When the object changed after the email, the POST runs nothing and shows Changed. This also holds for a change between the GET and the POST.
- The POST answers with a redirect to the address of the page (303 See Other), with a mark of the result, such as `?done`. The page shows Done only while the token is spent, so the mark changes the words and never the data. A reload of Done posts nothing.
- The POST is a write, so the app checks its `Origin` header. Outside its dev server, SvelteKit 3.0.1 refuses a form post from another origin with status 403, unless `csrf.trustedOrigins` holds `'*'` (read in its source).
- A POST that a mail provider sends, such as the one-click unsubscribe of RFC 8058, comes from another origin, so the check above refuses it before `hooks.handle`. The app answers it in the Worker before SvelteKit, or on a route that the check does not cover (see `### Email layout` in `DESIGN.md`).
- A failed form POST answers with the page in Failed, as HTML, with the request id of the envelope of "Errors and request ids" in `operations/monitoring.md`. A POST from the script, with `Accept: application/json`, gets the envelope. The state line of Failed shows the request id.
- "Send a new link" is a POST that sends only to the address that got the email, at most once in a period that the product names.
- The page loads no third-party script and sends `Referrer-Policy: no-referrer`, so that the token does not leave in a request or a `Referer` header.
- The page takes the locale of the email from the record of the token, so that the email and the page use one language.
- A signed link never signs the person in, and the page sets no session cookie.
- The form works with no script: the browser posts it and follows the redirect. A script adds the Working state, and shows the next state with no full load.

### Sign-in

- An email never signs a person in. It never carries a code of any kind: no sign-in code, no recovery code and no code for a new device.
- The reason: some products show the mail of the person only inside the app. There, a code by email sits behind the sign-in that the person cannot pass. Every other reader of the mailbox, such as a delegate or a member of a shared mailbox, can also use a code in it.
- NIST SP 800-63B-4 forbids email as an out-of-band authenticator (3.1.3.1), and it forbids email for the code that binds a new device (4.1.2.2).
- A passkey sign-in calls `navigator.credentials.get()` from a script, so it needs JavaScript. The code from another device is a plain form that posts, so it works with no script.
- The browser ends the passkey sheet with one error, `NotAllowedError`, when the person cancels, when the time runs out, and for other causes (WebAuthn Level 3, read 2026-10-25). The page cannot tell them apart. So it shows Cancelled for that error, and never a failure. Failed is the answer of the server when it refuses the passkey. Any other error shows Failed with the name of the error.
- A device that is signed in shows the code for a new device. The code has 8 characters from the 32 symbols of Crockford base32, so it carries 40 bits. Each symbol takes 5 bits from `crypto.getRandomValues`, so no symbol is more likely than another. The alphabet leaves out I, L, O and U. The device shows the code in two groups of four, such as `7K4Q X2MD`.
- The server reads a typed code as Crockford base32 does: a lower-case letter as its capital, O as 0, and I and L as 1. It ignores a space or a hyphen between the two groups. So a person who types O for 0 still gets in.
- The new device asks for the email address of the account together with the code. NIST SP 800-63B-4 4.1.2.2 asks for at least 40 bits when the person also enters an identifier. Otherwise it asks for at least 112 bits (read 2026-10-26).
- The code works once, for at most 10 minutes, as 4.1.2.2 asks. The server ties each code to one pending sign-in that the new device starts and holds in a cookie. It counts wrong tries for each pending sign-in, for each client address, and in total. It ends the pending sign-in after five wrong tries, and the page then shows Code expired. It also counts the wrong tries for each typed address, whether or not an account has that address. At the limit it waits longer before each answer (NIST SP 800-63B-4 3.2.2). An address with no account gets the same wait and error. The server does the same work for it.
- The server answers a wrong code and an expired code with two different errors, so that the page shows the fix of each. It answers a wrong address and a wrong code with the same error, so that the page does not tell which addresses have an account.
- After a sign-in, the server sets the session. It then opens the address that the person asked for before the sign-in, but only when `new URL(address, origin).origin` equals the origin of the app. The server then redirects to its `pathname + search + hash`. A subdomain is refused, and so is any other address, and the start page opens instead.
- After a right code, the new device asks the person to make a passkey on it, in the session that the code set. The device opens the address of the rule above after that step. The next sign-in on that device needs no code.
- So the code binds a new authenticator, the case of NIST SP 800-63B-4 4.1.2.2: "adding authenticators that are embedded in a new endpoint". STACK takes the numbers of the code from that section.
- On a computer that the person borrowed, the person chooses "Not now". The person then gets this session only, and the next sign-in on that computer needs a code again.
- The new passkey sends the notice of a new passkey to every address and every device of the person. NIST SP 800-63B-4 4.1.2.1 and 4.6 ask for it (see [Security mail](#security-mail)). So a new device that makes a passkey sends two notices, one at the code and one at the passkey. The notice of the passkey names the device of the first notice.
- A product may also offer a code from an authenticator app. [Authenticator app](#authenticator-app) gives its rules and its limit.

### Authenticator app

A product may offer an authenticator app as a second way to sign in. The person then signs in with a passkey or with the 6 digits that the authenticator app shows. A code from an authenticator app is not phishing-resistant. A false page that looks like the product can ask for the 6 digits and use them at once. STACK recommends passkeys only. A product that offers an authenticator app accepts the limit at the end of this section.

The code:

- The authenticator app computes a TOTP code of RFC 6238: HMAC-SHA-1, 6 digits and a step of 30 seconds. RFC 6238 5.2 recommends the step of 30 seconds.
- These three values are the defaults of the `otpauth://` key URI format, which the maker of a common authenticator app publishes. Its page says that the app of its maker ignores the `algorithm` and `period` parameters, and on some platforms `digits` (read 2026-10-27). So only the defaults work in every authenticator app.
- NIST SP 800-63B-4 3.1.4.1 lets a code have as few as six decimal digits. It asks a nonce from a clock to change at least once every two minutes.
- NIST SP 800-131A Rev. 2 accepts SHA-1 outside digital signatures, and HMAC with a key of at least 112 bits (Tables 8 and 9). The draft of Rev. 3 of October 2024 deprecates HMAC with SHA-1 through 2030 and disallows it after 2030 (section 13, read 2026-10-27). STACK reviews the choice when that revision is final.

The secret:

- The server makes a secret of 160 bits, 20 bytes from `crypto.getRandomValues`. RFC 4226 asks for at least 128 bits and recommends 160 bits (section 4, R6). NIST SP 800-63B-4 3.1.4.1 asks the secret and its algorithm for a security strength of at least 112 bits.
- The secret goes to the authenticator app in the base32 of RFC 4648 section 6, as 32 characters with no padding. Its alphabet is the letters A to Z and the digits 2 to 7. This is not the Crockford base32 of the other codes. The key URI format asks for the base32 of RFC 3548, which RFC 4648 replaced.
- The server computes each code, so it stores the secret itself and not a hash. It encrypts the secret with AES-GCM of the Web Crypto API (`crypto.subtle`), with a key of 256 bits from a Worker secret. The database never holds that key.
- Each secret gets a random IV of 96 bits. The id of the account is the additional data of AES-GCM, so a secret that moves to the row of another account does not decrypt. Each record names the version of the key, so that a product can change the key.
- NIST SP 800-63B-4 3.1.4.2 asks to protect the secret with access controls that limit it to the software that needs it. RFC 6238 5.1 recommends tamper-resistant hardware that encrypts the secrets, and a secret in the clear only when the server needs it. A Worker has no such hardware. So the server decrypts a secret only to compute a code, and it stores no secret in the clear.
- The secret never goes into a log, the address of a page, a title, a tooltip or an email.

The setup:

- The person adds an authenticator app on the security page of the account. Only a session that a passkey made can add, replace or remove an authenticator app. Such a session started with a sign-in with a passkey. The session of the setup of an account counts too, after the person made the first passkey in it. The account has no earlier passkey to ask for. A session that a code, an authenticator app or a recovery made does not count, also after the person made a passkey in it. In such a session, the setup first asks for a sign-in with a passkey, and the server then replaces the session. So a false page that took one code cannot add an authenticator app in the session of that code. The limit at the end of this section says what such a page can still do.
- The page shows the address `otpauth://totp/Product:ana%40example.org?secret=<secret>&issuer=Product` in a `qr-code` with `kind="text"`, never `kind="link"`. A `link` takes only an `https:` address, and its button would put the secret into an `href` (see `### qr-code` in `DESIGN.md`).
- The label of the address holds the name of the product and the email address of the account. So a person with two accounts tells them apart. The `issuer` parameter repeats the name of the product, as the key URI format recommends. The server encodes both names with `encodeURIComponent`. The name of the product in the label holds no colon, because the format reads a colon or %3A as the end of the issuer. The address has no `algorithm`, `digits` or `period`, because their defaults are the values above.
- When the address needs a QR code past version 7, the label holds only the name of the product. The QR code then fits the tile of `### qr-code`. With the name `Product`, an email address of up to 49 characters keeps the full label (measured with lean-qr 2.7.4 and 200 random secrets).
- Beside the QR code, the page shows the secret for a person who types it into the authenticator app. The page calls it the setup key. It shows in eight groups of four characters, and its copy button writes it with no space. RFC 4648 3.3 asks a decoder to refuse a character outside the alphabet, so an authenticator app may refuse a space. `### qr-code` in `DESIGN.md` gives the look.
- The setup keeps the new secret, encrypted, in a pending record of the session for at most 10 minutes. The authenticator app counts only after the person types one current code from it. So a scan that failed, or a setup key with a typing error, never becomes a way in that does not work. NIST SP 800-63B-4 4.1.2.2 recommends a sign-in with a new authenticator to confirm its binding. The server keeps the step of that first code as the last step that it accepted.
- A right first code adds the authenticator app. It sends the security notice "Your account has a new authenticator app" to every address and every device of the person (NIST SP 800-63B-4 4.1.2.1 and 4.6, see [Security mail](#security-mail)).
- An account holds at most one authenticator app, because the server keeps one last step for each account. A new authenticator app replaces the old one at its first right code. So a person with a new phone adds the authenticator app there. NIST SP 800-63B-4 3.1.4.1 recommends this: bind the authenticator app on the new device, and invalidate the old one.
- Removing the authenticator app sends the security notice "Your account has no authenticator app now" to every address and every device of the person. NIST SP 800-63B-4 4.5 recommends a notice when the service removes an authenticator from the account. On that notice, "This was not me" suspends the passkey of the session that removed it, as for a new passkey. The authenticator app stays removed.

The sign-in:

- The sign-in page offers "Use a code from an authenticator app". Its form asks for the email address of the account and the 6 digits, and it posts with no script. `### Page outside the shell` in `DESIGN.md` gives the look and the states.
- The server accepts the code of the current step and of one step on either side. So a code works from a phone clock that is up to 30 seconds wrong. A code that the person types late in its step works too. RFC 6238 5.2 recommends at most one step for the network delay, and section 6 a limit for the drift of the clock. NIST SP 800-63B-4 3.1.4.2 asks for a lifetime from the drift of the clock, the network delay and the time to type.
- Each code works once. The server keeps the last step that it accepted for each account, and it refuses a code of that step or of an earlier step. RFC 6238 5.2: "The verifier MUST NOT accept the second attempt of the OTP after the successful validation has been issued for the first OTP". NIST SP 800-63B-4 3.1.4.2 asks the same.
- The server saves the new step with a write that can succeed only once: an update `WHERE last_step < ?` whose changed-row count the server checks. So two posts of one code cannot both sign in.
- A code of a step that the server already accepted gets its own error, so that the person waits for the next code. It does not count as a wrong code. NIST SP 800-63B-4 3.1.4.2 lets the verifier warn the person that an attacker may have used the code first, so the error names that case.
- The server counts wrong codes as it counts wrong recovery codes (see [Ways back in](#ways-back-in)). It counts them for each typed address, whether or not an account has that address, and for each client address. After five wrong codes, the server takes the next code only after a wait, from 30 seconds up to one hour. NIST SP 800-63B-4 3.1.4.2 asks for the throttling of 3.2.2, because a code of 6 digits holds less than 64 bits.
- After 100 wrong codes in a row for one account, the server disables the authenticator app. The person adds it again after a sign-in with a passkey, because NIST SP 800-63B-4 3.2.2 asks to bind a disabled authenticator again. NIST chose the limit of 100 with "a six-digit decimal OTP authenticator output" as its example (3.2.2). A right code clears the count, as 3.2.2 recommends.
- A wrong address and a wrong code get the same error. An address with no account gets the same wait and the same errors, and the server does the same work for it. So the page does not tell which addresses have an account.
- A workspace may turn the authenticator app off for its people. A person in more than one workspace keeps the authenticator app only when each of them allows it. When a workspace turns it off, or the person joins a workspace that does not allow it, the server removes it. The person then gets a security notice that names the workspace. That notice has no link "This was not me", because an administrator made the change. The security page then offers no authenticator app, and it says why. A code of a removed authenticator app gets the error of a wrong code, so the page does not tell which addresses have an account.
- After a right code, the device asks the person to make a passkey on it, as after the code for a new device (see [Sign-in](#sign-in)). The step offers "Not now" too, as a link, because the sign-in already spent the code.
- A sign-in with an authenticator app in a browser that the server does not know sends the security notice of a new device. The notice names the authenticator app. The server knows a browser by a cookie that it sets at each sign-in. The cookie takes the `__Host-` prefix and holds 128 random bits, with `HttpOnly`, `Secure` and `SameSite=Lax`, and the server stores its hash with the account. A false page never gets that cookie, because a browser sends a cookie only to the host that set it. So each sign-in through a false page sends the notice, and a daily sign-in in a known browser sends none.

The limit:

- A code from an authenticator app is not phishing-resistant. A false page that looks like the product can ask for the email address and the 6 digits. It then sends both to the real sign-in page at once, and the code works there, because nothing in the code names the real page. NIST SP 800-63B-4 3.2.5: "Authenticators that involve the manual entry of an authenticator output (e.g., out-of-band and OTP authenticators) SHALL NOT be considered phishing-resistant because the manual entry does not bind the authenticator output to the specific session being authenticated." Section 3.1.4 says the same: "OTP authentication is not phishing-resistant."
- A passkey gives a false page nothing, because WebAuthn binds the passkey to the domain of the product (NIST SP 800-63B-4 3.2.5.2).
- A false page that took one code gets more than one session. After the sign-in, the step "Make a passkey on this device" offers it a passkey on its own device. With that passkey it signs in again later. After the link "This was not me" of the sign-in with the code expires, it can also replace or remove the authenticator app. A thief with the phone of the authenticator app can do the same. The label in the authenticator app shows the email address of the account. The person learns of it from the notice of the sign-in and the notice of the new passkey. "This was not me" on the notice of the sign-in suspends that passkey, after a sign-in with another passkey of the person.
- The link "This was not me" of a sign-in with an authenticator app works for a time, such as 7 days. For that time, the passkey that the device made after the sign-in has less power. It cannot add, replace or remove an authenticator app. On a report page, it does not count as a passkey of the person. NIST SP 800-63B-4 4.1.2.1 counts that passkey at AAL1 at most. So the server keeps that fact in the record of the passkey (NIST SP 800-63B-4 4.1).
- A sign-in with only the authenticator app reaches AAL1. NIST SP 800-63B-4 2.1.1 allows a single-factor OTP at AAL1. Section 2.2.1 allows it at AAL2 only together with a password or a biometric comparison, and the sign-in of STACK asks for no password.
- A passkey that a device makes after a sign-in with the authenticator app counts at AAL1 at most. NIST SP 800-63B-4 4.1.2.1 asks the binding of a new authenticator to follow a sign-in at the lower of two levels. They are the highest level of the account and the highest level at which the new authenticator will work.
- So a product that needs phishing resistance or AAL2 offers passkeys only. In a product that offers the authenticator app, a workspace that needs either one turns the authenticator app off.

### Ways back in

A product offers four ways back in to a person who cannot sign in, and a fifth when it offers an authenticator app. None runs through a mailbox.

- **A passkey that syncs.** The password manager of the platform keeps the passkey and brings it to each device of the person. The server reads the BE and BS flags of each passkey, Backup Eligibility and Backup State (WebAuthn Level 3 6.1.3, read 2026-10-26). So the server knows whether a passkey of the person can sync.
- **A second device.** When no passkey of the person can sync, the app asks at setup for a passkey on a second device. A device that still works shows the code for a new device, and the new device then makes its own passkey (see [Sign-in](#sign-in)).
- **A saved recovery code.** The app shows the code once at setup, and the person prints it or keeps it in a password manager. The code has 16 characters of Crockford base32, 80 bits from `crypto.getRandomValues`. The app shows it in four groups of four, such as `7K4Q-X2MD-R8F3-W6PN`. The server reads it as it reads the code for a new device. It stores only a salted hash of the code, with a salt of at least 32 bits and a password hashing scheme (NIST SP 800-63B-4 4.2.1.1 and 3.1.1.2). The address names the account, so the server finds the salt there. The recovery page asks for the email address of the account together with the code, so that a wrong code names one account. The server counts wrong codes for each account and for each client address. It counts an address with no account in the same way, and gives it the same wait and the same errors. The server does the same work for it. So the page does not tell which addresses have an account. After five wrong codes, the server takes the next code only after a wait. The wait grows with each wrong code, from 30 seconds up to one hour (NIST SP 800-63B-4 3.2.2, "e.g., 30 seconds up to an hour"). After 100 wrong codes in a row for one account, the server refuses the saved code, and the person uses another way back in. After the next sign-in, the app shows a new code. The limit of 100 is the rule of NIST SP 800-63B-4 3.2.2: "Unless otherwise specified in the description of a given authenticator, the verifier SHALL limit consecutive failed authentication attempts using a specific authenticator on a single subscriber account to no more than 100 by disabling that authenticator." The code gets the person back in together with a new passkey, or for this session only with "Not now". Then it works no more. The app then shows a new code. NIST SP 800-63B-4 4.2.1.1 asks for at least 64 bits from an approved generator, a salted hash, throttling, and a new code after each use.
- **An administrator.** An administrator of the same workspace confirms the person, in person or by phone. The app then makes a setup link or a setup code, as the administrator chooses. In person, the screen of the administrator shows the one-time setup link as a QR code (see `### qr-code` in `DESIGN.md`). The person scans it with a phone. The token of the link has at least 128 bits, as for a signed link. By phone, the administrator reads a setup code to the person. The code has 26 characters of Crockford base32, 130 bits from `crypto.getRandomValues`, in groups of four, such as `7K4Q X2MD R8F3 W6PN 3HJA 9BTC 5E`. The person types it on the recovery page, and the server reads it as it reads the code for a new device. The code needs no email address, because 130 bits are more than the 112 bits that 4.1.2.2 asks of a code with no identifier. The link and the code never go by email, by a text message or by a chat. The server stores only a hash of the token and of the code. Each works once, for at most 10 minutes, and leads to a page that creates a passkey. A GET of the link changes nothing, as for a signed link. Only the POST that saves the new passkey, or the POST of "Not now", spends the token or the code. That POST uses the write of [Signed links](#signed-links) that succeeds once. NIST SP 800-63B-4 4.2.1.2 lets a recovery code by text message or by voice work for at most 10 minutes. The same section asks the throttling of 3.2.2 for such a code. So the server counts wrong setup codes for each client address, and waits as for the saved code. NIST SP 800-63B-4 4.2.1 allows such a method of the service itself, based on a risk analysis that the service documents. A workspace with one administrator has no such way for that administrator.
- **An authenticator app.** A product may offer one (see [Authenticator app](#authenticator-app)). A person who lost the device of the passkey and keeps the authenticator app signs in with it on the sign-in page. The device then makes a new passkey, or the person chooses "Not now". The sign-in spends no recovery code, so no new recovery code shows after it. A lost phone with the authenticator app follows the other ways back in. After a sign-in with a passkey, the person removes the authenticator app, or adds one on a new phone, which replaces it.

More rules hold for every way:

- A product never offers a recovery address at another provider. A recovery code by email is a code that the first rule of [Sign-in](#sign-in) forbids.
- Every way but a passkey that syncs ends with a new passkey, unless the person chooses "Not now". With a second device, the new device makes it after the code (see [Sign-in](#sign-in)). With an authenticator app, the device makes it after the code of the authenticator app. The setup link is not a signed link of an email, and the setup code comes in no message. Each leads only to the page that creates a passkey, and only the new passkey or "Not now" signs the person in.
- After a recovery, the page that creates the passkey also offers "Not now", as the new device does after its code (see [Sign-in](#sign-in)). This holds after the saved recovery code, the setup link and the setup code. On a computer that the person borrowed, the person chooses "Not now". The person then gets this session only. The POST of "Not now" spends the code or the token, as the POST of the new passkey does. The app still shows a new recovery code in that session, as after every recovery. The notice of the recovery goes out, and it is also the notice of the new recovery code (NIST SP 800-63B-4 4.2.1.1). The reason: a recovery on a borrowed computer would leave a passkey in the password manager of that computer's owner.
- After a recovery, every address and every device of the person gets a notice (NIST SP 800-63B-4 4.2.3 and 4.6). See [Security mail](#security-mail).
- NIST accepts one saved recovery code alone only for an account at AAL1 (4.2.2.1). A product that needs AAL2 asks for a second proof of 4.2.2.2: a second recovery code by another method, or a passkey that still works. The setup link and the setup code are no such proof, so the product names them in the risk analysis of 4.2.1.

### Security mail

- The app sends a security notice when a new device signs in and when a recovery ends. It also sends one when the person adds or removes a passkey or an authenticator app. It also sends one when a workspace removes the authenticator app of the person. A sign-in with an authenticator app in a browser that the server does not know sends the notice of a new device (see [Authenticator app](#authenticator-app)). The app also sends a notice when it shows a new recovery code outside a recovery (NIST SP 800-63B-4 4.2.1.1). On that notice, "This was not me" suspends the new recovery code and ends the session that showed it. The notice goes to every address and every device of the person (NIST SP 800-63B-4 4.1.2.1, 4.2.3 and 4.6).
- Removing a passkey sends the security notice "A passkey was removed from your account" to every address and every device of the person. NIST SP 800-63B-4 4.5 recommends a notice when the service removes an authenticator from the account. On that notice, "This was not me" suspends the passkey of the session that removed it, as for a new passkey. The removed passkey stays removed.
- A notice holds no code and no link that signs in. So a product that shows the mail of the person inside the app shows its own security mail as it came, with its link. Such a mail gives no reader of the mailbox a way in.
- Each notice ends with the link "This was not me". When a workspace removes the authenticator app, the notice has no such link, because an administrator made the change. NIST SP 800-63B-4 4.6 asks each notice for clear steps and contact information in case the person did not cause the event. The look of the notice is in `### Content kinds` of `DESIGN.md`.
- The link is a signed link of [Signed links](#signed-links). Its object is the event that the notice names, and its action is the report of that event. The link works for a time that the product names, such as 7 days. A GET shows the page and changes nothing. The POST spends the token once, and it then does three things:
  1. It suspends the device that the notice names: the passkey that the device made, when it made one. After a recovery, it suspends the passkey that the recovery made, when the person did not choose "Not now", and the recovery code that the recovery showed. A suspended passkey or recovery code does not work until the suspension ends. The person lifts it after a sign-in with another passkey, or an administrator lifts it (NIST SP 800-63B-4 4.3). In place of a suspended recovery code, the app shows a new one after the next sign-in. After a sign-in with an authenticator app, it suspends the passkey that the device made, when it made one, and it disables the authenticator app. On the notice of a new authenticator app, it disables that authenticator app. A disabled authenticator app works again only after the person adds it again with a new secret, as after 100 wrong codes. The reason: the report can mean that somebody else holds the secret.
  2. It ends only the sessions of that device: the sessions that the named passkey or code made, and the session that caused the event. Each session record holds the passkey, the code or the authenticator app that made it. When the POST disables an authenticator app, it also ends every session that the authenticator app made. Each of them can come from the same secret.
  3. It tells every administrator of the workspace. It also sends a notice of the report to every address and every device of the person. That notice says what the app suspended or disabled and which sessions it ended, or that it suspended nothing. It has no link "This was not me".
- When that device holds the last passkey of the person that is not suspended, the POST suspends nothing and ends no session. It only sends the messages of step 3, and the administrators decide the next step. Three reports suspend only after a sign-in on the report page with a passkey of the person that the event did not make. They are the report after a recovery, the report after a sign-in with an authenticator app and the report of a new authenticator app. A person recovers when no other passkey works. A person may keep an authenticator app for the same case, and the server cannot see a lost passkey. So only such a sign-in proves that the person keeps a way in. Without it, the POST suspends nothing and only sends the messages of step 3.
- The POST changes nothing else. It suspends no other passkey, ends no other session, changes no address and locks no account.
- The reason: the link works with no sign-in, so every reader of the mailbox can open it. So the POST undoes only the one event, and it never suspends the last passkey of the person. A lock of the account would let any reader of the mailbox shut the person out. After a report of a new device or a new passkey, the person lifts the suspension with another passkey, or repeats the event.
- NIST SP 800-63B-4 4.3 lets a service verify a contact address, such as an email address. The service may then suspend or invalidate an authenticator that the person reports as compromised. NIST SP 800-63B-4 4.1.2.2 gives the example of a button that quickly invalidates a "misbound authenticator", and the link is such a button. For a report after a recovery or about an authenticator app, the page uses the other method of 4.3: "a method of authenticating using a backup or alternate authenticator".
- An event does not change after the notice, so the page never shows Changed. Done says what the app did: the device that it suspended and the sessions that it ended. It also says that the person lifts the suspension after a sign-in with another passkey, or asks an administrator. For an authenticator app, it says that the person adds the authenticator app again. When the device held the last passkey, Done says that the app suspended nothing and told the administrators. After a recovery or about an authenticator app, with no such sign-in, Done says the same.

## The app on a phone

### The viewport line

The `<head>` of every app holds this viewport line:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

The safe area of `### Width bands` in `DESIGN.md` reads `env(safe-area-inset-*)`. On iOS each inset stays 0 unless the viewport line sets `viewport-fit=cover` (from the WebKit source, not measured on a device). With `cover`, the page fills the whole screen, and each part that touches an edge keeps the inset of that edge.

### The home screen

- An app that a person adds to the home screen has a web app manifest with its name, its icons and `display: standalone`. With `standalone`, iOS opens the app from the home screen as an app, and not in a browser.
- The `<head>` also links an icon for the home screen of iOS with `<link rel="apple-touch-icon">`. iOS reads the icons of the manifest from iOS 15.4, and when both exist it takes the `apple-touch-icon`.

### The service worker

- A service worker caches the shell of the app only: the files of the build, such as the HTML, the scripts, the styles, the fonts and the icons. A local cache of the data is a separate choice of each product (see [Screen states](#screen-states)).
- When a new version of the service worker waits, the app shows one line with a Reload button: a neutral banner with the `status` role, which ranks as a banner of the product (see [Connection banners](#connection-banners)). Reload activates the waiting version, then reloads the page. The app never reloads by itself, because a reload can drop the input that the person has not saved.

### Push notices

- The app asks for the push permission only after a click or a tap on a control that says what the notices are for. It never asks when a page loads. On iOS the request works only when it answers an action of the person, such as a tap.
- A click on a notice opens its item. The service worker handles the `notificationclick` event, and it brings an open window of the app to the front or opens a new one, at the address of the item.
- From iOS and iPadOS 16.4, web push works in an app that a person added to the home screen, and only there. So where a person turns push on, the app says so on iOS when it runs in the browser.
