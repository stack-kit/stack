### Product

rndm, v2.2.0

### Kind

missing

### What the product found

The rich text field of rndm (see the proposal "missing: a rich text field that takes a paste from Word or a web page as clean structure") has a toolbar with the tools of a mail client: undo and redo, the text style, the font and its size, bold, italic, underline, link, the text colour and the highlight, alignment, lists, indent and an Insert menu. It also has a bar over selected text, a "/" menu at the start of a line, and markdown keys such as "#" and a space. Each preset turns on its own set of tools.

A reply can be long, and the earlier message is quoted under it. So the person scrolls the column while the caret is far below the top of the field. The toolbar must stay in reach while the text scrolls.

`DESIGN.md` has no part for these, so the product built them from STACK parts and met these gaps:

1. No toolbar of an editor. `### menubar` says that a toolbar of buttons and one `dropdown-menu` serve most views. It gives no rule for the groups, the separators, the order in which groups fold on a narrow bar, the More menu, one tab stop for the bar, or a bar that stays at the top of a column that scrolls.
2. No bar over selected text. `### selection-bar` serves the selected rows of a list only.
3. No list that the text of an editor searches. `### command` searches in its own `command-input`, which takes the focus. A "/" menu keeps the focus in the text and searches what the person types after the "/".
4. A key clash. The `sidebar` owns Cmd+B in "the whole window, a text field too", and every editor uses Cmd+B for bold. The palette owns Cmd+K everywhere, and mail clients use Cmd+K for a link. `matches()` of `behaviour/keys` refuses each Cmd key in a text field except Cmd+K, Cmd+S and Cmd+Enter, and a digit with Shift does not match ("&" for Shift+7).
5. `input-group` dims itself and all its content when a control in it is `:disabled`. The toolbar stands in the `block-start` row of an input group, and Undo is disabled at the start, so the whole editor showed at 50% opacity.
6. A radio item and a check box item of `dropdown-menu` stay open after a pick. A menu of editor tools closes after a pick, as a menu of actions does.
7. No place for the controls of the page in the bar, such as a check of the text, and no rule for how the groups fold to leave room for them.

### Evidence

STACK, tag v2.2.0:

- `DESIGN.md:3115`, `### menubar`; `DESIGN.md:3879`, `### selection-bar`; `DESIGN.md:3148`, `### command`.
- `architecture/keys.json:22`: Cmd+B, owner `sidebar`, "The whole window, a text field too". `architecture/web-app.md:95` and `:116`: Cmd+K, and the Cmd keys in a text field.
- `preview/src/lib/components/ui/input-group/input-group.svelte:18`: `has-disabled:opacity-50`.
- `preview/src/lib/components/ui/dropdown-menu/dropdown-menu-radio-item.svelte:10` and `dropdown-menu-checkbox-item.svelte:14`: `closeOnSelect = false`.

The admin of rndm, at commit 3b15415:

- `admin/src/lib/editor/Toolbar.svelte:1-24`: the rules that the toolbar takes until STACK has its own. `:99-138`: the fold into More. `:176-193`: the stuck state. `:348` and `:365`: `aria-disabled` on a tool. `:396` and `:406`: `closeOnSelect` on a menu item. `:507-518`: the bar, sticky at the top. `:665`: the controls of the page at the end.
- `admin/src/lib/editor/presets.ts:122`: the groups in their order, each with its fold order.
- `admin/src/lib/editor/SelectionBar.svelte:7-26`: the bar over selected text. `:277`: its layer.
- `admin/src/lib/editor/SlashMenu.svelte:10-20`: the "/" menu. `:176`: the `command` with no filter of its own.
- `admin/src/lib/editor/keys.ts:1-9`: the key matcher of the editor. `admin/src/lib/editor/markdown.ts:1-5`: the markdown keys.

No screenshot goes with this proposal.

### Proposed rule or change

This is a wish. STACK decides the form and the words.

**A part `### rich-text-toolbar`.** A `toolbar` slot with `role="toolbar"`, a name such as "Formatting", `aria-controls` on the text, and a `border` edge under it, in the `block-start` row of the `input-group` of the field. Groups of tools in a configured order, each a `role="group"` with a name, with a vertical `separator` between two groups. A tool is a `toggle`, an icon `button`, a `dropdown-menu` trigger or a size field. A trigger that shows the current choice, such as "Normal", has a fixed width, so the bar does not move. Each icon tool has a name and a `tooltip` with its key in `kbd`. Each menu item shows its key.

- Sticky: the bar sticks to the top of the column that scrolls (`sticky top-0`), on `background`, above the text. While it is stuck, its top corners are square, so no text that scrolls under it shows in a corner. The bar is stuck when its top stands lower than the top of its input group, which a scroll of any column can change, so the part listens to scroll in the capture phase and to resize.
- Config: the product names the groups, their tools, their fold order, and for each preset the tools that are on. A tool that is off does not show, and its key and its markdown key do nothing there.
- The end of the bar: the page can put its own controls at the right end, such as Check. They stay outside the arrow order, they stay on while the text is read-only, and the groups fold to leave room for them. A change of their width, such as Check that becomes Checking and Stop, folds the groups again.
- Sizes: 32 px controls, and 44 px below 768 px.
- States: a toggle is on at the selection. A tool with nothing to act on takes `aria-disabled="true"`, never `disabled`, so the input group does not dim and the tool stays in the arrow order. A menu of tools closes after a pick. While the text is read-only or loads, each tool is unavailable.
- Narrow bar: whole groups move into More, the lowest fold first. A group can let some tools leave before the rest of it, such as Inline code before Bold. Below 768 px More, and each menu of the bar, is a `drawer` with a Close button.
- Keys: one tab stop for the bar. The arrow keys, Home and End move in it. Alt+F10 goes from the text to the bar, and Esc goes back. A press on the bar keeps the focus and the selection in the text, except on a menu trigger and the size field.

**A bar over selected text.** A floating layer at level 3 (`popover` ground, `ring-1 ring-foreground/10`, `shadow-md`) above the selection, or under it where there is no room, with the tools of the preset and the same keys. It shows while the text has the focus and a selection that is not a caret. It hides on Esc until the selection changes, during a drag, while an object is selected, and below 768 px. It stays out of the Tab order, and a press on it keeps the selection. Link and the colours open their form at the selection.

**A "/" menu.** A "/" at the start of a line opens a `command` list in a `popover` at the "/", with no input of its own. The focus stays in the text, which names the list with `aria-controls` and the active item with `aria-activedescendant`, as a combobox does. The words after the "/" filter the list, by the label and by other words, such as "text" for Normal. The arrow keys move, Enter picks, and Esc closes the menu and keeps the text. A pick takes the "/" and the search out and runs the tool in one undo step.

**Markdown keys.** A line that holds only "#", "##", "###", "-", "*", "+", "1." or ">" becomes a block when the person types a space after it. "---" becomes a divider. A text between "**", "*", backticks or "~" becomes bold, italic, inline code or struck through when the person types the last marker. One undo step gives back what the person typed.

**Keys.** A row in "Keys that the components own": `rich-text-toolbar`, inside the editor, with the format keys such as Cmd+B, Cmd+I and Cmd+U. A key that the editor uses stops at the editor, so the sidebar does not take Cmd+B there. STACK decides whether Cmd+K makes a link in the editor. In `behaviour/keys`, a matcher for the editor that allows its Cmd keys and matches a digit and a punctuation key by `event.code`. On Windows and Linux, Ctrl+Alt with AltGraph down is AltGr and matches no key, because many layouts type characters with it.

### What the product does until a release ships it

`Toolbar.svelte` and its size field build the toolbar from `toggle`, `button`, `button-group`, `input`, `dropdown-menu`, `drawer`, `popover`, `tooltip`, `kbd`, `separator`, `ReasonButton` and `ReasonMenuItem`, with `aria-disabled` on its tools and `closeOnSelect` on its menu items. `SelectionBar.svelte` is a level 3 layer with the same tools. `SlashMenu.svelte` puts `Command.Root` in a `Popover.Content` at the "/", with `shouldFilter` false, and runs the search itself. `keys.ts` matches the keys of the editor. Each stopgap comment names the number of this pull request.
