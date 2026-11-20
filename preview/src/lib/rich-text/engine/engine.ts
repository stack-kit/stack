// The engine of the rich text field: Squire 2.4.10 behind the Engine interface of types.ts.
// RichTextField.svelte loads this module with a dynamic import, so Squire stays out of the bundle of each
// page. Decision record 0013 explains the choice of Squire.
//
// - Each HTML that enters goes through the one hook sanitizeToDOMFragment: the load list while load() or
//   replaceAll() runs and while a drag inside the text moves a part of it, and for the fragment of a paste
//   that is the last copy of this text; else the paste list (stack/rich-text.ts).
// - Squire drops the last line break of a block when it takes HTML, also one that draws an empty last
//   line, which the load list keeps. So load() and replaceAll() give Squire one more line break after such
//   a break, and Squire drops that one (keepEmptyLastLines).
// - Squire writes the value of setTextColor, setHighlightColor, makeLink and insertImage into an attribute
//   outside the sanitizer. So setColor passes only "#rrggbb", setLink only an http, https or mailto
//   address, and insertPicture only an address that the picture test of the field keeps.
// - The tools own every format key and the keys of undo and redo. The engine turns off each of these keys
//   of Squire, with Cmd as Meta and as Ctrl, so a tool that the preset turns off has no key, and the field
//   matches the keys of its commands with the parser of behaviour/keys (tools/keys.ts). A key that a tool
//   takes stops at the text, so Cmd+B does not also fold the sidebar.
// - Shift+Enter: Squire writes one line break. At the end of a line, a browser draws no line for that
//   break, and the typed words go before it. So the engine adds a second line break, as a browser does by
//   itself. It puts the caret between the two breaks, on the new line.
// - A quote of an earlier mail, a blockquote with type="cite" that "Edit the quoted text" moves into the
//   text, takes the reply of a mail app. Enter splits it at the caret, also in the middle of a line, and a
//   new empty line between the two parts takes the caret. Backspace at the start of a line and Delete at
//   its end move no words over the edge of such a quote, where Squire joins the line with the line before
//   or after it. The engine takes these keys on keydown, and on beforeinput too, which is how the keyboard
//   of a phone sends them. A keydown of an input method (isComposing, or the key code 229 of Safari)
//   splits no quote. A selection over the edge goes as Squire deletes it. A quote that the Quote tool
//   makes has no type and keeps the keys of Squire.
// - The browser can format by itself, such as the Format menu of Safari: a beforeinput event. The engine
//   runs none of them, except bold, italic and underline, which every preset has.
// - Squire's own resizer of pictures is off: its handles enter the HTML and the undo history. The field
//   draws the grip and the bar of a selected picture beside the text (picture/Picture.svelte).
// - The words of a proposed change are marked with the CSS Custom Highlight API, so no mark enters the
//   HTML, the words, a copy or the undo history. A browser without the API shows no mark, and the rows of
//   the changes still show.
// - The engine and Squire listen to selectionchange of the document only while the text has the focus,
//   so a page with many fields has no listener of the document for a field that nobody uses. Squire
//   reads the selection only while its text has the focus (_updatePathOnEvent of Squire 2.4.10).
// - The lines of words() are the lines that a person sees (lines.ts). A change and a TextRange count
//   these lines.
// - Typed text: after each character that a person types, outside code, the engine asks the Markdown
//   marks of markdown.ts while the field turns them on, and makes the change in one undo step after the
//   typed text, so Backspace right after the change and the undo key give the typed text back. A paste,
//   a drop and an autocorrection are no typed text. A slash at the start of an empty line or after a
//   space reaches onSlash, and take() makes the command of the slash menu in the same way.
// - The engine reads four members that Squire 2.4.10 declares in its types and does not document:
//   _imageResizer, _dragRange, _updatePathOnEvent and _config.addLinks (decision record 0013). The peer
//   range of squire-rte is ~2.4.10, and a typeof guard keeps the engine working when one of them is
//   missing: the field then keeps the resizer of Squire, counts no drag as its own, leaves Squire to listen
//   to the selection, or lets Take all of a whole text make a link of a plain address.
import Squire from 'squire-rte';
import { HEX, LINK, richTextFragment, sanitizeRichText, toHex, type ColorKind, type TextRange } from '#lib/stack/rich-text.js';
import { ZWS, caretAt, onceIn, pointOf, rangeOf, readLines, textRange, trailing, type Lines } from './lines.js';
import { blockMatch, inlineMatch, type BlockMatch, type InlineMatch, type InlineTool } from './markdown.js';
import type { ToolId } from '../tools/commands.js';
import { PRESET_TOOLS } from '../tools/presets.js';
import type { Align, Block, ChangeSpot, EditorState, Engine, EngineOptions, FoundChange, Mark } from './types.js';

const TAGS: Readonly<Record<Mark, string>> = { bold: 'B', italic: 'I', underline: 'U', strikethrough: 'S', subscript: 'SUB', superscript: 'SUP', code: 'CODE' };
const INLINE_TAGS: Readonly<Record<InlineTool, string>> = { bold: 'B', italic: 'I', strikethrough: 'S', 'inline-code': 'CODE' };

/** A line of the text: a line, a heading, a list item or a code block. */
const LINE = /^(?:DIV|P|H[1-6]|LI|PRE)$/;
/** A line inside one of these is no plain line, and a mark at its start stays text. */
const NOT_PLAIN = /^(?:H[1-6]|LI|BLOCKQUOTE|PRE)$/;
const IN_CODE = (el: Element) => el.nodeName === 'PRE' || el.nodeName === 'CODE';
/** A quote of an earlier mail: the load list keeps type="cite" alone on a quote, in lower case. */
const isCite = (n: Node | null): n is HTMLElement => n instanceof HTMLElement && n.nodeName === 'BLOCKQUOTE' && n.getAttribute('type') === 'cite';
/** A line of the text that holds no other block, as Squire counts its blocks. */
const isLine = (n: Node): n is HTMLElement => n instanceof HTMLElement && LINE.test(n.nodeName) && !n.querySelector(HOLDS_BLOCKS);
/** True when a part of the text holds no character and no picture or divider. */
const blank = (el: HTMLElement) => !el.matches('img, hr') && !el.querySelector('img, hr') && readLines(el).lines.join('') === '';

/** The line of a caret: its element, its lines (lines.ts), the place of the caret, and the words of its line before and after the caret. */
type LineAt = { el: HTMLElement; model: Lines; line: number; col: number; before: string; after: string };

/** The format keys and the keys of undo and redo of Squire 2.4.10 (keyHandlers in dist/squire-raw.mjs), after its Cmd prefix. */
const SQUIRE_KEYS = ['b', 'i', 'u', 'Shift-7', 'Shift-5', 'Shift-6', 'Shift-8', 'Shift-9', '[', ']', 'd', 'z', 'y', 'Shift-z', 'Shift-Z'];

/** The input that Squire hears on the text; read-only stops it before Squire. A keydown has its own rule (onReadonlyKeydown). */
const INPUT_EVENTS = ['keyup', 'keypress', 'beforeinput', 'paste', 'cut', 'drop', 'dragstart', 'dragend'];

/**
 * The keys with Cmd or Ctrl that edit a text: Backspace and Delete with any modifier, which Squire 2.4.10
 * runs (keyHandlers in dist/squire-raw.mjs), and undo (Z) and redo (Shift+Z, Y), which the field runs.
 * In read-only text they edit nothing and still reach the page.
 */
const EDIT_KEYS = /^(?:Backspace|Delete|z|y)$/i;

const MODIFIERS = ['Shift', 'Control', 'Alt', 'Meta'];

/** How long after an Esc in the text a Tab leaves a list item, as in the code-editor. */
const TAB_OUT_MS = 2000;

/** The blocks in which Squire 2.4.10 looks for what follows a line break (isLineBreak in dist/squire-raw.mjs). */
const BREAK_BLOCK = 'div, p, li, h1, h2, h3, h4, h5, h6, pre, blockquote, ul, ol';
/** What Squire 2.4.10 counts after a line break: another line break, or a text that is not white space. */
const counted = (n: Node) => (n.nodeName === 'BR' || (n instanceof Text && /[^ \t\r\n\u200B]/.test(n.data)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP);

/**
 * When Squire 2.4.10 takes HTML, it drops each line break that no line break and no text follows in its
 * block (cleanupBRs in setHTML and insertHTML). That also drops a line break after another line break,
 * which draws an empty last line. Such a break gets one more line break after it, which Squire drops in
 * its place.
 */
function keepEmptyLastLines(frag: DocumentFragment) {
	// A line break at the end of a mark goes after the mark, as in <b>A<br></b><br>. Else Squire drops the
	// empty last line after it.
	for (const br of [...frag.querySelectorAll('br')].reverse()) for (let p = br.parentElement; p && !p.matches(BREAK_BLOCK) && !br.nextSibling; p = br.parentElement) p.after(br);
	for (const br of frag.querySelectorAll('br')) {
		const walker = document.createTreeWalker(br.parentElement?.closest(BREAK_BLOCK) ?? frag, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, counted);
		walker.currentNode = br;
		if (walker.nextNode()) continue;
		walker.currentNode = br;
		if (walker.previousNode()?.nodeName === 'BR') br.after(document.createElement('br'));
	}
}

const ALIGN: Readonly<Record<string, Align>> = { left: 'left', start: 'left', center: 'center', right: 'right', end: 'right', justify: 'justify' };
const LEAF = /^(?:DIV|P|H[1-6])$/;
const HOLDS_BLOCKS = 'div, p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, table';

// ---- The marks of the proposed changes, outside the content

const painted = new Map<object, { marks: readonly Range[]; active: Range | null }>();

function paint() {
	const registry = (globalThis.CSS as { highlights?: HighlightRegistry } | undefined)?.highlights;
	if (!registry || typeof Highlight === 'undefined') return;
	const all = [...painted.values()];
	registry.set('stack-change', new Highlight(...all.flatMap((p) => p.marks)));
	registry.set('stack-change-active', new Highlight(...all.flatMap((p) => (p.active ? [p.active] : []))));
}

// ---- The engine

export function createEngine(root: HTMLElement, options: EngineOptions): Engine {
	const simple = options.preset === 'simple';
	const tools: ReadonlySet<ToolId> = new Set(PRESET_TOOLS[options.preset]);
	const markdown = () => options.markdown?.() === true;
	const keyFns = new Set<(e: KeyboardEvent) => boolean>();
	const fileFns = new Set<(files: File[]) => void>();
	const slashFns = new Set<(slash: Range) => void>();
	/** True right after a change of the Markdown marks: Backspace then gives back the typed text. Any other key, change, press or blur ends it. */
	let revertible = false;
	const listeners = { change: new Set<() => void>(), state: new Set<() => void>(), selection: new Set<() => void>() };
	const emit = (event: keyof typeof listeners) => {
		for (const fn of listeners[event]) fn();
	};
	const lists = (list: 'load' | 'paste') => ({ list, preset: options.preset, picture: options.picture });
	/** The load list takes the next HTML, while load() or replaceAll() runs. */
	let loading = false;
	/** A drag inside the text moves a part of it, which keeps its look. */
	let moving = false;
	/** The HTML of the last copy or cut of this text. A paste that holds it keeps its look too. */
	let copied = '';
	// A paste is the field's own only when its fragment equals the copied HTML, and one paste uses the copy
	// once. The fragment is the part between the markers that a clipboard can add, with no charset element
	// and no "<!-- squire -->" in front: Squire writes that comment before the HTML of each copy.
	const fragmentOf = (html: string) => {
		const a = html.indexOf('<!--StartFragment-->');
		const b = html.indexOf('<!--EndFragment-->');
		const part = a >= 0 && b > a ? html.slice(a + '<!--StartFragment-->'.length, b) : html;
		return part.replace(/^<meta charset=["']?utf-8["']?>/i, '').replace(/^<!-- squire -->/, '');
	};
	const isCopied = (html: string) => copied !== '' && fragmentOf(html) === copied;
	let tabOutUntil = 0;
	/** True from a keydown of Enter with a modifier to the next beforeinput: WebKit sends Shift+Enter as insertParagraph. */
	let modifiedEnter = false;
	const owner = {};

	// Before Squire: its listeners on the text run in the capture phase in the order of their adding, so these run first.
	const onKeydown = (e: KeyboardEvent) => {
		modifiedEnter = e.key === 'Enter' && (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey);
		let taken = false;
		for (const fn of keyFns) {
			if (fn(e)) {
				taken = true;
				break;
			}
		}
		// A key of an input method: Safari can clear isComposing on the keydown that confirms a word, and
		// keeps the key code 229 there, so the Enter that confirms a word splits no quote.
		const composing = e.isComposing || e.keyCode === 229;
		// Backspace right after a change of the Markdown marks gives back the typed text, as the undo key does.
		const plainKey = !e.altKey && !e.ctrlKey && !e.metaKey && !composing;
		if (!taken && revertible && e.key === 'Backspace' && plainKey && !e.shiftKey && root.isContentEditable) {
			sq.undo();
			taken = true;
		}
		// In a quote of an earlier mail, Enter splits the quote, and Backspace and Delete move no words over its
		// edge. A key with a modifier joins two lines at the edge too, so the guard takes each of them. plainKey
		// keeps a key with the code 229 from the split. The guard still takes such a Backspace or Delete,
		// because Squire runs its own Backspace and Delete on each keydown that is not composing and would join
		// the lines over the edge.
		if (!taken && root.isContentEditable && !e.isComposing) {
			if (e.key === 'Enter' && plainKey && !e.shiftKey) taken = splitCite();
			else if (e.key === 'Backspace' || e.key === 'Delete') taken = guardCiteEdge(e.key === 'Backspace');
		}
		if (!MODIFIERS.includes(e.key)) revertible = false;
		if (e.key === 'Escape') {
			if (!composing) tabOutUntil = Date.now() + TAB_OUT_MS;
		} else if (e.key !== 'Tab' && !MODIFIERS.includes(e.key)) tabOutUntil = 0;
		// Squire makes a list of * and 1. at a space by itself. While the Markdown marks act, they take
		// that space on a plain line, so the marks of the preset decide, and Backspace gives the mark back.
		if (!taken && e.key === ' ' && plainKey && markdown() && listMark()) return void e.stopImmediatePropagation();
		// Tab and Shift+Tab move a list item a level in or out, anywhere in the item. Outside a list the browser
		// moves the focus. Esc, then Tab within 2 s, leaves a list item too (WCAG 2.2, 2.1.2).
		const tab = !taken && e.key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey && !composing;
		if (tab && root.isContentEditable && !simple && nearest((el) => el.nodeName === 'LI')) {
			if (Date.now() < tabOutUntil) {
				tabOutUntil = 0;
				e.stopImmediatePropagation();
				return;
			}
			indent(e.shiftKey ? -1 : 1);
			taken = true;
		}
		if (taken) {
			e.preventDefault();
			e.stopPropagation();
		}
		// In text that a person can edit, Esc stays in the field, so that a layer around it stays open.
		if (e.key === 'Escape' && root.isContentEditable) e.stopPropagation();
	};
	const onBeforeInput = (e: InputEvent) => {
		if (e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak') keepCaretOutsideMark();
		// The keyboard of a phone sends Enter, Backspace and Delete as a keydown with the key code 229, which
		// onKeydown leaves, and then as this event. So the quote of an earlier mail takes them here too. A
		// keydown that onKeydown takes is prevented, and the browser then sends no such event for it, so a key
		// acts once. An Enter with a modifier keeps the Enter of Squire, as in onKeydown, also where WebKit sends
		// Shift+Enter as insertParagraph. Read-only text never gets here (stopWhileReadonly).
		const modified = modifiedEnter;
		modifiedEnter = false;
		if (!e.isComposing) {
			const back = /^delete\w*Backward$/.test(e.inputType);
			const forward = /^delete\w*Forward$/.test(e.inputType);
			const taken = e.inputType === 'insertParagraph' ? !modified && splitCite() : (back || forward) && guardCiteEdge(back);
			if (taken) {
				e.preventDefault();
				e.stopImmediatePropagation();
				return;
			}
		}
		if (!/^(?:format|insertOrderedList|insertUnorderedList|insertHorizontalRule|insertLink)/.test(e.inputType)) return;
		e.preventDefault();
		e.stopImmediatePropagation();
		const mark = ({ formatBold: 'bold', formatItalic: 'italic', formatUnderline: 'underline' } as const)[e.inputType as 'formatBold'];
		if (mark && root.isContentEditable) toggleMark(mark);
	};
	const stopWhileReadonly = (e: Event) => {
		if (!root.isContentEditable) e.stopImmediatePropagation();
	};
	// In read-only text, Esc and each key with Cmd or Ctrl go on to the page: Esc to a layer around the
	// field, Cmd+K to the command palette, Cmd+B to the sidebar, Cmd+S and Cmd+Enter to the page. Squire
	// returns on a prevented key, so a key that it edits with stops there. Any other key stays in the text,
	// as in a read-only text area, so that no single-key binding of the page runs; the browser still moves
	// the focus and the caret.
	const onReadonlyKeydown = (e: KeyboardEvent) => {
		if (root.isContentEditable) return;
		if (e.key !== 'Escape' && !e.metaKey && !e.ctrlKey) return void e.stopImmediatePropagation();
		if (EDIT_KEYS.test(e.key)) e.preventDefault();
	};
	const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes('Files') === true;
	/** True while a drag inside the text moves a part of it: Squire keeps that range in _dragRange. */
	const dragInside = () => typeof sq._dragRange === 'object' && sq._dragRange !== null;
	const onDragOver = (e: DragEvent) => {
		if (hasFiles(e) && !dragInside() && fileFns.size > 0) e.preventDefault();
	};
	const onDrop = (e: DragEvent) => {
		if (hasFiles(e) && !dragInside()) {
			// A drop of files never inserts the name of a file.
			e.preventDefault();
			e.stopImmediatePropagation();
			if (!root.isContentEditable) return;
			const at = document.caretPositionFromPoint?.(e.clientX, e.clientY);
			const range = document.createRange();
			if (at && root.contains(at.offsetNode)) {
				range.setStart(at.offsetNode, at.offset);
				sq.setSelection(range);
			}
			const files = [...(e.dataTransfer?.files ?? [])];
			for (const fn of fileFns) fn(files);
			return;
		}
		moving = dragInside();
	};
	const afterDrop = () => {
		moving = false;
	};
	root.addEventListener('keydown', onKeydown, true);
	root.addEventListener('keydown', onReadonlyKeydown, true);
	for (const type of INPUT_EVENTS) root.addEventListener(type, stopWhileReadonly, true);
	root.addEventListener('beforeinput', onBeforeInput, true);
	root.addEventListener('dragover', onDragOver, true);
	root.addEventListener('drop', onDrop, true);

	const sq = new Squire(root, {
		blockTag: 'DIV',
		addLinks: !simple,
		willCutCopy: (html: string) => {
			copied = html;
			return html;
		},
		sanitizeToDOMFragment: (html: string) => {
			// A paste of the last copy keeps the look of the copy only: the HTML outside its fragment does not enter.
			const own = loading || moving ? html : isCopied(html) ? fragmentOf(html) : null;
			copied = '';
			moving = false;
			if (own === null) return richTextFragment(html, lists('paste'));
			const frag = richTextFragment(own, lists('load'));
			if (loading) keepEmptyLastLines(frag);
			return frag;
		}
	});
	if (typeof sq._imageResizer?.destroy === 'function') sq._imageResizer.destroy();
	root.addEventListener('drop', afterDrop);
	// Squire names Cmd "Meta-" or "Ctrl-" by its own test of the system, so both go.
	for (const cmd of ['Meta-', 'Ctrl-']) for (const key of SQUIRE_KEYS) sq.setKeyHandler(cmd + key, null);
	// Squire makes a list of "* " and "1. " at the start of a line. The simple preset has no list.
	if (simple) sq.setKeyHandler(' ', null);
	// Squire runs Shift+Enter in its own listener of beforeinput, which runs before this one.
	sq.addEventListener('beforeinput', (e: Event) => {
		if ((e as InputEvent).inputType !== 'insertLineBreak' || !e.defaultPrevented) return;
		const range = sq.getSelection();
		const br = range.collapsed ? range.startContainer.childNodes[range.startOffset - 1] : undefined;
		if (br?.nodeName !== 'BR' || !trailing(br, root)) return;
		br.after(document.createElement('br'));
		range.setStartAfter(br);
		range.collapse(true);
		sq.setSelection(range);
	});
	sq.addEventListener('pasteImage', (e: Event) => {
		const data = (e as CustomEvent<{ clipboardData: DataTransfer }>).detail.clipboardData;
		const files = [...data.items].flatMap((item) => (item.kind === 'file' ? (item.getAsFile() ?? []) : []));
		for (const fn of fileFns) fn(files);
	});

	let undoState = { canUndo: false, canRedo: false };
	sq.addEventListener('undoStateChange', (e: Event) => {
		undoState = (e as CustomEvent<typeof undoState>).detail;
		emit('state');
	});
	// Squire fires input for a change of the DOM that changes no content too, such as the removal of its
	// zero-width spaces. So `change` fires only when the HTML differs from the last one.
	let reported = '';
	sq.addEventListener('input', () => {
		revertible = false;
		const html = sq.getHTML();
		if (html === reported) return;
		reported = html;
		emit('change');
	});
	for (const type of ['pathChange', 'select', 'cursor']) sq.addEventListener(type, () => emit('state'));

	let selected: TextRange | null = null;
	const onSelectionChange = () => {
		const selection = document.getSelection();
		if (!selection?.rangeCount) return;
		const inside = (n: Node | null) => !!n && root.contains(n);
		if (!inside(selection.anchorNode) && !inside(selection.focusNode)) return;
		emit('state');
		const next = selection.isCollapsed ? null : textRange(readLines(root), selection.getRangeAt(0));
		if (JSON.stringify(next) === JSON.stringify(selected)) return;
		selected = next;
		emit('selection');
	};
	let listening = true;
	/** The listener of Squire on the selection. With no such member, Squire keeps its own listener on all the time. */
	const updatePath = typeof sq._updatePathOnEvent === 'function' ? sq._updatePathOnEvent : null;
	/** Turns the listeners of the selection of the document on while the text has the focus, and off after it. */
	const listen = (on: boolean) => {
		if (on === listening) return;
		listening = on;
		if (on) {
			document.addEventListener('selectionchange', onSelectionChange);
			if (updatePath) sq.addEventListener('selectionchange', updatePath);
		} else {
			document.removeEventListener('selectionchange', onSelectionChange);
			if (updatePath) sq.removeEventListener('selectionchange', updatePath);
		}
	};
	const onFocusIn = () => listen(true);
	const onFocusOut = () => {
		revertible = false;
		listen(false);
	};
	document.addEventListener('selectionchange', onSelectionChange);
	root.addEventListener('focusin', onFocusIn);
	root.addEventListener('focusout', onFocusOut);
	// Typed text: a character of a key, and the end of a composition, such as a dead key. A paste, a drop
	// and an autocorrection have other input types.
	const onInput = (e: Event) => {
		if (e instanceof InputEvent && e.inputType === 'insertText' && !e.isComposing) typed(e.data);
	};
	const onCompositionEnd = (e: CompositionEvent) => typed(e.data);
	const onPointerDown = () => {
		revertible = false;
	};
	root.addEventListener('input', onInput);
	root.addEventListener('compositionend', onCompositionEnd);
	root.addEventListener('pointerdown', onPointerDown);
	// The text can have the focus before Squire listens for it, such as a click while this module loads.
	if (document.activeElement === root) sq.fireEvent('focus');
	else listen(false);

	/** The node at the start of the selection. */
	function start(): Node {
		const range = sq.getSelection();
		const node = range.startContainer;
		return node.nodeType === Node.ELEMENT_NODE ? (node.childNodes[range.startOffset] ?? node) : node;
	}

	function nearest(test: (el: Element) => boolean): Element | null {
		for (let n: Node | null = start(); n && n !== root; n = n.parentNode) if (n instanceof Element && test(n)) return n;
		return null;
	}

	function blockAt(): Block | null {
		const el = nearest((n) => /^(?:PRE|H[1-6]|LI|BLOCKQUOTE)$/.test(n.nodeName));
		if (!el) return 'paragraph';
		if (el.nodeName === 'PRE') return 'code-block';
		if (/^H[1-3]$/.test(el.nodeName)) return el.nodeName.toLowerCase() as Block;
		if (/^H[4-6]$/.test(el.nodeName)) return null;
		if (el.nodeName === 'LI') return el.parentElement?.nodeName === 'OL' ? 'numbered-list' : 'bullet-list';
		return 'quote';
	}

	function linkAt(): HTMLAnchorElement | null {
		const a = nearest((n) => n.nodeName === 'A');
		if (a instanceof HTMLAnchorElement) return a;
		const range = sq.getSelection();
		if (range.collapsed) return null;
		const met = [...root.querySelectorAll('a')].filter((el) => range.intersectsNode(el));
		return met.length === 1 ? (met[0] ?? null) : null;
	}

	function colorAt(name: 'color' | 'highlight'): string | null {
		const span = nearest((el) => el.nodeName === 'SPAN' && el.classList.contains(name));
		if (!(span instanceof HTMLElement)) return null;
		return toHex(name === 'color' ? span.style.color : span.style.backgroundColor);
	}

	function state(): EditorState {
		const marks = new Set<Mark>();
		for (const [mark, tag] of Object.entries(TAGS) as [Mark, string][]) if (sq.hasFormat(tag)) marks.add(mark);
		const line = nearest((n) => LEAF.test(n.nodeName) || n.nodeName === 'LI');
		return {
			marks,
			block: blockAt(),
			align: ALIGN[line instanceof HTMLElement ? getComputedStyle(line).textAlign : 'left'] ?? 'left',
			link: linkAt()?.getAttribute('href') ?? null,
			selected: !sq.getSelection().collapsed,
			inList: nearest((n) => n.nodeName === 'LI') !== null,
			color: colorAt('color'),
			highlight: colorAt('highlight'),
			canUndo: undoState.canUndo,
			canRedo: undoState.canRedo
		};
	}

	/**
	 * After a mark ends at the caret, as after **word** or Bold off at the end of a line, Squire 2.4.10
	 * keeps the caret outside the mark in a text node that holds only a zero-width space. Before a split,
	 * Squire removes each zero-width space. Then its link pass (addLinks) moves the caret to the end of the
	 * words of the mark, and the new line takes the mark. An empty text node stays, and the caret stays
	 * outside the mark.
	 */
	function keepCaretOutsideMark() {
		const range = sq.getSelection();
		if (!range.collapsed) return;
		const at = range.startContainer;
		const holder = at instanceof Text ? at : at.childNodes[range.startOffset - 1];
		if (holder instanceof Text && holder.data !== '' && holder.data.replaceAll(ZWS, '') === '' && holder.previousSibling instanceof Element) holder.data = '';
	}

	function toggleMark(mark: Mark) {
		const tag = TAGS[mark];
		if (sq.hasFormat(tag)) sq.changeFormat(null, { tag });
		else if (mark === 'subscript') sq.changeFormat({ tag }, { tag: 'SUP' });
		else if (mark === 'superscript') sq.changeFormat({ tag }, { tag: 'SUB' });
		else sq.changeFormat({ tag });
	}

	/** Each line of the selection becomes `tag`, through modifyBlocks, so one undo step gives the lines back. */
	function renameLines(tag: string) {
		sq.modifyBlocks((frag) => {
			for (const el of [...frag.querySelectorAll('div, p, h1, h2, h3, h4, h5, h6')].filter((n) => !n.querySelector(HOLDS_BLOCKS))) {
				if (el.nodeName === tag) continue;
				const next = document.createElement(tag);
				for (const a of el.attributes) next.setAttribute(a.name, a.value);
				next.append(...el.childNodes);
				el.replaceWith(next);
			}
			return frag;
		});
	}

	function setBlock(next: Block) {
		const inList = nearest((n) => n.nodeName === 'LI') !== null;
		const inPre = sq.hasFormat('PRE');
		const now = blockAt();
		switch (next) {
			case 'paragraph':
			case 'h1':
			case 'h2':
			case 'h3':
				// A list, a code block and a quote end first, so the lines become lines of the new kind.
				if (inList) sq.removeList();
				if (inPre) sq.removeCode();
				if (next === 'paragraph' && now === 'quote') sq.decreaseQuoteLevel();
				renameLines(next === 'paragraph' ? 'DIV' : next.toUpperCase());
				return;
			case 'bullet-list':
				if (now === 'bullet-list') sq.removeList();
				else sq.makeUnorderedList();
				return;
			case 'numbered-list':
				if (now === 'numbered-list') sq.removeList();
				else sq.makeOrderedList();
				return;
			case 'quote':
				if (nearest((n) => n.nodeName === 'BLOCKQUOTE')) sq.decreaseQuoteLevel();
				else sq.increaseQuoteLevel();
				return;
			case 'code-block': {
				if (inPre) return void sq.removeCode();
				// Squire makes inline code of a part of one line, so a part of one line becomes a caret first.
				const range = sq.getSelection();
				if (!range.collapsed && nearest((n) => LEAF.test(n.nodeName))?.contains(range.endContainer)) {
					range.collapse(true);
					sq.setSelection(range);
				}
				sq.code();
				return;
			}
		}
	}

	function indent(direction: 1 | -1) {
		if (!nearest((n) => n.nodeName === 'LI')) return;
		if (direction > 0) sq.increaseListLevel();
		else sq.decreaseListLevel();
	}

	/** A divider on its own line after the lines of the selection, and the caret on an empty line under it. */
	function insertDivider() {
		const hr = document.createElement('hr');
		const line = document.createElement('div');
		line.append(document.createElement('br'));
		sq.modifyBlocks((frag) => {
			frag.append(hr, line);
			return frag;
		});
		if (!line.isConnected) return;
		const range = document.createRange();
		range.setStart(line, 0);
		sq.setSelection(range);
	}

	// ---- A quote of an earlier mail in the text (blockquote type="cite")

	/** The outermost quote of an earlier mail around a node, or null. */
	function citeOf(node: Node): HTMLElement | null {
		let found: HTMLElement | null = null;
		for (let n: Node | null = node; n && n !== root; n = n.parentNode) if (isCite(n)) found = n;
		return found;
	}

	/** The line around a node, or null. */
	function lineOf(node: Node): HTMLElement | null {
		for (let n: Node | null = node; n && n !== root; n = n.parentNode) if (isLine(n)) return n;
		return null;
	}

	/** The line before or after a line, in the order of the document, or null. */
	function nextLine(line: HTMLElement, back: boolean): HTMLElement | null {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, { acceptNode: (n) => (isLine(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
		walker.currentNode = line;
		return (back ? walker.previousNode() : walker.nextNode()) as HTMLElement | null;
	}

	/** Removes the elements with no character at one edge of a part, from the inside out, such as the empty rest of a split line. */
	function trimEdge(part: HTMLElement, end: boolean) {
		const path: HTMLElement[] = [];
		for (let n = end ? part.lastChild : part.firstChild; n instanceof HTMLElement && !n.matches('br, img, hr'); n = end ? n.lastChild : n.firstChild) path.push(n);
		for (const el of path.reverse()) {
			if (!blank(el)) return;
			el.remove();
		}
	}

	/**
	 * Enter in a quote of an earlier mail: the quote splits at the caret, as in a mail app. The part before and
	 * the part after stay quotes with the attributes of the quote, and a new empty line between them takes the
	 * caret. A selection goes first. The empty rest of the split line goes, and so does a part with no
	 * character, so Enter at the start or at the end of the quote gives a line before or after it. A list item
	 * and a code block in the quote keep the Enter of Squire. One undo step.
	 */
	function splitCite(): boolean {
		const range = sq.getSelection();
		const cite = citeOf(range.startContainer);
		if (!cite || citeOf(range.endContainer) !== cite) return false;
		for (let n: Node | null = range.startContainer; n && n !== cite; n = n.parentNode) if (n.nodeName === 'LI' || n.nodeName === 'PRE') return false;
		sq.saveUndoState();
		const at = sq.getSelection();
		if (!at.collapsed) at.deleteContents();
		const rest = document.createRange();
		rest.setStart(at.startContainer, at.startOffset);
		rest.setEnd(cite, cite.childNodes.length);
		const after = cite.cloneNode(false) as HTMLElement;
		after.append(rest.extractContents());
		const line = sq.createDefaultBlock();
		cite.after(line, after);
		trimEdge(cite, true);
		trimEdge(after, false);
		for (const part of [cite, after]) if (blank(part)) part.remove();
		const caret = document.createRange();
		caret.setStart(line, 0);
		sq.setSelection(caret);
		saveChange();
		return true;
	}

	/**
	 * Backspace at the start of a line and Delete at the end of a line: Squire joins the line with the line
	 * before or after it. When one of the two lines is in a quote of an earlier mail and the other is not, the
	 * join would move words into the quote or out of it. So there the key removes the one of the two lines
	 * that holds no character, the line outside the quote first, and else it changes nothing. Backspace at the
	 * start of a quote with no line before it changes nothing too, where Squire takes the line out of the
	 * quote. A removal that leaves two parts of a quote side by side joins them (joinParts), so the key on an
	 * empty reply line between two parts joins them again. When the line of the caret goes, the caret goes to
	 * the end of the line before it after Backspace, and to the start of the line after it after Delete. One
	 * undo step. A selection goes to Squire. True when it takes the key.
	 */
	function guardCiteEdge(back: boolean): boolean {
		const range = sq.getSelection();
		if (!range.collapsed) return false;
		const line = lineOf(range.startContainer);
		if (!line) return false;
		const model = readLines(line);
		const [l, c] = pointOf(model, range.startContainer, range.startOffset);
		const last = model.lines.length - 1;
		if (back ? l !== 0 || c !== 0 : l !== last || c !== (model.lines[last] ?? '').length) return false;
		const other = nextLine(line, back);
		// A list item there keeps the Backspace of Squire, which ends the list and keeps the line in the quote.
		if (!other) return back && citeOf(line) !== null && line.closest('li') === null;
		if ((citeOf(line) === null) === (citeOf(other) === null)) return false;
		const outside = citeOf(line) === null ? line : other;
		const inside = outside === line ? other : line;
		const empty = blank(outside) ? outside : blank(inside) ? inside : null;
		if (!empty) return true;
		sq.saveUndoState();
		// The join moves the lines of the lower part, and a Range in them moves out with them, so the caret is
		// kept as a node and an offset, and set again after the change.
		const at = sq.getSelection();
		let point: [Node, number] = [at.startContainer, at.startOffset];
		let gone: HTMLElement = empty;
		while (gone.parentElement && gone.parentElement !== root && gone.parentElement.children.length === 1) gone = gone.parentElement;
		const before = gone.previousElementSibling;
		const after = gone.nextElementSibling;
		gone.remove();
		if (isCite(before) && isCite(after)) joinParts(before, after);
		if (empty === line) {
			const kept = readLines(other);
			const end = back ? kept.lines.length - 1 : 0;
			// A line with no character takes the caret before its line break.
			point = caretAt(kept, end, back ? (kept.lines[end] ?? '').length : 0) ?? [other, 0];
		}
		const caret = document.createRange();
		caret.setStart(point[0], point[1]);
		sq.setSelection(caret);
		saveChange();
		return true;
	}

	/**
	 * Joins the part after into the part before. A split in a nested quote splits the inner quote too, so
	 * the join goes on one level down while the two children at the edge are quotes of one type.
	 */
	function joinParts(before: Element, after: Element) {
		let a = before;
		let b = after;
		for (;;) {
			const last = a.lastChild;
			const first = b.firstChild;
			a.append(...b.childNodes);
			b.remove();
			if (!(last instanceof Element && first instanceof Element && last.nodeName === 'BLOCKQUOTE' && first.nodeName === 'BLOCKQUOTE')) return;
			if (last.getAttribute('type') !== first.getAttribute('type')) return;
			a = last;
			b = first;
		}
	}

	/**
	 * After a change of the engine: Squire counts it now, and the text after it is an undo step of its own,
	 * so the words typed next are not in the same step. The step is saved outside the observer of Squire,
	 * which would count the bookmark of the step as a change, save the same text again, and so make the next
	 * undo give the same text.
	 */
	function saveChange() {
		sq.modifyDocument(() => {});
		sq.modifyDocument(() => sq.saveUndoState());
	}

	// ---- Typed text: the Markdown marks and the slash menu

	/** The line of a caret, or null outside a line. */
	function lineAt(range: Range): LineAt | null {
		let el: Node | null = range.startContainer;
		while (el && el !== root && !(el instanceof HTMLElement && LINE.test(el.nodeName))) el = el.parentNode;
		if (!(el instanceof HTMLElement) || el === root) return null;
		const model = readLines(el);
		const [line, col] = pointOf(model, range.startContainer, range.startOffset);
		const text = model.lines[line] ?? '';
		return { el, model, line, col, before: text.slice(0, col), after: text.slice(col) };
	}

	/**
	 * True when the words before the caret on a plain line are * or 1., which Squire makes a list of at a
	 * space. On a line that is no plain line, such as in a quote, Squire keeps making its lists, as with
	 * the Markdown marks off.
	 */
	function listMark(): boolean {
		const range = sq.getSelection();
		const at = range.collapsed ? lineAt(range) : null;
		return at !== null && (at.before === '*' || at.before === '1.') && !nearest((el) => NOT_PLAIN.test(el.nodeName));
	}

	/**
	 * The text as it stands is one undo step. Squire hears a change of the text a moment after it, so the
	 * typed text counts as a change first, and the step holds it.
	 */
	function saveTyped() {
		sq.modifyDocument(() => {});
		sq.saveUndoState();
	}

	/** A line with no character keeps a line break, so that it keeps its height and the caret. */
	function holdLine(line: HTMLElement) {
		if (readLines(line).lines.join('') === '' && !line.querySelector('br, img, hr')) line.append(document.createElement('br'));
	}

	/** A line of its own at the top level with no character becomes a divider, with the caret on an empty line under it. */
	function divide(line: HTMLElement): boolean {
		if (line.parentNode !== root || readLines(line).lines.join('') !== '') return false;
		const next = sq.createDefaultBlock();
		line.replaceWith(document.createElement('hr'), next);
		const range = document.createRange();
		range.setStart(next, 0);
		sq.setSelection(range);
		return true;
	}

	/** After a change of typed text: Squire counts it now, and Backspace gives the typed text back until the next key or change. */
	function changed() {
		sq.modifyDocument(() => {});
		revertible = true;
	}

	function blockMark(at: LineAt, m: BlockMatch) {
		saveTyped();
		const mark = rangeOf(readLines(at.el), at.line, 0, m.length);
		if (!mark) return;
		mark.deleteContents();
		holdLine(at.el);
		sq.setSelection(mark);
		if (m.tool !== 'hr' || !divide(at.el)) COMMANDS[m.tool]?.();
		changed();
	}

	function inlineMark(at: LineAt, m: InlineMatch) {
		const whole = rangeOf(at.model, at.line, m.from - m.mark, m.to + m.mark);
		// No mark of words reaches into code.
		if (!whole || [...at.el.querySelectorAll('code')].some((c) => whole.intersectsNode(c))) return;
		saveTyped();
		const model = readLines(at.el);
		const open = rangeOf(model, at.line, m.from - m.mark, m.from);
		const words = rangeOf(model, at.line, m.from, m.to);
		const close = rangeOf(model, at.line, m.to, m.to + m.mark);
		if (!open || !words || !close) return;
		const tag = INLINE_TAGS[m.tool];
		close.deleteContents();
		open.deleteContents();
		sq.changeFormat({ tag }, null, words);
		// The words that the person types next take no mark.
		const end = sq.getSelection().cloneRange();
		end.collapse(false);
		sq.changeFormat(null, { tag }, end);
		changed();
	}

	/** After each character that a person typed: the slash of the slash menu, else the Markdown marks. */
	function typed(data: string | null) {
		if (!data || !root.isContentEditable) return;
		const slash = data === '/' && slashFns.size > 0;
		if (!slash && !markdown()) return;
		const range = sq.getSelection();
		if (!range.collapsed || nearest(IN_CODE)) return;
		const at = lineAt(range);
		if (!at) return;
		if (slash) {
			// At the start of an empty line, or after a space.
			const opens = at.before.endsWith('/') && ((at.before === '/' && at.after === '') || at.before.at(-2) === ' ');
			const mark = opens ? rangeOf(at.model, at.line, at.col - 1, at.col) : null;
			if (mark) for (const fn of slashFns) fn(mark);
			return;
		}
		const plain = !nearest((el) => NOT_PLAIN.test(el.nodeName));
		const block = plain && at.line === 0 ? blockMatch(at.before, at.after, tools) : null;
		if (block) return blockMark(at, block);
		const inline = inlineMatch(at.before, tools);
		if (inline) inlineMark(at, inline);
	}

	function take(typedRange: Range, tool: ToolId | null) {
		if (!root.isContentEditable || !root.contains(typedRange.startContainer)) return;
		const at = lineAt(typedRange);
		if (!at) return;
		const [, to] = pointOf(at.model, typedRange.endContainer, typedRange.endOffset);
		saveTyped();
		const words = rangeOf(readLines(at.el), at.line, at.col, Math.max(at.col + 1, to));
		if (!words) return;
		words.deleteContents();
		holdLine(at.el);
		sq.setSelection(words);
		if (tool && (tool !== 'hr' || !divide(at.el))) COMMANDS[tool]?.();
		sq.modifyDocument(() => {});
	}

	function setLink(url: string | null) {
		if (url === null) return void sq.removeLink();
		const href = url.trim();
		if (!LINK.test(href.replace(/[\u0000- \u007f]/g, ''))) return;
		// A caret in a link, or a selection inside one link, changes the address of that whole link.
		const a = linkAt();
		const range = sq.getSelection();
		if (a && (range.collapsed || (a.contains(range.startContainer) && a.contains(range.endContainer)))) {
			const whole = document.createRange();
			whole.selectNodeContents(a);
			sq.setSelection(whole);
		}
		sq.makeLink(href);
	}

	function setColor(kind: ColorKind, hex: string | null) {
		const value = hex?.toLowerCase() ?? null;
		if (value !== null && !HEX.test(value)) return;
		if (kind === 'text') sq.setTextColor(value);
		else sq.setHighlightColor(value);
	}

	function insertPicture(src: string, width: number, height: number): HTMLImageElement | null {
		if (!options.picture(src) || simple) return null;
		const attrs: Record<string, string> = { alt: '' };
		if (width > 0) attrs.width = String(Math.round(width));
		if (height > 0) attrs.height = String(Math.round(height));
		return sq.insertImage(src, attrs);
	}

	function setPictureWidth(img: HTMLImageElement, width: number) {
		const w = Math.max(1, Math.round(width));
		const ratio = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : Number(img.getAttribute('height')) / Math.max(1, Number(img.getAttribute('width')));
		img.setAttribute('width', String(w));
		if (Number.isFinite(ratio) && ratio > 0) img.setAttribute('height', String(Math.round(w * ratio)));
	}

	function removePicture(img: HTMLImageElement) {
		if (!root.contains(img)) return;
		sq.saveUndoState();
		const range = document.createRange();
		range.setStartBefore(img);
		img.remove();
		sq.setSelection(range);
	}

	const live = new Map<number, Range>();

	function find(changes: readonly ChangeSpot[]): Map<number, FoundChange> {
		const model = readLines(root);
		const out = new Map<number, FoundChange>();
		for (const c of changes) {
			const r = live.get(c.n);
			if (r && root.contains(r.startContainer) && r.toString().replaceAll(ZWS, '') === c.old) {
				const [line, col] = pointOf(model, r.startContainer, r.startOffset);
				const [end] = pointOf(model, r.endContainer, r.endOffset);
				if (line === end && onceIn(model.lines[line] ?? '', c.old) === col) {
					out.set(c.n, { range: r, line, at: col });
					continue;
				}
			}
			const i = onceIn(model.lines[c.block] ?? '', c.old);
			const found = i >= 0 ? rangeOf(model, c.block, i, i + c.old.length) : null;
			if (!found) {
				live.delete(c.n);
				continue;
			}
			live.set(c.n, found);
			out.set(c.n, { range: found, line: c.block, at: i });
		}
		for (const n of [...live.keys()]) if (!changes.some((c) => c.n === n)) live.delete(n);
		return out;
	}

	function replace(parts: readonly { range: Range; text: string }[]) {
		if (parts.length === 0) return;
		sq.saveUndoState();
		// From the end of the text back, so that each change leaves the places before it as they are.
		const sorted = [...parts].sort((a, b) => b.range.compareBoundaryPoints(Range.START_TO_START, a.range));
		for (const { range, text } of sorted) {
			const { startContainer: s, startOffset: so, endContainer: e, endOffset: eo } = range;
			if (s === e && s instanceof Text) s.replaceData(so, eo - so, text);
			else {
				range.deleteContents();
				if (text) range.insertNode(document.createTextNode(text));
			}
		}
	}

	/**
	 * The new HTML becomes the content as one undo step, and undo gives back the text and the caret before it.
	 * - The step is saved first, with the selection of the person, so undo gives a caret and not the whole
	 *   text selected. With no edit after the last step, Squire keeps that step and its caret. insertHTML
	 *   saves no second step, because Squire is still in its undo state.
	 * - The root then holds one empty block, so no container of the old first block, such as a quote or a
	 *   list, takes the new HTML in. This is outside modifyDocument: its takeRecords() would count the
	 *   bookmark of the saved step as a change, insertHTML would save the empty root, and undo would give it.
	 * - Squire does not turn a plain address of the new HTML into a link, because the page gave the text.
	 */
	function replaceAll(html: string) {
		sq.saveUndoState();
		root.replaceChildren(sq.createDefaultBlock());
		const range = document.createRange();
		range.selectNodeContents(root);
		sq.setSelection(range);
		const config: { addLinks?: unknown } | undefined = sq._config;
		const links = typeof config?.addLinks === 'boolean' ? config.addLinks : null;
		if (config && links !== null) config.addLinks = false;
		loading = true;
		try {
			sq.insertHTML(html);
		} finally {
			loading = false;
			if (config && links !== null) config.addLinks = links;
		}
	}

	const setAlign = (a: Align) => void sq.setTextAlignment(a);

	/** The command of each tool that acts at once (Engine.exec). */
	const COMMANDS: Partial<Record<ToolId, () => void>> = {
		undo: () => void sq.undo(),
		redo: () => void sq.redo(),
		paragraph: () => setBlock('paragraph'),
		h1: () => setBlock('h1'),
		h2: () => setBlock('h2'),
		h3: () => setBlock('h3'),
		'bullet-list': () => setBlock('bullet-list'),
		'numbered-list': () => setBlock('numbered-list'),
		quote: () => setBlock('quote'),
		'code-block': () => setBlock('code-block'),
		bold: () => toggleMark('bold'),
		italic: () => toggleMark('italic'),
		underline: () => toggleMark('underline'),
		strikethrough: () => toggleMark('strikethrough'),
		'inline-code': () => toggleMark('code'),
		subscript: () => toggleMark('subscript'),
		superscript: () => toggleMark('superscript'),
		'clear-formatting': () => void sq.removeAllFormatting(),
		'align-left': () => setAlign('left'),
		'align-center': () => setAlign('center'),
		'align-right': () => setAlign('right'),
		'align-justify': () => setAlign('justify'),
		outdent: () => indent(-1),
		indent: () => indent(1),
		hr: () => insertDivider()
	};
	return {
		load(html) {
			loading = true;
			try {
				sq.setHTML(html);
			} finally {
				loading = false;
			}
			reported = sq.getHTML();
			live.clear();
			revertible = false;
		},
		html: () => sanitizeRichText(sq.getHTML(), lists('load')),
		words: () => readLines(root).lines.join('\n'),
		empty: () => readLines(root).lines.join('').trim() === '' && !root.querySelector('img, hr'),
		focus: () => void sq.focus(),
		setReadonly(readonly) {
			sq.modifyDocument(() => {
				root.setAttribute('contenteditable', readonly ? 'false' : 'true');
				if (readonly) root.setAttribute('aria-readonly', 'true');
				else root.removeAttribute('aria-readonly');
			});
		},
		setAttribute(name, value) {
			if (root.getAttribute(name) === value) return;
			sq.modifyDocument(() => (value === null ? root.removeAttribute(name) : root.setAttribute(name, value)));
		},
		state,
		exec(id) {
			COMMANDS[id]?.();
		},
		setLink,
		setColor,
		insertPicture,
		setPictureWidth,
		removePicture,
		saveUndo: () => void sq.saveUndoState(),
		selection: () => selected,
		find,
		replace,
		replaceAll,
		caret(line, col) {
			const at = caretAt(readLines(root), line, col);
			if (!at) return;
			const range = document.createRange();
			range.setStart(at[0], at[1]);
			sq.setSelection(range);
		},
		mark(ranges, active) {
			painted.set(owner, { marks: ranges, active });
			paint();
		},
		on(event, fn) {
			listeners[event].add(fn);
			return () => listeners[event].delete(fn);
		},
		onKey(fn) {
			keyFns.add(fn);
			return () => keyFns.delete(fn);
		},
		onFiles(fn) {
			fileFns.add(fn);
			return () => fileFns.delete(fn);
		},
		onSlash(fn) {
			slashFns.add(fn);
			return () => slashFns.delete(fn);
		},
		take,
		destroy() {
			painted.delete(owner);
			paint();
			listen(false);
			root.removeEventListener('focusin', onFocusIn);
			root.removeEventListener('focusout', onFocusOut);
			root.removeEventListener('keydown', onKeydown, true);
			root.removeEventListener('keydown', onReadonlyKeydown, true);
			for (const type of INPUT_EVENTS) root.removeEventListener(type, stopWhileReadonly, true);
			root.removeEventListener('beforeinput', onBeforeInput, true);
			root.removeEventListener('dragover', onDragOver, true);
			root.removeEventListener('drop', onDrop, true);
			root.removeEventListener('drop', afterDrop);
			root.removeEventListener('input', onInput);
			root.removeEventListener('compositionend', onCompositionEnd);
			root.removeEventListener('pointerdown', onPointerDown);
			sq.destroy();
		}
	};
}
