<!--
	The rich text field of DESIGN.md (### rich-text-field): a text with marks, headings, lists, links, colors
	and pictures, in an input group. Its rows, from the top: the toolbar in the block-start row, the bar of a
	request of the writing tools and of its result, an optional bar of the page, the text, the rows of the
	proposed changes, the instruction row, and optional rows of the page. The smaller parts live in
	preview/src/lib/rich-text/, which no export path names, and share the context of the field
	(rich-text/context.ts). The engine, Squire behind rich-text/engine/engine.ts, the groups of tools, the
	menus, the drawer of More, the forms, the bar over selected text, the picture, the writing tools and the
	diff of a whole text load in chunks of their own, so they stay out of the bundle of each page, and a
	field loads at its mount only what it mounts. With toolbar="none" the field shows no toolbar and loads
	no groups of tools: the keys, the bar over selected text and the forms still work, and the writing
	tools and toolbarEnd do not show, because they stand in the toolbar. The menus load at the mount of the full preset, and in
	the simple preset only when its groups fold into More; the drawer only when they fold below 768 px; the
	forms at the first form; the bar over selected text when a person first uses the full preset; the
	writing tools only when the page gives `writing`; and the diff only at the first whole text. The bars
	and the tooltips mount when a person first uses the field, so a field that nobody uses adds no
	listener to the window or the document.

	- The text is a contenteditable element with role="textbox" and aria-multiline. It takes the reading
	  step from 768 px and 16 px below, so that a phone does not zoom on focus. It has contain: paint and
	  scrolls a wide content inside itself. The page sets each of its attributes through the field, because
	  the engine hears each change of the text and would count it as an input of the person.
	- A field with a color tool keeps its text on the roles rich-text-paper, rich-text-ink and
	  rich-text-link in both modes, because a content color keeps its value in every mode. A link takes
	  rich-text-link. In light the rest of the content keeps the roles of the theme. In dark the paper stays
	  light, so the placeholder, a quote and code take their colors from the ink. With a paper of the page
	  they take them from its ink in both modes. A field with no color tool follows the theme.
	- Each HTML that comes in goes through the lists of @stack-kit/stack/rich-text: the load list for html,
	  editor.load() and editor.html(), and the paste list for a paste or a drop from outside the text.
	- The text and the read view (RichTextView) take the look of the content from rich-text/Content.svelte.
	  When the engine does not load, the view shows the HTML of the person, read only, in the place of the
	  text.
	- Failures: the field writes no failure text of its own. It calls onfailure with each failure, such as
	  an engine that did not load, a picture that did not go up or a weak paper of the page, and shows the
	  words that the function gives in place: a chunk that did not load in a line with role="alert" above
	  the text, any other failure in the status region under it.
	- Read-only: the ink is at 75%, the tools are unavailable, and the group does not dim, because no
	  control is :disabled. A request of the writing tools that runs and a whole text that waits make the
	  text read-only too.
	- Keys: each command has its default keys in RICH_TEXT_KEYS of @stack-kit/stack/rich-text and its id
	  "rich-text.<command>" in architecture/keys.json, and the page can give other keys (keys). The field
	  matches them with the parser of behaviour/keys. When two commands get one key, the move to the toolbar
	  takes it first, then the tool that comes first in the toolbar; the other commands show no key, and in
	  development the field warns once. Cmd+Enter, Cmd+S and every key that no command takes pass to the
	  page, and the browser runs none of them as an edit: for a key that the browser edits with, such as
	  Cmd+B with no Bold, the field stops the edit, so that key reaches the page with its default prevented.
	  Alt+F10 moves to the toolbar, and Tab moves a list item a level in or out; Esc, then Tab, leaves the
	  item. In read-only text, Esc and each key with Cmd or Ctrl pass to the page.
	- Writing tools (writing): the page gives one function, run(request, signal), and the field owns the
	  rest (review/writing.svelte.js): Check, Rewrite with the modes of the page and Structure at the end of
	  the toolbar, the instruction row, the states of a request, Stop, the numbering and the state of each
	  change, and the diff of a whole text. The field marks the words of each open change in the text,
	  outside the content, and shows a row for each under the text; Take makes the change as one undo step.
	  A whole text shows as a diff of kind text with the marks of the blocks in the place of the text, and
	  Take all makes it the content as one undo step. Take all is off with its reason while the text is
	  read-only. A failed request calls onfailure with the kind writing. A new pending never aborts a
	  request of the person and never drops open changes or a waiting whole text, and editor.load() ends
	  the request and the result of the content before it.
	- The focus never falls to the page. A row of a change moves it to the next row (review/Changes.svelte).
	  When Take all, Leave all, a writing tool, Stop or a control of the page in toolbarEnd leaves with the
	  focus, or a whole text hides the text that holds it, the focus goes to Stop while a request runs, else
	  to the first change of the diff of a whole text, or its Take all, else to the first open row of a
	  change, else to the text. Each status region is in the page from the mount of its part, empty.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { OnFailure, RichTextCommand, RichTextEditor, RichTextFailure, RichTextPaper, RichTextPreset, RichTextWriting, StoredPicture, TextRange } from './rich-text.js';

	/** @behaviour escape:kept escape:dismiss escape:deselect tab:list-level tab:to-bar */
	export type RichTextFieldProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'onchange'> & {
		/** The root element of the part, which holds the input group. */
		ref?: HTMLDivElement | null;
		class?: string | undefined;
		/** What the page reads from the field once the engine has loaded; null until then. */
		editor?: RichTextEditor | null;
		/** The tools: `full` by default, or `simple` for bold, italic and underline only. Read once. */
		preset?: RichTextPreset | undefined;
		/**
		 * The toolbar: `full` by default, or `none` for no toolbar. With none the keys, the bar over selected
		 * text and the forms still work, and the writing tools and toolbarEnd do not show. Read once.
		 */
		toolbar?: 'full' | 'none' | undefined;
		/** The first content, read once when the engine has loaded. editor.load() sets another. */
		html?: string | undefined;
		readonly?: boolean | undefined;
		placeholder?: string | undefined;
		invalid?: boolean | undefined;
		required?: boolean | undefined;
		'aria-label'?: string | undefined;
		'aria-labelledby'?: string | undefined;
		'aria-describedby'?: string | undefined;
		/**
		 * True for each picture address that the field keeps. By default defaultPicture of @stack-kit/stack/rich-text,
		 * which keeps only the data address of a PNG, JPEG, GIF or WebP picture. A page that shows pictures from a
		 * host passes a test that keeps the addresses of the hosts that the product names only.
		 */
		picture?: ((src: string) => boolean) | undefined;
		/** Stores a picture and gives the stored picture, or rejects; a rejection reaches onfailure with the kind upload. With none, the field takes no picture. */
		upload?: ((file: File) => Promise<StoredPicture>) | undefined;
		/**
		 * The paper of this field: its ground, its ink and the color of a link, each a CSS color. A value takes the
		 * place of its role for this field only. A field with a paper stands on it, also with no color tool.
		 */
		paper?: RichTextPaper | undefined;
		/**
		 * Takes each failure of the field, such as an engine that did not load or a picture that did not go up.
		 * The field writes no failure text of its own: the words that the function gives show in place, and
		 * undefined shows none.
		 */
		onfailure?: OnFailure | undefined;
		/** The person changed the content. It carries no HTML: read editor.html() when the HTML is needed. */
		onchange?: (() => void) | undefined;
		/** The selection in the text changed. */
		onselection?: ((range: TextRange | null) => void) | undefined;
		/**
		 * The keys of a command, such as the keys that a person chose. undefined keeps the default keys of
		 * RICH_TEXT_KEYS of @stack-kit/stack/rich-text, and [] turns the key of the command off. A key needs
		 * Cmd, Ctrl or Alt, or is a function key; the field drops any other key. The tooltips and the menus
		 * show the first key.
		 */
		keys?: ((command: RichTextCommand) => readonly string[] | undefined) | undefined;
		/**
		 * The writing tools: the service of the page, run(request, signal), and the options of the tools. The
		 * field owns the states, the words, the changes and the diff of a whole text. With none, the field shows
		 * no writing tool, and their chunk does not load.
		 */
		writing?: RichTextWriting | undefined;
		/** The controls of the page at the end of the toolbar, before the writing tools. */
		toolbarEnd?: Snippet | undefined;
		/** A bar of the page between the toolbar and the text. */
		bar?: Snippet | undefined;
		/** Rows of the page under the text. */
		foot?: Snippet | undefined;
	};
</script>

<script lang="ts">
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { onMount, untrack } from 'svelte';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import { cn } from '#lib/utils.js';
	import { dev } from '$app/env';
	import Content from '#lib/rich-text/Content.svelte';
	import { isForm, setField, type FormAnchor, type FormId } from '#lib/rich-text/context.js';
	import type { EditorState, Engine } from '#lib/rich-text/engine/types.js';
	import type PictureType from '#lib/rich-text/picture/Picture.svelte';
	import type { Writing } from '#lib/rich-text/review/writing.svelte.js';
	import type SelectionBarType from '#lib/rich-text/toolbar/SelectionBar.svelte';
	import { forms, menu, selectionBar as selectionBarPart } from '#lib/rich-text/toolbar/parts.js';
	import type FormsType from '#lib/rich-text/toolbar/Forms.svelte';
	import Toolbar from '#lib/rich-text/toolbar/Toolbar.svelte';
	import type ToolsType from '#lib/rich-text/toolbar/Tools.svelte';
	import { PROBE, paperWarning, readPaper, weakPairs } from '#lib/rich-text/paper.js';
	import { tool, type ToolId } from '#lib/rich-text/tools/commands.js';
	import { NATIVE_KEYS, claimKeys, isKey, sharedKeysWarning, usable } from '#lib/rich-text/tools/keys.js';
	import { PRESET_TOOLS, TOOL_ORDER } from '#lib/rich-text/tools/presets.js';
	import RichTextView from './RichTextView.svelte';
	import { RICH_TEXT_KEYS, defaultPicture } from './rich-text.js';

	let {
		editor = $bindable(null),
		preset = 'full',
		toolbar = 'full',
		html = '',
		readonly = false,
		placeholder,
		invalid = false,
		required = false,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby,
		picture = defaultPicture,
		upload,
		paper,
		onfailure,
		onchange,
		onselection,
		keys,
		writing: writingProp,
		toolbarEnd: toolbarEndProp,
		bar,
		foot,
		onfocusin,
		onfocusout,
		onpointerenter,
		class: className,
		ref = $bindable(null),
		...rest
	}: RichTextFieldProps = $props();

	const uid = $props.id();
	const kind = untrack(() => preset);
	/** True for a field with no toolbar (toolbar="none"). */
	const bare = untrack(() => toolbar === 'none');
	/** The writing tools and the controls of the page stand in the toolbar, so a field with no toolbar shows neither. */
	const writing = $derived(bare ? undefined : writingProp);
	const toolbarEnd = $derived(bare ? undefined : toolbarEndProp);
	const tools = $derived(PRESET_TOOLS[kind].filter((id) => id !== 'picture' || upload !== undefined));
	/** A content color keeps its value in every mode, so a field with a color tool or a paper of the page keeps its text on the paper. */
	const onPaper = $derived(paper !== undefined || tools.includes('text-color') || tools.includes('highlight-color'));

	let text = $state<HTMLDivElement | null>(null);
	let host = $state<HTMLDivElement | null>(null);
	let rows = $state<HTMLDivElement | null>(null);
	let chooser = $state<HTMLInputElement | null>(null);
	let toolsPart = $state<ReturnType<typeof ToolsType>>();
	let selectionBar = $state<ReturnType<typeof SelectionBarType>>();
	let engine = $state.raw<Engine | null>(null);
	let editorState = $state.raw<EditorState | null>(null);
	let empty = $state(true);
	let failed = $state(false);
	/** The words of the page for a chunk that did not load, above the text, and for any other failure, in the status region under it. */
	let loadLine = $state<string | null>(null);
	let notice = $state<string | null>(null);

	/** True once the field unmounted: an answer that comes later, such as a chunk that did not load or a stored picture, reaches no page. */
	let gone = false;

	/** Reports a failure to the page, and gives the words of its line, or null for no line. */
	function fail(failure: RichTextFailure): string | null {
		const words = onfailure?.(failure);
		return words ? words : null;
	}
	let pictureOn = $state(false);
	/** The chunk of the groups of tools, the bar over selected text and the chunk of the picture, once they load. */
	let toolbarChunk = $state.raw<typeof import('../rich-text/toolbar/index.js') | null>(null);
	let SelectionBarPart = $state.raw<typeof SelectionBarType | null>(null);
	/** The forms of a field with no toolbar, which mounts them itself once one opens; the toolbar mounts them otherwise. */
	let FormsPart = $state.raw<typeof FormsType | null>(null);
	let PicturePart = $state.raw<typeof PictureType | null>(null);
	/** True from the first focus or pointer in the field: the tooltips and the bars mount then, so a field that nobody uses adds no listener. */
	let armed = $state(false);
	let form = $state<FormId | null>(null);
	let formAt = $state<HTMLElement | FormAnchor | null>(null);
	/** A probe in the text box with the paper, the ink and the link where the text stands. */
	let probe = $state<HTMLSpanElement | null>(null);

	// ---- The writing tools. Their chunk loads only when the page gives writing, and they start once the
	// engine has loaded. They live as long as the page gives writing.
	let review = $state.raw<typeof import('../rich-text/review/index.js') | null>(null);
	let writer = $state.raw<Writing | null>(null);
	const w = $derived(writer?.words);
	const wstate = $derived(writer?.state ?? { kind: 'idle' as const });
	/** True while a whole text of the writing tools waits: its diff takes the place of the text. */
	const proposal = $derived(wstate.kind === 'text');
	/** The tools that show, and none while the page gives no writing, so that no part mounts while the writing tools end. */
	const writingTools = $derived(writing ? (writing.tools ?? review?.WRITING_KINDS ?? []) : []);

	/** The one lock of the field: read-only, a request of the writing tools that runs and a whole text that waits, so the words do not change under them. */
	const locked = $derived(readonly || !!writer?.locks);

	function refresh() {
		if (engine) editorState = engine.state();
	}

	/**
	 * The selected words or the caret in the text, as the place of a form that a key opens in a field with no
	 * toolbar. It reads the place at each call, so the form follows the words when the page scrolls. A caret
	 * in an empty line has an empty rect, and the form then stands at the field.
	 */
	function selectionAnchor(): FormAnchor | null {
		const s = document.getSelection();
		const range = s?.rangeCount ? s.getRangeAt(0).cloneRange() : null;
		if (!range || !text?.contains(range.commonAncestorContainer)) return null;
		return {
			getBoundingClientRect: () => {
				const rect = range.getBoundingClientRect();
				return rect.width === 0 && rect.height === 0 && ref ? ref.getBoundingClientRect() : rect;
			}
		};
	}

	/** Opens the link form or a color picker at the control, or at the tool in the toolbar or More, or at the selection with no toolbar. */
	function openForm(id: FormId, at: HTMLElement | null) {
		const bar = ref?.querySelector('[data-slot=rich-text-toolbar]');
		formAt = at ?? bar?.querySelector<HTMLElement>(`[data-tool="${id}"]`) ?? bar?.querySelector<HTMLElement>('[data-tool="more"]') ?? selectionAnchor() ?? ref;
		form = id;
	}

	/** The one dispatcher of the tools: the toolbar, the bar over selected text and the keys run each tool here. */
	function exec(id: ToolId, at: HTMLElement | null = null) {
		const e = engine;
		if (!e || locked || !tools.includes(id)) return;
		const t = tool(id);
		if (t.kind === 'file') return void chooser?.click();
		if (isForm(id)) return openForm(id, at);
		if (!(t.enabled?.(e.state()) ?? true)) return;
		e.exec(id);
		refresh();
	}

	/** The tools that are on, in the order of the toolbar. */
	const toolOrder = $derived(TOOL_ORDER.filter((id) => tools.includes(id)));
	/**
	 * The keys of each command that is on: the keys of the page, else the default keys, with no key of
	 * characters alone. When two commands get one key, the move to the toolbar takes it first, then the tool
	 * that comes first in the toolbar, and the other commands lose it.
	 */
	const claimed = $derived(claimKeys<RichTextCommand>(bare ? toolOrder : ['toolbar', ...toolOrder], (c) => (keys?.(c) ?? RICH_TEXT_KEYS[c]).filter(usable)));
	function keysOf(command: RichTextCommand): readonly string[] {
		return claimed.keys[command] ?? [];
	}
	// In development, a key that two commands get gives one warning in the console for the field.
	let keysWarned = false;
	$effect(() => {
		const shared = claimed.shared;
		if (!dev || keysWarned || shared.length === 0) return;
		keysWarned = true;
		console.warn(sharedKeysWarning(shared));
	});

	/** The keys of the text. A command of the field takes its key: the move to the toolbar, then the tools in the order of the toolbar. */
	function key(e: KeyboardEvent): boolean {
		if (e.key === 'Escape' && !e.isComposing && selectionBar?.dismiss()) return true;
		const hits = (command: RichTextCommand) => keysOf(command).some((k) => isKey(e, k));
		if (!bare && hits('toolbar')) {
			toolsPart?.focusBar();
			return true;
		}
		if (locked) return false;
		const hit = toolOrder.find(hits);
		if (hit) {
			exec(hit);
			return true;
		}
		// A key that no command takes goes on to the page. The browser runs no edit of its own for it, so a
		// key that the page took from Bold or from Undo does not still format or undo the text.
		if (NATIVE_KEYS.some((k) => isKey(e, k))) e.preventDefault();
		return false;
	}

	/**
	 * Moves the focus to Stop while a request runs. While a whole text waits, it moves the focus to the first
	 * change of its diff, so that a person reads the proposal first, and a key that was meant for the text
	 * or for Stop does not take the whole proposal. A diff with no change gives Take all. Else the focus
	 * goes to the first open row of a change, else to the text.
	 */
	function land() {
		const stop = wstate.kind === 'running' ? ref?.querySelector<HTMLElement>('[data-slot=rich-text-toolbar] [data-action="stop"]') : null;
		// A ReasonButton with its reason puts data-action on the box around the button.
		const takeAll = ref?.querySelector<HTMLElement>('[data-slot=rich-text-request-bar] [data-action="take-all"]');
		const diff = proposal ? (ref?.querySelector<HTMLElement>('[data-slot=diff] [data-change]') ?? (takeAll?.matches('button') ? takeAll : takeAll?.querySelector<HTMLElement>('button'))) : null;
		const next = stop ?? diff ?? rows?.querySelector<HTMLElement>('[data-change]:not([data-left]) button') ?? null;
		if (next) next.focus();
		else engine?.focus();
	}

	/** The focus goes back to the text, or where land() puts it while a whole text hides the text. */
	const back = () => (proposal ? land() : engine?.focus());

	setField({
		get engine() {
			return engine;
		},
		get state() {
			return locked ? null : editorState;
		},
		get locked() {
			return locked;
		},
		preset: kind,
		get tools() {
			return tools;
		},
		textId: `${uid}-text`,
		keysOf,
		get text() {
			return text;
		},
		get host() {
			return host;
		},
		get armed() {
			return armed;
		},
		get form() {
			return form;
		},
		get formAt() {
			return formAt;
		},
		get pictureSelected() {
			return pictureOn;
		},
		exec,
		closeForm: () => (form = null),
		setLink(url) {
			// A form that was open when the lock started writes nothing into the locked text.
			if (locked) return;
			engine?.setLink(url);
			refresh();
		},
		setColor(k, hex) {
			if (locked) return;
			engine?.setColor(k, hex);
			refresh();
		},
		selectPicture: (on) => (pictureOn = on),
		paperColors: () => (probe ? readPaper(probe, host?.parentElement ?? null) : null),
		back,
		loadFailed: toolbarFailed
	});

	// A paper of the page with a text that reads under 4.5:1: a warning in development, and onfailure.
	$effect(() => {
		const p = paper;
		const at = probe;
		if (!p || !at) return;
		void [p.paper, p.ink, p.link];
		untrack(() => {
			// The paper stands on the ground of the input group, under the box of the text.
			const colors = readPaper(at, host?.parentElement ?? null);
			const pairs = colors ? weakPairs(colors) : [];
			if (pairs.length === 0) return;
			if (dev) console.warn(paperWarning('rich text field', pairs, p));
			notice = fail({ kind: 'paper', pairs }) ?? notice;
		});
	});

	/**
	 * The control of the writing tools or of the request bar that takes the place of `h`: a ReasonButton
	 * makes a new element when its reason comes or goes, such as when the page makes the text read-only.
	 */
	function same(h: Element): HTMLElement | null {
		const box = h.closest<HTMLElement>('[data-tool], [data-action]');
		const key = box?.dataset.tool ? `[data-tool="${box.dataset.tool}"]` : box?.dataset.action ? `[data-action="${box.dataset.action}"]` : null;
		const el = key ? ref?.querySelector<HTMLElement>(`:is([data-slot=rich-text-writing-tools], [data-slot=rich-text-request-bar]) ${key}`) : null;
		return el?.matches('button') ? el : (el?.querySelector<HTMLElement>('button') ?? null);
	}

	// The control of the field that held the focus last. When it leaves the page and the focus falls, such
	// as Take all, Leave all, a writing tool or Stop, or when a whole text hides the text that holds it,
	// land() moves the focus. When only a reason came or went, the focus goes to the control that took its
	// place. A row of a change moves the focus itself, so its buttons stay out. A line of a diff carries
	// data-change too, and it is no row: a line of a unified diff and a row of a split diff carry data-line.
	let held: Element | null = null;
	let seen: unknown = null;
	$effect(() => {
		const s = wstate;
		void toolsOff;
		void takeAllOff;
		untrack(() => {
			const moved = s !== seen;
			seen = s;
			const h = held;
			if (!h) return;
			const row = !!h.closest('[data-change]') && !h.closest('[data-slot=diff], [data-line]');
			const away = !h.isConnected || (!!proposal && !!host?.contains(h));
			// A hidden element can hold the focus until the browser draws the page again.
			const fell = document.activeElement === null || document.activeElement === document.body || document.activeElement === h;
			if (row || !away || !fell) return;
			held = null;
			const next = moved ? null : same(h);
			if (next) next.focus();
			else land();
		});
	});

	// ---- Pictures. Each file goes up in its order, and goes in at the caret at most the line wide.
	let adding = $state(0);
	const PICTURE = /^image\/(?:png|jpeg|gif|webp)$/;

	function lineWidth(): number {
		if (!text) return 0;
		const style = getComputedStyle(text);
		return text.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
	}

	async function addPictures(files: File[]) {
		const store = upload;
		if (!store || locked) return;
		const pictures = files.filter((f) => PICTURE.test(f.type));
		const others = files.filter((f) => !PICTURE.test(f.type));
		notice = others.length > 0 ? fail({ kind: 'picture-type', files: others }) : null;
		for (const file of pictures) {
			adding++;
			let stored: StoredPicture;
			try {
				stored = await store(file);
			} catch (error: unknown) {
				adding--;
				if (!gone) notice = fail({ kind: 'upload', file, error });
				continue;
			}
			adding--;
			if (gone) return;
			// The text can lock while the picture goes up, such as for a request of the writing tools.
			if (locked) {
				notice = fail({ kind: 'picture-locked', file, picture: stored });
				continue;
			}
			const w = Math.min(stored.width, Math.max(32, lineWidth()));
			const h = stored.width > 0 ? Math.round((stored.height * w) / stored.width) : stored.height;
			if (!engine?.insertPicture(stored.src, w, h)) notice = fail({ kind: 'picture-address', src: stored.src });
		}
	}

	function chosen(e: Event & { currentTarget: HTMLInputElement }) {
		const files = [...(e.currentTarget.files ?? [])];
		// The same file can be chosen again.
		e.currentTarget.value = '';
		void addPictures(files);
	}

	/** A chunk of the toolbar did not load: the groups of tools, a menu, the drawer of More, the forms or the bar over selected text. */
	function toolbarFailed(error: unknown) {
		console.error('The rich text field did not load its toolbar:', error);
		if (!gone) loadLine = fail({ kind: 'load', part: 'toolbar', error }) ?? loadLine;
	}

	onMount(() => {
		let live: Engine | undefined;
		// The groups of tools, in a chunk of their own beside the engine. The full preset shows its menus at
		// the mount, so their chunk loads before the groups show; the simple preset has none until its groups
		// fold. A field with no toolbar loads neither.
		if (!bare)
			import('../rich-text/toolbar/index.js')
				.then(async (chunk) => {
					if (kind === 'full') await menu.load();
					if (!gone) toolbarChunk = chunk;
				})
				.catch(toolbarFailed);
		import('../rich-text/engine/engine.js')
			.then(({ createEngine }) => {
				if (gone || !text) return;
				live = createEngine(text, { preset: kind, picture });
				const e = live;
				const settle = () => {
					empty = e.empty();
					writer?.locate();
					refresh();
				};
				e.on('change', () => {
					settle();
					onchange?.();
				});
				e.on('state', refresh);
				e.on('selection', () => {
					const range = e.selection();
					writer?.setScope(range);
					onselection?.(range);
				});
				e.onKey(key);
				e.onFiles((files) => void addPictures(files));
				e.load(untrack(() => html));
				engine = e;
				settle();
				editor = {
					focus: () => e.focus(),
					load: (next) => {
						// Another content ends the request and the result of the writing tools for the content before it.
						writer?.reset();
						e.load(next);
						settle();
					},
					html: () => e.html(),
					words: () => e.words(),
					selection: () => e.selection()
				};
			})
			.catch((error: unknown) => {
				// Such as a chunk of an earlier build after a deploy: the field says so, and a reload loads the new build.
				console.error('The rich text field did not load its engine:', error);
				live?.destroy();
				live = undefined;
				if (gone) return;
				failed = true;
				loadLine = fail({ kind: 'load', part: 'engine', error }) ?? loadLine;
			});
		return () => {
			gone = true;
			writer?.destroy();
			writer = null;
			live?.destroy();
			engine = null;
			editor = null;
		};
	});

	// The review chunk loads when the page first gives writing.
	let reviewLoading = false;
	$effect(() => {
		if (!writing || reviewLoading) return;
		reviewLoading = true;
		import('../rich-text/review/index.js')
			.then((chunk) => {
				if (!gone) review = chunk;
			})
			.catch((error: unknown) => {
				console.error('The rich text field did not load its writing tools:', error);
				if (!gone) loadLine = fail({ kind: 'load', part: 'review', error }) ?? loadLine;
			});
	});

	// The writing tools start when their chunk and the engine have loaded, and end when the page takes
	// writing away: the request that runs then aborts.
	$effect(() => {
		const on = !!writing;
		const e = engine;
		const chunk = review;
		untrack(() => {
			if (on && e && chunk && !writer)
				writer = chunk.createWriting(e, () => writing ?? { run: () => Promise.reject(new Error('The page took writing away.')) }, fail, {
					preset: kind,
					picture,
					readonly: () => readonly,
					alert: (words) => (loadLine = words)
				});
			else if (!on && writer) {
				writer.destroy();
				writer = null;
			}
		});
	});

	// A request that this view did not start. The writing tools take each value of the page, also
	// undefined, and start it, hold it, or end the request of the pending before it (review/writing.svelte.js).
	$effect(() => {
		const p = writing?.pending;
		const wr = writer;
		if (wr) untrack(() => wr.offer(p));
	});

	/** Why the writing tools cannot start a request. While one runs, the tools give their own reason. */
	const toolsOff = $derived(!w ? undefined : readonly ? w.readonly : proposal ? w.decideFirst : empty ? w.empty : undefined);
	/** Why Take all and Take cannot act: while the text is read-only. */
	const takeAllOff = $derived(!w || !readonly ? undefined : proposal ? w.takeAllReadonly : w.lockedReason);
	/** True while the rows of the changes or the instruction row stand under the text. */
	const reviewRows = $derived(!!writer && (writer.changes.some((c) => c.state !== 'taken') || writingTools.includes('instruction')));

	$effect(() => {
		engine?.setReadonly(locked);
		untrack(refresh);
	});

	// The bar over selected text of the full preset loads when a person first uses the field.
	let selectionLoading = false;
	$effect(() => {
		if (!armed || kind !== 'full' || !engine || selectionLoading) return;
		selectionLoading = true;
		selectionBarPart.load().then((part) => {
			if (!gone) SelectionBarPart = part;
		}, toolbarFailed);
	});

	// A field with no toolbar mounts the forms itself when one first opens, and keeps them, so that the
	// popover closes with its animation.
	let formsLoading = false;
	$effect(() => {
		if (!bare || form === null || formsLoading) return;
		formsLoading = true;
		forms.load().then((part) => {
			if (!gone) FormsPart = part;
		}, toolbarFailed);
	});

	// The chunk of the picture loads with the engine when the page gives upload, so it is ready at the
	// first click on a picture, and the part mounts when a person first uses the field.
	let pictureLoading = false;
	$effect(() => {
		if (!engine || !upload || pictureLoading) return;
		pictureLoading = true;
		import('../rich-text/picture/Picture.svelte')
			.then((m) => {
				if (!gone) PicturePart = m.default;
			})
			.catch((error: unknown) => {
				console.error('The rich text field did not load the bar of its pictures:', error);
				if (!gone) loadLine = fail({ kind: 'load', part: 'picture', error }) ?? loadLine;
			});
	});

	// The attributes of the text go through the engine, which would count a change of its text as an input.
	$effect(() => {
		const e = engine;
		if (!e) return;
		const keys = kind === 'full' && !locked ? `${uid}-keys` : null;
		e.setAttribute('aria-label', ariaLabel ?? null);
		e.setAttribute('aria-labelledby', ariaLabelledby ?? null);
		e.setAttribute('aria-describedby', [ariaDescribedby, keys].filter(Boolean).join(' ') || null);
		e.setAttribute('aria-invalid', invalid ? 'true' : null);
		e.setAttribute('aria-required', required ? 'true' : null);
		e.setAttribute('aria-placeholder', placeholder ?? null);
	});

</script>

<div
	bind:this={ref}
	data-slot="rich-text-field"
	class={cn('flex w-full min-w-0 flex-col', className)}
	style:--rich-text-paper={paper?.paper}
	style:--rich-text-ink={paper?.ink}
	style:--rich-text-link={paper?.link}
	onfocusin={(e) => {
		armed = true;
		held = e.target as Element;
		onfocusin?.(e);
	}}
	onpointerenter={(e) => {
		armed = true;
		onpointerenter?.(e);
	}}
	onfocusout={(e) => {
		// The focus that moves to another element ends the record; a control that leaves the page gives no relatedTarget.
		if (e.relatedTarget instanceof Node && !ref?.contains(e.relatedTarget)) held = null;
		onfocusout?.(e);
	}}
	{...rest}
>
	<InputGroup.Root class="h-auto flex-col items-stretch">
		{#if !bare}
			<Toolbar controls="{uid}-text" end={toolbarEnd || writer ? end : undefined}>
				{#snippet children()}
					{#if toolbarChunk}
						{@const Tools = toolbarChunk.Tools}
						<Tools bind:this={toolsPart} />
					{:else}
						<!-- The groups of tools load in a chunk of their own; a row of the height of a tool holds their place. -->
						<div aria-hidden="true" class="flex min-w-0 flex-1"><span class="size-8 max-md:size-11"></span></div>
					{/if}
				{/snippet}
			</Toolbar>
		{/if}
		{#if writer && review && w}
			{@const RequestBar = review.RequestBar}
			{@const wr = writer}
			<RequestBar source={writing?.source ?? 'Suggestions'} words={w} state={wstate} stale={wr.stale} takeOff={takeAllOff} ontakeall={() => wr.takeAll()} onleaveall={() => wr.leaveAll()} />
		{/if}
		{@render bar?.()}
		{#if wstate.kind === 'text' && writer?.Proposal}
			{@const Proposal = writer.Proposal}
			<!-- The text hides while a whole text waits, so the line of a failed load stands above the diff. -->
			{#if loadLine}{@render failure(loadLine)}{/if}
			<Proposal lines={wstate.lines} title={wstate.title} preset={kind} words={writer.words} />
		{/if}
		<!-- The last row of the group rounds its corners inside the edge of the group, as the toolbar does at the top. -->
		<div
			bind:this={host}
			hidden={!!proposal}
			class={cn(
				'relative w-full',
				onPaper ? ['bg-rich-text-paper', locked ? 'text-rich-text-ink/75' : 'text-rich-text-ink'] : locked ? 'text-foreground/75' : 'text-foreground',
				!reviewRows && !foot && adding === 0 && !notice && 'rounded-b-[calc(var(--radius-lg)-1px)]',
				// With no toolbar and no bar of the page above it, the text is the first row of the group.
				bare && !bar && 'rounded-t-[calc(var(--radius-lg)-1px)]'
			)}
		>
			<!-- When the engine did not load, the view shows the HTML of the person, read only, in the place of the text. -->
			{#if loadLine && !proposal}{@render failure(loadLine)}{/if}
			<Content
				bind:ref={text}
				paper={onPaper}
				fromInk={paper !== undefined}
				hidden={failed}
				id="{uid}-text"
				tabindex={0}
				data-slot="input-group-control"
				role="textbox"
				aria-multiline="true"
				class={cn('w-full overflow-auto px-3 py-2.5 text-base outline-none contain-paint md:text-md', kind === 'simple' ? 'min-h-24' : 'min-h-40')}
			/>
			{#if failed}
				<RichTextView {html} preset={kind} {picture} {paper} class={cn('rounded-none bg-transparent px-3 py-2.5 text-inherit', kind === 'simple' ? 'min-h-24' : 'min-h-40')} />
			{/if}
			{#if kind === 'full'}<span id="{uid}-keys" class="sr-only">In a list, Tab indents. Esc, then Tab, moves the focus out.</span>{/if}
			<span bind:this={probe} aria-hidden="true" class={PROBE}></span>
			{#if engine && empty && placeholder}
				<!-- In dark mode the paper stays light, so the placeholder takes the ink at 70% there, and in both modes on a paper of the page. -->
				<span aria-hidden="true" class={cn('pointer-events-none absolute top-2.5 left-3 text-base text-muted-foreground md:text-md', onPaper && 'dark:text-rich-text-ink/70', paper !== undefined && 'text-rich-text-ink/70')}>{placeholder}</span>
			{/if}
			<!-- The bars over the text mount when a person first uses the field. -->
			{#if armed && engine && text && host && upload && PicturePart}
				<PicturePart {engine} {text} {host} />
			{/if}
			{#if armed && engine && text && host && SelectionBarPart}
				<SelectionBarPart bind:this={selectionBar} {text} {host} />
			{/if}
		</div>
		{#if writer && review && w}
			{@const Changes = review.Changes}
			{@const Instruction = review.Instruction}
			{@const wr = writer}
			<Changes
				bind:ref={rows}
				class={wr.changes.some((c) => c.state !== 'taken') ? 'border-t border-dashed border-input' : undefined}
				changes={wr.changes}
				stale={wr.stale}
				words={w}
				takeOff={takeAllOff}
				ontake={(n) => wr.take([n])}
				onleave={(n) => wr.leave([n])}
				ontakeafterall={(n) => wr.takeAfterAll(n)}
				onactive={(n) => wr.look(n)}
				onback={back}
			/>
			{#if writingTools.includes('instruction')}
				<Instruction
					words={w}
					scope={wr.scope}
					off={wstate.kind === 'running' ? w.wait : toolsOff}
					onask={(instruction) => wr.run('instruction', { instruction })}
					onclearscope={() => wr.setScope(null)}
				/>
			{/if}
		{/if}
		{@render foot?.()}
		<!-- In the page from the mount, empty, so that a screen reader hears the first words that come into it. -->
		<p role="status" class={cn('flex items-center gap-1.5 text-xs text-muted-foreground', (adding > 0 || notice) && 'border-t border-border px-3 py-1.5')}>
			{#if adding > 0}
				{adding === 1 ? 'Adding the picture…' : `Adding ${adding} pictures…`}
			{:else if notice}
				<TriangleAlertIcon aria-hidden="true" class="size-3.5 shrink-0 text-warning" /><span class="text-foreground">{notice}</span>
			{/if}
		</p>
		{#if upload}
			<input bind:this={chooser} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden onchange={chosen} />
		{/if}
	</InputGroup.Root>
	{#if bare && FormsPart}<FormsPart menuOpen={false} />{/if}
</div>

<!-- The words of the page for a chunk that did not load. The field writes none of its own. -->
{#snippet failure(words: string)}
	<p role="alert" class="px-3 pt-2.5 text-base md:text-md">{words}</p>
{/snippet}

{#snippet end()}
	{@render toolbarEnd?.()}
	{#if writer && review && w}
		{@const WritingTools = review.WritingTools}
		{@const wr = writer}
		<WritingTools
			words={w}
			tools={writingTools}
			modes={writing?.modes ?? []}
			running={wstate.kind === 'running' ? wstate.request.kind : null}
			off={toolsOff}
			scope={wr.scope}
			{armed}
			onrun={(k, mode) => wr.run(k, mode === undefined ? {} : { mode })}
			onstop={() => wr.stop()}
		/>
	{/if}
{/snippet}

<style>
	/* The words of a proposed change, marked outside the content (rich-text/engine/engine.ts). */
	:global(::highlight(stack-change)) {
		background-color: color-mix(in oklab, var(--color-diff-removed) 30%, transparent);
		text-decoration: line-through;
	}
	:global(::highlight(stack-change-active)) {
		background-color: color-mix(in oklab, var(--color-diff-removed) 60%, transparent);
	}
</style>
