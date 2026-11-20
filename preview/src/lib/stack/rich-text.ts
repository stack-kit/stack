// The data of the rich text field (### rich-text-field in DESIGN.md) that a page also uses: the types
// of the parts, the content colors, and the sanitizer. A product imports it from
// @stack-kit/stack/rich-text. The parts import it too, so a page and the field clean HTML with the
// same lists.
//
// The sanitizer builds a new tree. It parses the HTML into an inert <template>, where no script runs
// and no picture loads, and it copies only what its list allows: each element is a new element of an
// allowed tag, each attribute a value that passed its own test, and each text a text node. Nothing of
// the input that the list does not name reaches the output, so no tag, attribute or scheme that the list
// forgot can pass. It needs a DOM, so it runs in the browser. A server that stores or sends the HTML
// cleans it again with an allow-list sanitizer that needs no DOM, with the tags, attributes and schemes
// of the load list, and stays the authority (### rich-text-field in DESIGN.md).
//
// - The load list cleans HTML that a page sets, such as a saved draft, and the HTML that the field gives
//   out. It keeps what the tools write: the lines, the headings, the lists, the quote, the code block,
//   the divider, the marks, a link, a picture whose address passes, a text color and a highlight in hex,
//   and the alignment of a line. On a quote it keeps one attribute with one value, type="cite", the mark
//   of a quoted earlier mail, which the field writes when a person moves the quote of a reply into the
//   text.
// - The paste list cleans HTML that comes in from outside the text, such as a paste from a word
//   processor or a web page. It keeps structure only: no style, class, span, table or picture stays, and
//   their text does. Before that it reads the look that a style gives: a bold, italic, underlined or
//   struck span becomes the tag, the lines of a text whose style keeps its line ends stay lines, a run of
//   list paragraphs of a word processor becomes a list, a table cell becomes its text and a picture its
//   alt text. Then each container gives its blocks to the top level, so a tool that acts on the line of
//   the caret never takes a whole pasted article.
// - The simple preset keeps lines, bold, italic and underline only, in both lists.

import { PROBE, pairsOf, readPaper } from '#lib/rich-text/paper.js';

/** The tools of the field: `full` turns on every tool, `simple` only bold, italic and underline. */
export type RichTextPreset = 'full' | 'simple';

/**
 * A command of the rich text field that a key runs: each tool of the toolbar, such as `bold`, and
 * `toolbar`, which moves the focus from the text to the toolbar. Its id in architecture/keys.json is
 * "rich-text." and the command, such as "rich-text.bold".
 */
export type RichTextCommand =
	| 'undo'
	| 'redo'
	| 'paragraph'
	| 'h1'
	| 'h2'
	| 'h3'
	| 'bullet-list'
	| 'numbered-list'
	| 'quote'
	| 'code-block'
	| 'bold'
	| 'italic'
	| 'underline'
	| 'strikethrough'
	| 'inline-code'
	| 'subscript'
	| 'superscript'
	| 'link'
	| 'text-color'
	| 'highlight-color'
	| 'clear-formatting'
	| 'align-left'
	| 'align-center'
	| 'align-right'
	| 'align-justify'
	| 'outdent'
	| 'indent'
	| 'hr'
	| 'picture'
	| 'toolbar';

/**
 * The default keys of each command, as architecture/keys.json writes them, the first one as the tooltips
 * and the menus show it. [] is a command with no default key: the keys prop of the field can give it one.
 * scripts/keys.mjs compares these keys with the entries of keys.json whose id starts with "rich-text.",
 * so keep one line for each command.
 */
export const RICH_TEXT_KEYS: Readonly<Record<RichTextCommand, readonly string[]>> = Object.freeze({
	undo: ['Cmd+Z'],
	redo: ['Cmd+Shift+Z', 'Cmd+Y'],
	paragraph: ['Cmd+Alt+0'],
	h1: ['Cmd+Alt+1'],
	h2: ['Cmd+Alt+2'],
	h3: ['Cmd+Alt+3'],
	'bullet-list': ['Cmd+Shift+8'],
	'numbered-list': ['Cmd+Shift+7'],
	quote: [],
	'code-block': [],
	bold: ['Cmd+B'],
	italic: ['Cmd+I'],
	underline: ['Cmd+U'],
	strikethrough: ['Cmd+Shift+X'],
	'inline-code': ['Cmd+E'],
	subscript: [],
	superscript: [],
	link: ['Cmd+K'],
	'text-color': [],
	'highlight-color': [],
	'clear-formatting': ['Cmd+\\'],
	'align-left': [],
	'align-center': [],
	'align-right': [],
	'align-justify': [],
	outdent: ['Cmd+['],
	indent: ['Cmd+]'],
	hr: [],
	picture: [],
	toolbar: ['Alt+F10']
});

/** A color of the text, or the ground behind it. */
export type ColorKind = 'text' | 'highlight';

/** A content color: a hex value as "#rrggbb", and its name, which a screen reader reads. */
export type ColorSwatch = { hex: string; name: string };

/**
 * A part of the words of the field: from the place `from` to the place `to`, each [line, offset] with
 * the line of words() from 0 and the offset in UTF-16 code units, and `text`, the words between them with
 * the lines joined by "\n". It is the selection that a page reads, such as the words that a request is for.
 */
export type TextRange = { from: [number, number]; to: [number, number]; text: string };

// ---- The writing tools (### rich-text-field in DESIGN.md, "Writing tools")

/** A writing tool: a check of the words, a rewrite in a mode, an instruction of the person, or a new structure of the same words. */
export type WritingKind = 'check' | 'rewrite' | 'instruction' | 'structure';

/**
 * A request of the writing tools to the service of the product. `html` is the content through the load
 * list, `words` is its words(), and `scope` is the selected words that a rewrite or an instruction is for,
 * or null for the whole text. `mode` is the id of the mode of a rewrite, and `instruction` the words of
 * the person.
 */
export type WritingRequest = {
	kind: WritingKind;
	html: string;
	words: string;
	scope: TextRange | null;
	mode?: string | undefined;
	instruction?: string | undefined;
};

/**
 * A change to the words that the service proposes: in the line `block` of words(), from 0, the words
 * `old` become `new`. `old` stands exactly once in its line. `rule` names the rule, such as "Spelling",
 * and `reason` says why in one sentence. The field numbers the changes from 1, in the order of the text.
 */
export type WritingChange = { block: number; old: string; new: string; rule: string; reason: string };

/**
 * The result of a request: changes to the words, or a whole text, such as a new layout. `title` says
 * what a whole text is, such as "A new layout", and `note` is one sentence of the service, such as why it
 * changed nothing. The field computes the diff of a whole text.
 */
export type WritingResult =
	| { kind: 'changes'; changes: readonly WritingChange[]; note?: string | undefined }
	| { kind: 'text'; html: string; title?: string | undefined; note?: string | undefined };

/** A mode of Rewrite: the id that the request carries, the label of the menu, and the group of the menu, such as "Tone". */
export type WritingMode = { id: string; label: string; group?: string | undefined };

/**
 * A decision of the person, for the log of the product: the change `change`, numbered from 1, or the
 * whole text, taken or left. `afterAll` is true for a change that the person left and then took after all.
 */
export type WritingDecision = { request: WritingRequest; change: number | 'text'; taken: boolean; afterAll?: boolean | undefined };

/**
 * The words of the diff of a whole text, as the words of the same names of ### diff: what a screen reader
 * says before a line and before a mark, the names of the two versions, the buttons to the previous and the
 * next change, and the place of a change, such as "Change 2 of 5". inserted and deleted take the words of
 * the same names of WritingWords unless this gives its own.
 */
export type WritingDiffWords = {
	added?: string;
	removed?: string;
	inserted?: string;
	deleted?: string;
	insertedBreak?: string;
	deletedBreak?: string;
	insertedItem?: string;
	insertedHeading?: string;
	oldVersion?: string;
	newVersion?: string;
	previous?: string;
	next?: string;
	position?: (at: number, of: number) => string;
};

/** The words of the writing tools, in the language of the product. */
export type WritingWords = {
	/** The name of the group of the tools at the end of the toolbar. */
	tools: string;
	check: string;
	rewrite: string;
	structure: string;
	/** The tooltip of Structure. */
	structureHint: string;
	/** The words of the busy button while a request of each kind runs, such as "Checking". */
	running: Readonly<Record<WritingKind, string>>;
	stop: string;
	/** The first row of the menu of Rewrite. */
	forSelection: string;
	forWhole: string;
	/** Why a tool cannot run. */
	wait: string;
	empty: string;
	readonly: string;
	decideFirst: string;
	/** The instruction row. */
	instruction: string;
	instructionPlaceholder: string;
	send: string;
	sendKey: string;
	instructionEmpty: string;
	onlySelected: string;
	clearScope: string;
	/** The request bar. */
	locked: string;
	asked: (by: string, at: string) => string;
	stopped: string;
	nothing: string;
	count: (n: number) => string;
	textChanged: string;
	waiting: (open: number, old: number) => string;
	decided: (taken: number, left: number) => string;
	takeOrLeave: string;
	oldHint: string;
	proposalHint: string;
	/** The title of a whole text that the service gives with no title, by the kind of the request. */
	title: Readonly<Record<WritingKind, string>>;
	/** The key of the two tints of a whole text, and the words that a screen reader says before a mark of a change. */
	inserted: string;
	deleted: string;
	/** The words of the diff of a whole text. */
	diff: WritingDiffWords;
	/**
	 * The words of a picture in a line of the diff of a whole text: its number among the picture addresses
	 * of the two texts, and its alt text, such as "[Picture 1: A plan of the room]".
	 */
	picture: (n: number, alt: string) => string;
	/** The words of a divider in the diff of a whole text, a line of its own, such as "[Divider]". */
	divider: string;
	/** The words of the address of a link in the diff of a whole text, after the words of the link, such as "<https://example.com/>". */
	address: (href: string) => string;
	takeAll: string;
	leaveAll: string;
	takeAllReadonly: string;
	/** The rows of the changes. */
	change: (n: number) => string;
	take: string;
	leave: string;
	takeChange: (n: number) => string;
	leaveChange: (n: number) => string;
	old: string;
	oldReason: string;
	lockedReason: string;
	leftOut: string;
	takeAfterAll: string;
	takeAfterAllChange: (n: number) => string;
};

/**
 * The writing tools of a field. The product gives the service, run(), and STACK owns the rest: the
 * states, the words, the numbering of the changes, the state of each change and the diff of a whole
 * text. run() takes the request and a signal that aborts on Stop and when the field goes, and gives the
 * result or rejects; a rejection reaches onfailure with the kind writing.
 */
export type RichTextWriting = {
	run: (request: WritingRequest, signal: AbortSignal) => Promise<WritingResult>;
	/** The tools that show: each kind by default. Rewrite shows only with modes. */
	tools?: readonly WritingKind[] | undefined;
	/** The modes of Rewrite, in the order of the menu. */
	modes?: readonly WritingMode[] | undefined;
	/** The name of the source in the proposal badge, such as "Suggestions". */
	source?: string | undefined;
	/**
	 * A request that this view did not start, such as one that another person asked for, with its result. A
	 * new one waits while a request runs, a whole text waits or a change is open, and undefined ends a
	 * request or a result that came from a pending.
	 */
	pending?: { kind: WritingKind; asked?: { by: string; at: string } | undefined; result: Promise<WritingResult> | WritingResult } | undefined;
	/** Each decision of the person, for the log of the product. The field made a taken change already. */
	ondecide?: ((decision: WritingDecision) => void) | undefined;
	words?: Partial<WritingWords> | undefined;
};

// ---- The slash menu (### rich-text-field in DESIGN.md, "The slash menu")

/** A block command of the slash menu: the tool of the same id. The menu shows each one that the preset holds. */
export type SlashCommand = 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet-list' | 'numbered-list' | 'quote' | 'code-block' | 'hr' | 'picture';

/** The words of the slash menu, in the language of the product. */
export type SlashWords = {
	/** The name of the list of the commands, such as "Commands". */
	label: string;
	/** The line of a filter that no command matches, such as "No command matches." */
	empty: string;
	/** The name of each command, such as "Heading 1". The filter matches these words. */
	commands: Readonly<Record<SlashCommand, string>>;
};

/** The options of the slash menu of a field: `words` gives its words, and each word that it leaves out keeps the English word. */
export type RichTextSlash = { words?: Partial<SlashWords> | undefined };

// ---- The quote of a reply (### rich-text-field in DESIGN.md, "A reply to a mail")

/** The words of the quote of a field, in the language of the product. */
export type QuoteWords = {
	/** The button that opens the folded quote, such as "Show the quoted text". */
	show: string;
	/** The same button while the quote is open, such as "Hide the quoted text". */
	hide: string;
	/** The button in the open quote that moves the quote into the text, such as "Edit the quoted text". */
	edit: string;
	/** Why that button cannot act, as a sentence: while the text is read-only, while a request of the writing tools runs, and while no engine is loaded. */
	readonly: string;
};

/**
 * The quoted earlier mail under the words of a reply. It stands under the text and outside it, folded,
 * so it is not in html(), words(), the undo history or a request of the writing tools until the person
 * moves it into the text. `line` is the line before the quote, in the words and the date format of the
 * product, such as "On 12 Nov 2026, Ana Turner wrote:". `body` holds the paragraphs of the earlier mail
 * as text, in the form of `body` of a Mail: a blank line ends a paragraph, and a single line break stays
 * in it as "\n". The field shows each paragraph as text and never as HTML. `lang` and `dir` are the
 * language and the direction of the earlier mail, `dir` `auto` by default. `words` gives the words of the
 * buttons, and each word that it leaves out keeps the English word.
 */
export type RichTextQuote = {
	line: string;
	body: readonly string[];
	lang?: string | undefined;
	dir?: 'ltr' | 'rtl' | 'auto' | undefined;
	words?: Partial<QuoteWords> | undefined;
};

/** A picture that the page stored: its address, and the size of its file in px. */
export type StoredPicture = { src: string; width: number; height: number };

/**
 * The paper of a field or a view: its ground, its ink and the color of a link, each a CSS color, such as
 * "#fdf6e3". Each value takes the place of its role (rich-text-paper, rich-text-ink, rich-text-link) for that
 * part only, and a value that the page leaves out keeps its role.
 */
export type RichTextPaper = { paper?: string | undefined; ink?: string | undefined; link?: string | undefined };

/**
 * A text of the content on its paper, with its WCAG 2.2 ratio: the ink, the link, the ink at 70% of the
 * placeholder and a quote (muted), and the ink on the ground of code (code).
 */
export type PaperPair = { pair: 'ink' | 'link' | 'muted' | 'code'; ratio: number };

/**
 * A failure that the field reports to the page through onfailure:
 * - `load`: a chunk of the field did not load, such as the engine after a deploy, or the field itself in
 *   RichTextInPlace (`field`);
 * - `picture-type`: files of a drop or of the chooser that are no PNG, JPEG, GIF or WebP picture;
 * - `upload`: upload rejected for the file;
 * - `picture-address`: the field does not keep the stored picture at that address (the picture test);
 * - `picture-locked`: the text locked while the picture went up, such as for a request of the writing
 *   tools, so the stored picture did not go in;
 * - `writing`: run() of the writing tools rejected, or a pending result rejected, for the request;
 * - `paper`: a text of the content reads under 4.5:1 on the paper that the page gave, each such pair as
 *   paperContrast() gives it;
 * - `save`: onsave of RichTextInPlace rejected, so the part keeps the draft.
 */
export type RichTextFailure =
	| { kind: 'load'; part: 'engine' | 'toolbar' | 'picture' | 'review' | 'field'; error: unknown }
	| { kind: 'writing'; request: WritingRequest; error: unknown }
	| { kind: 'picture-type'; files: readonly File[] }
	| { kind: 'upload'; file: File; error: unknown }
	| { kind: 'picture-address'; src: string }
	| { kind: 'picture-locked'; file: File; picture: StoredPicture }
	| { kind: 'paper'; pairs: readonly PaperPair[] }
	| { kind: 'save'; error: unknown };

/** Takes a failure of the field, and gives the words of a line in the field, or undefined for no line. */
export type OnFailure = (failure: RichTextFailure) => string | undefined;

/** The words of RichTextInPlace, in the language of the product. */
export type RichTextInPlaceWords = {
	/** The ghost button that opens the field, such as "Edit". */
	edit: string;
	save: string;
	cancel: string;
	/** The alert dialog of Cancel while the draft holds changes: its title, its description and its two buttons. */
	discardTitle: string;
	discardText: string;
	keep: string;
	discard: string;
};

/** What a page reads from the field (bind:editor), once the engine has loaded; null until then. */
export type RichTextEditor = {
	focus(): void;
	/** Sets the content through the load list, with a new undo history. It fires no onchange, and it ends the request and the result of the writing tools. */
	load(html: string): void;
	/** The HTML of the content, through the load list. */
	html(): string;
	/** The words: each line of the text on a line of its own. A change and a range count these lines. */
	words(): string;
	/** The last selection in the text as a part of words(), or null after a caret. */
	selection(): TextRange | null;
};

// ---- Content colors

/** The one form of a content color: "#rrggbb", in lower case. A tool writes no other form. */
export const HEX = /^#[0-9a-f]{6}$/;

/**
 * The ground and the ink of content: the fallbacks of the roles rich-text-paper and rich-text-ink. The
 * color picker takes them until it reads the two roles of the page, such as in the HTML of the server.
 */
export const CONTENT_PAPER = '#ffffff';
export const CONTENT_INK = '#0a0a0a';

/** The text colors: each reads at 4.5:1 or more on rich-text-paper, in each theme and mode. */
export const TEXT_COLORS: readonly ColorSwatch[] = [
	{ hex: '#000000', name: 'Black' },
	{ hex: '#374151', name: 'Dark gray' },
	{ hex: '#6b7280', name: 'Gray' },
	{ hex: '#b91c1c', name: 'Red' },
	{ hex: '#c2410c', name: 'Orange' },
	{ hex: '#a16207', name: 'Dark yellow' },
	{ hex: '#15803d', name: 'Green' },
	{ hex: '#0f766e', name: 'Teal' },
	{ hex: '#1d4ed8', name: 'Blue' },
	{ hex: '#4338ca', name: 'Blue violet' },
	{ hex: '#6d28d9', name: 'Violet' },
	{ hex: '#a21caf', name: 'Purple' },
	{ hex: '#be185d', name: 'Pink' },
	{ hex: '#7f1d1d', name: 'Dark red' },
	{ hex: '#14532d', name: 'Dark green' },
	{ hex: '#1e3a8a', name: 'Dark blue' }
];

/** The highlights: rich-text-ink reads at 4.5:1 or more on each, in each theme and mode. */
export const HIGHLIGHT_COLORS: readonly ColorSwatch[] = [
	{ hex: '#fef08a', name: 'Yellow' },
	{ hex: '#fde68a', name: 'Amber' },
	{ hex: '#fed7aa', name: 'Orange' },
	{ hex: '#fecaca', name: 'Red' },
	{ hex: '#fbcfe8', name: 'Pink' },
	{ hex: '#e9d5ff', name: 'Purple' },
	{ hex: '#c7d2fe', name: 'Periwinkle' },
	{ hex: '#bfdbfe', name: 'Blue' },
	{ hex: '#a5f3fc', name: 'Cyan' },
	{ hex: '#99f6e4', name: 'Teal' },
	{ hex: '#bbf7d0', name: 'Green' },
	{ hex: '#d9f99d', name: 'Lime' },
	{ hex: '#e5e7eb', name: 'Gray' },
	{ hex: '#f3f4f6', name: 'Light gray' },
	{ hex: '#fef9c3', name: 'Light yellow' },
	{ hex: '#dcfce7', name: 'Light green' }
];

/** A hex value that a person typed, with or without "#", in 3 or 6 digits, as "#rrggbb"; else null. */
export function parseHex(text: string): string | null {
	const s = text.trim().replace(/^#/, '').toLowerCase();
	if (/^[0-9a-f]{3}$/.test(s)) return `#${[...s].map((c) => c + c).join('')}`;
	return /^[0-9a-f]{6}$/.test(s) ? `#${s}` : null;
}

/** A color of a style as "#rrggbb", or null: the browser gives "rgb(185, 28, 28)" for "#b91c1c". */
export function toHex(css: string): string | null {
	const lower = css.trim().toLowerCase();
	if (HEX.test(lower)) return lower;
	const m = /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})\s*(?:[,/]\s*1(?:\.0+)?\s*)?\)$/.exec(lower);
	if (!m) return null;
	const parts = m.slice(1, 4).map(Number);
	if (parts.some((v) => v > 255)) return null;
	return `#${parts.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** The WCAG 2.2 contrast ratio of two "#rrggbb" colors. */
export { contrastRatio } from '#lib/rich-text/contrast.js';

/**
 * The contrast of each text of a paper on it, as the field and the view read it: the ink, the link, the
 * ink at 70% of the placeholder and a quote (muted), and the ink on the ground of code (code). A value that
 * the page leaves out keeps its role, and a color with alpha reads over the ground of the page. It needs a
 * DOM, so a page calls it in the browser, such as before it gives a paper that a person picked. A color
 * that the browser cannot paint gives no pair.
 */
export function paperContrast(p: RichTextPaper): PaperPair[] {
	const probe = document.createElement('span');
	probe.className = PROBE;
	probe.setAttribute('aria-hidden', 'true');
	for (const [role, color] of Object.entries(p)) if (color) probe.style.setProperty(`--rich-text-${role}`, color);
	document.body.append(probe);
	try {
		const colors = readPaper(probe, document.body);
		return colors ? pairsOf(colors) : [];
	} finally {
		probe.remove();
	}
}

// ---- The sanitizer

/** Which list cleans the HTML: `load` for HTML that a page sets or reads, `paste` for HTML from outside. */
export type RichTextList = 'load' | 'paste';

export type SanitizeOptions = {
	/** `load` by default. */
	list?: RichTextList | undefined;
	/** `full` by default. */
	preset?: RichTextPreset | undefined;
	/**
	 * True for each picture address that the load list keeps. By default defaultPicture: only the data address
	 * of a PNG, JPEG, GIF or WebP picture. A page that shows pictures from a host passes a test that keeps
	 * the addresses of the hosts that the product names only, because an image loads only from those hosts.
	 */
	picture?: ((src: string) => boolean) | undefined;
};

/** The schemes that a link keeps. */
export const LINK = /^(?:https?|mailto):/i;

/**
 * The default test of a picture address: only the base64 data address of a PNG, JPEG, GIF or WebP picture.
 * It keeps no host, because an image loads only from the hosts that the product names. A page that shows
 * pictures from such a host passes `picture`.
 */
export function defaultPicture(src: string): boolean {
	return /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/]+=*$/i.test(src);
}

const HTML_NS = 'http://www.w3.org/1999/xhtml';
/** Elements whose content goes with them: code, a document head, a form control and embedded content. */
const DROP = new Set([
	'script', 'style', 'template', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'head', 'title', 'meta', 'link', 'base',
	'noscript', 'noembed', 'noframes', 'textarea', 'select', 'option', 'optgroup', 'button', 'input', 'audio', 'video', 'canvas', 'map',
	'xmp', 'plaintext', 'dialog', 'param', 'source', 'track', 'datalist', 'output', 'progress', 'meter'
]);
/** Elements that end a line. Any other element is inline, and only its content counts. */
const BLOCK = new Set([
	'address', 'article', 'aside', 'blockquote', 'body', 'caption', 'center', 'dd', 'details', 'div', 'dl', 'dt', 'fieldset', 'figcaption',
	'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre',
	'section', 'summary', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul'
]);
/** The inline tags that each list writes, by the tag that comes in. */
const MARK_TAG: Readonly<Record<string, string>> = {
	b: 'b', strong: 'b', i: 'i', em: 'i', u: 'u', ins: 'u', s: 's', strike: 's', del: 's', sub: 'sub', sup: 'sup', code: 'code', kbd: 'code', tt: 'code'
};
const SIMPLE_MARKS = new Set(['b', 'i', 'u']);
/** The class names that Squire writes on a span of a color, and on an aligned line. */
const ALIGN = new Set(['left', 'center', 'right', 'justify']);

type Mark = { tag: string; attrs: readonly (readonly [string, string])[] };
type Host = { el: HTMLElement; chain: { mark: Mark; el: HTMLElement }[] };
type Kind = { list: RichTextList; simple: boolean; picture: (src: string) => boolean };


/**
 * The document where the copy is built and each style is read. It has no browsing context, so a picture
 * that the copy makes does not load, and a style of the input applies nowhere.
 */
let inert: Document | null = null;
let reader: HTMLElement | null = null;

function inertDocument(): Document {
	inert ??= document.implementation.createHTMLDocument('');
	return inert;
}

function styleOf(el: Element): CSSStyleDeclaration | null {
	const text = el.getAttribute('style');
	if (!text) return null;
	reader ??= inertDocument().createElement('span');
	reader.setAttribute('style', text);
	return reader.style;
}

const isElement = (n: Node): n is Element => n.nodeType === 1;
const isHtml = (n: Node): n is Element => isElement(n) && n.namespaceURI === HTML_NS;

/** The marks that a style gives, for the paste list: a page or a word processor writes bold as a style. */
function styleMarks(el: Element): string[] {
	const s = styleOf(el);
	if (!s) return [];
	const out: string[] = [];
	const weight = s.fontWeight;
	if (weight === 'bold' || weight === 'bolder' || Number(weight) >= 600) out.push('b');
	if (s.fontStyle === 'italic' || s.fontStyle === 'oblique') out.push('i');
	const line = `${s.textDecorationLine} ${s.textDecoration}`;
	if (/underline/.test(line)) out.push('u');
	if (/line-through/.test(line)) out.push('s');
	if (s.verticalAlign === 'super') out.push('sup');
	if (s.verticalAlign === 'sub') out.push('sub');
	return out;
}

/** True when a style of the element keeps the line ends of its text. */
function keepsLines(el: Element): boolean {
	return /^(?:pre|pre-wrap|pre-line|break-spaces)$/.test(styleOf(el)?.whiteSpace ?? '');
}

/** A width or a height of a picture: a whole number of px. */
const SIZE = /^\d{1,4}$/;

/** The attributes of a kept element that the list keeps, each value tested. */
function keptAttributes(src: Element, tag: string, kind: Kind): [string, string][] {
	const out: [string, string][] = [];
	if (tag === 'a') {
		const href = (src.getAttribute('href') ?? '').trim();
		// A browser drops tabs and line ends inside an address, so "java\nscript:" is "javascript:".
		if (LINK.test(href.replace(/[\u0000- \u007f]/g, ''))) out.push(['href', href]);
		return out;
	}
	if (kind.list === 'paste' || kind.simple) return out;
	if (tag === 'span') {
		const s = styleOf(src);
		const color = src.classList.contains('color') && s ? toHex(s.color) : null;
		const ground = src.classList.contains('highlight') && s ? toHex(s.backgroundColor) : null;
		if (color) out.push(['class', 'color'], ['style', `color:${color}`]);
		else if (ground) out.push(['class', 'highlight'], ['style', `background-color:${ground}`]);
	}
	// The mark of a quoted earlier mail: type="cite" in any case, written as cite. No other attribute of a quote stays, also not cite, which holds an address.
	if (tag === 'blockquote' && (src.getAttribute('type') ?? '').toLowerCase() === 'cite') out.push(['type', 'cite']);
	if (/^(?:div|p|h[1-3]|li)$/.test(tag)) {
		const align = [...src.classList].map((c) => c.replace(/^align-/, '')).find((c) => ALIGN.has(c));
		if (align) out.push(['class', `align-${align}`], ['style', `text-align:${align}`]);
	}
	return out;
}

function sibling(n: Node, next: boolean): Element | null {
	let p = next ? n.nextSibling : n.previousSibling;
	while (p && !isElement(p) && !(p.textContent ?? '').trim()) p = next ? p.nextSibling : p.previousSibling;
	return p && isElement(p) ? p : null;
}

/**
 * Turns each run of list paragraphs of a word processor (a p with mso-list in its style) into a list,
 * before the copy. The level of a paragraph gives its depth, and a marker that is a number or a letter
 * makes the list numbered. The marker, a span with mso-list:Ignore, goes.
 */
function wordLists(root: DocumentFragment) {
	const isItem = (n: Node | null): n is Element => !!n && isElement(n) && n.localName === 'p' && /mso-list\s*:\s*l\d+/i.test(n.getAttribute('style') ?? '');
	for (const first of [...root.querySelectorAll('p')]) {
		if (!first.parentNode || !isItem(first) || isItem(sibling(first, false))) continue;
		const doc = first.ownerDocument;
		const anchor = doc.createElement('div');
		first.before(anchor);
		const stack: { list: Element; level: number }[] = [];
		let at: Element | null = first;
		while (isItem(at)) {
			const p: Element = at;
			at = sibling(p, true);
			const level = Number(/level(\d+)/i.exec(p.getAttribute('style') ?? '')?.[1] ?? '1');
			const marker = [...p.querySelectorAll('span')].find((s) => /mso-list\s*:\s*ignore/i.test(s.getAttribute('style') ?? ''));
			const numbered = /^\s*(?:\d+|[a-z]{1,4})[.)]/i.test(marker?.textContent ?? '');
			marker?.remove();
			while ((stack.at(-1)?.level ?? 0) > level) stack.pop();
			let top = stack.at(-1);
			if (!top || top.level < level) {
				const list = doc.createElement(numbered ? 'ol' : 'ul');
				(top?.list.lastElementChild ?? anchor).append(list);
				top = { list, level };
				stack.push(top);
			}
			const li = doc.createElement('li');
			li.append(...p.childNodes);
			top.list.append(li);
			p.remove();
		}
		anchor.replaceWith(...anchor.childNodes);
	}
}

/** A structure whose content is text and marks only: no block goes into it. */
const TEXT_HOST = /^(?:LI|H[1-3]|PRE)$/;
const LIST = /^(?:UL|OL)$/;

/**
 * The copy. A container that holds blocks, the top of the output or a quote, takes each run of inline
 * content as a line, a div. A list holds items only, an item holds inline content and lists, and a
 * heading and a code block hold inline content only. An inline element around blocks, such as a link
 * around a card, goes around each line that it reaches, because each line makes the marks again.
 */
class Builder {
	readonly doc: Document;
	readonly out: DocumentFragment;
	private readonly kind: Kind;
	private readonly marks: Mark[] = [];
	/** The structure that takes the next block: the top, a quote, a list or an item. */
	private container: HTMLElement | DocumentFragment;
	/** The element that takes the next inline content; null until content comes. */
	private host: Host | null = null;
	/** A line break waits before the next content of the host, as between two lines of an item. */
	private gap = false;
	private pre = 0;

	constructor(kind: Kind) {
		this.kind = kind;
		this.doc = inertDocument();
		this.out = this.doc.createDocumentFragment();
		this.container = this.out;
	}

	private make(tag: string, attrs: readonly (readonly [string, string])[] = []): HTMLElement {
		const el = this.doc.createElement(tag);
		for (const [name, value] of attrs) el.setAttribute(name, value);
		return el;
	}

	private name(): string {
		return this.container instanceof Element ? this.container.nodeName : '';
	}

	/** Ends the open line, so that the next inline content starts a new one. */
	private endLine() {
		this.host = null;
		this.gap = false;
	}

	/** The host of inline content: the open line, a new line, a new item of a list, or the item or heading itself. */
	private hostOf(): Host {
		if (this.host) return this.host;
		const c = this.container;
		let el: HTMLElement;
		if (c instanceof HTMLElement && TEXT_HOST.test(c.nodeName)) el = c;
		else {
			el = this.make(c instanceof HTMLElement && LIST.test(c.nodeName) ? 'li' : 'div');
			c.append(el);
		}
		this.host = { el, chain: [] };
		return this.host;
	}

	/** Appends inline content under the open marks, and makes each mark that the host lacks. */
	private put(node: Node) {
		const host = this.hostOf();
		const gap = this.gap && host.el.childNodes.length > 0;
		this.gap = false;
		if (host.el.nodeName === 'PRE') {
			if (gap) host.el.append(this.doc.createTextNode('\n'));
			if (node.nodeType === 3) host.el.append(node);
			return;
		}
		let k = 0;
		while (k < host.chain.length && k < this.marks.length && host.chain[k]?.mark === this.marks[k]) k++;
		host.chain.length = k;
		if (gap) (host.chain.at(-1)?.el ?? host.el).append(this.make('br'));
		for (const mark of this.marks.slice(k)) {
			const el = this.make(mark.tag, mark.attrs);
			(host.chain.at(-1)?.el ?? host.el).append(el);
			host.chain.push({ mark, el });
		}
		(host.chain.at(-1)?.el ?? host.el).append(node);
	}

	/** Opens a structure in the current container, and lets it take the blocks inside it. */
	private within(el: HTMLElement, run: () => void) {
		const c = this.container;
		this.endLine();
		let parent: HTMLElement | DocumentFragment = c;
		// A list in a list stands in an item of its own.
		if (c instanceof HTMLElement && LIST.test(c.nodeName)) {
			parent = this.make('li');
			c.append(parent);
		}
		parent.append(el);
		this.container = el;
		run();
		this.container = c;
		this.endLine();
	}

	text(data: string, lines: boolean) {
		if (this.pre > 0) return this.put(this.doc.createTextNode(data));
		if (!lines) {
			// A line end in HTML is a space, unless a style kept it.
			const text = data.replace(/[\r\n\t]+/g, ' ');
			if (!text || (!this.host && !text.trim())) return;
			return this.put(this.doc.createTextNode(text));
		}
		data.replace(/\r\n?/g, '\n')
			.split('\n')
			.forEach((part, i) => {
				if (i > 0) this.put(this.make('br'));
				if (part) this.put(this.doc.createTextNode(part));
			});
	}

	children(parent: Node, lines: boolean) {
		for (let n = parent.firstChild; n; n = n.nextSibling) this.node(n, lines);
	}

	node(n: Node, lines: boolean) {
		if (n.nodeType === 3) return this.text((n as Text).data, lines);
		if (!isHtml(n)) return;
		const tag = n.localName;
		if (DROP.has(tag)) return;
		const keep = lines || (this.kind.list === 'paste' && keepsLines(n));
		if (tag === 'br') return this.lineBreak(n);
		if (tag === 'img') return this.picture(n);
		if (tag === 'hr') {
			this.endLine();
			if (!this.kind.simple && this.pre === 0 && !TEXT_HOST.test(this.name()) && !LIST.test(this.name())) this.container.append(this.make('hr'));
			return;
		}
		if (BLOCK.has(tag)) return this.block(n, tag, keep);
		return this.inline(n, tag, keep);
	}

	private lineBreak(br: Element) {
		if (this.pre > 0) return this.put(this.doc.createTextNode('\n'));
		const parent = br.parentNode;
		// Only white space and comments follow the last line break of a block. Any other node, such as the
		// text of the next line, keeps the break, so the lines of an item or a heading do not join. A comment
		// shows nothing, such as the end marker of a copy, so the break before it stays the last one.
		let next = br.nextSibling;
		while (next && (next.nodeType === 8 || (next.nodeType === 3 && !(next.textContent ?? '').trim()))) next = next.nextSibling;
		const last = !next && !!parent && isHtml(parent) && BLOCK.has(parent.localName);
		// The last line break of a block ends its line and draws nothing after words. Alone in its line, such
		// as after another line break, it draws an empty last line, so it stays.
		if (last && !this.lineEmpty()) return this.endLine();
		this.put(this.make('br'));
		if (last) this.endLine();
	}

	/** True when the open line shows nothing yet: no line is open, a line break waits, or the line ends with a line break, white space aside. */
	private lineEmpty(): boolean {
		if (!this.host || this.gap) return true;
		let n = (this.host.chain.at(-1)?.el ?? this.host.el).lastChild;
		while (n && n.nodeType === 3 && !(n.textContent ?? '').trim()) n = n.previousSibling;
		return !n || n.nodeName === 'BR';
	}

	private picture(img: Element) {
		const src = (img.getAttribute('src') ?? '').trim();
		if (this.kind.list === 'load' && !this.kind.simple && this.pre === 0 && this.kind.picture(src)) {
			const attrs: [string, string][] = [
				['src', src],
				['alt', img.getAttribute('alt') ?? '']
			];
			for (const size of ['width', 'height']) {
				const v = img.getAttribute(size) ?? '';
				if (SIZE.test(v)) attrs.push([size, v]);
			}
			return this.put(this.make('img', attrs));
		}
		// A picture of a paste becomes its alt text.
		const alt = (img.getAttribute('alt') ?? '').trim();
		if (alt) this.text(alt, false);
	}

	private block(n: Element, tag: string, lines: boolean) {
		const simple = this.kind.simple;
		const at = this.name();
		if (tag === 'tr') {
			// A row of a table is a line, and each cell after the first starts with a space.
			this.endLine();
			let first = true;
			for (const cell of n.children) {
				if (!first) this.text(' ', false);
				first = false;
				this.children(cell, lines);
			}
			return this.endLine();
		}
		const structure = !simple && this.pre === 0 && !/^(?:H[1-3]|PRE)$/.test(at);
		if (structure && (tag === 'ul' || tag === 'ol')) return this.list(n, tag, lines);
		if (structure && !TEXT_HOST.test(at) && !LIST.test(at)) {
			if (tag === 'blockquote') return this.within(this.make('blockquote', keptAttributes(n, tag, this.kind)), () => this.children(n, lines));
			if (tag === 'pre') {
				return this.within(this.make('pre'), () => {
					this.pre++;
					this.children(n, true);
					this.pre--;
				});
			}
			if (/^h[1-3]$/.test(tag)) return this.within(this.make(tag, keptAttributes(n, tag, this.kind)), () => this.children(n, lines));
		}
		// Any other block is a line. In an item, a heading or a code block, its lines join with a line break.
		if (TEXT_HOST.test(at)) {
			if (this.host) this.gap = true;
			this.children(n, lines);
			if (this.host) this.gap = true;
			return;
		}
		this.endLine();
		const attrs = /^(?:div|p)$/.test(tag) ? keptAttributes(n, tag, this.kind) : [];
		if (attrs.length > 0) {
			const line = this.make('div', attrs);
			(LIST.test(at) ? this.hostOf().el : this.container).append(line);
			this.host = { el: line, chain: [] };
		}
		this.children(n, lines);
		this.endLine();
	}

	private list(n: Element, tag: string, lines: boolean) {
		const list = this.make(tag);
		this.within(list, () => {
			for (let child = n.firstChild; child; child = child.nextSibling) {
				if (!isHtml(child) || child.localName !== 'li') {
					this.node(child, lines);
					continue;
				}
				this.endLine();
				const li = this.make('li', keptAttributes(child, 'li', this.kind));
				list.append(li);
				this.container = li;
				this.children(child, lines);
				this.container = list;
				this.endLine();
			}
		});
	}

	private inline(n: Element, tag: string, lines: boolean) {
		const paste = this.kind.list === 'paste';
		const pushed: Mark[] = [];
		const push = (t: string, attrs: readonly (readonly [string, string])[] = []) => {
			if (this.pre > 0 || (this.kind.simple && !SIMPLE_MARKS.has(t))) return;
			if (t !== 'span' && this.marks.some((m) => m.tag === t)) return;
			const mark = { tag: t, attrs };
			this.marks.push(mark);
			pushed.push(mark);
		};
		const mapped = MARK_TAG[tag];
		// A word processor wraps a whole copy in <b style="font-weight:normal">, which is no bold.
		const notBold = paste && (tag === 'b' || tag === 'strong') && /^(?:normal|[1-5]00)$/.test(styleOf(n)?.fontWeight ?? '');
		if (mapped && !notBold) push(mapped);
		if (paste) for (const t of styleMarks(n)) push(t);
		if (tag === 'a' || (tag === 'span' && !paste)) {
			const attrs = keptAttributes(n, tag, this.kind);
			if (attrs.length > 0) push(tag, attrs);
		}
		this.children(n, lines);
		for (const mark of pushed) {
			const i = this.marks.lastIndexOf(mark);
			if (i >= 0) this.marks.splice(i, 1);
		}
	}
}

/** True when the HTML holds no block, also inside an inline element, so that a paste of it joins the line of the caret. */
function inlineOnly(root: ParentNode): boolean {
	for (const n of root.childNodes) {
		if (!isHtml(n) || DROP.has(n.localName)) continue;
		if (BLOCK.has(n.localName) || n.localName === 'br' || !inlineOnly(n)) return false;
	}
	return true;
}

/** The copy of the HTML through a list, in the inert document. */
function build(html: string, options: SanitizeOptions): DocumentFragment {
	const kind: Kind = { list: options.list ?? 'load', simple: options.preset === 'simple', picture: options.picture ?? defaultPicture };
	const template = inertDocument().createElement('template');
	template.innerHTML = html;
	const input = template.content;
	const builder = new Builder(kind);
	if (kind.list === 'paste') {
		wordLists(input);
		// The line break that a browser adds after a copy goes.
		let last = input.lastChild;
		while (last && last.nodeType === 3 && !(last.textContent ?? '').trim()) last = last.previousSibling;
		if (last && isHtml(last) && last.localName === 'br') last.remove();
		if (inlineOnly(input)) {
			builder.children(input, false);
			const line = builder.out.firstChild;
			if (builder.out.childNodes.length === 1 && line instanceof Element && line.nodeName === 'DIV' && line.attributes.length === 0) {
				const inline = builder.doc.createDocumentFragment();
				inline.append(...line.childNodes);
				return inline;
			}
			return builder.out;
		}
	}
	builder.children(input, false);
	return builder.out;
}

/**
 * The HTML through a list, as a fragment of the live document. Squire takes this form, and a page that
 * inserts it with replaceChildren parses no HTML again. It needs a DOM, so a page calls it in the browser.
 */
export function richTextFragment(html: string, options: SanitizeOptions = {}): DocumentFragment {
	return document.importNode(build(html, options), true);
}

/** The HTML through a list, as HTML. Use it for each HTML that a page shows, stores or sends. It needs a DOM, so a page calls it in the browser. */
export function sanitizeRichText(html: string, options: SanitizeOptions = {}): string {
	const box = inertDocument().createElement('div');
	box.append(build(html, options));
	return box.innerHTML;
}
