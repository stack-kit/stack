<!--
	The slash menu of the rich text field (### rich-text-field in DESIGN.md, "The slash menu"): a list box
	of the block commands of the field at the slash, a floating layer at level 3 of ## Elevation & Depth
	with the look of a command list. A slash that a person types at the start of an empty line or after a
	space opens it (engine.ts). The caret stays in the text: the text takes aria-activedescendant with the
	active option and aria-controls with the list, and the field gives each key of the text to key() first.

	- The words between the slash and the caret filter the commands. Up and Down move the active option,
	  Enter takes it, and Esc closes the menu and leaves the slash as text. Tab closes it, and Tab acts as in
	  the text. Left, Right, Home and End close it, and the caret moves. A press on a command takes it; a
	  press anywhere else closes the menu. When the page or the text scrolls, the menu follows the slash.
	- The menu closes when the slash goes, when the caret leaves the words after the slash or the text,
	  while the text is locked, at a space right after the slash, and at a space after a filter that matches
	  no command. Then the next slash opens it again.
	- A command takes the slash and the filter out and runs on the line in one undo step (Engine.take), so
	  the undo key gives the typed words back.
	- While no command matches, the menu shows the empty line, and a status region says it. The region is
	  in the page from the mount of the part, empty.
	- The field loads this part in a chunk of its own when a person first uses a field with slash, and
	  mounts it then. It listens to the document and the window only while it shows.
-->
<script lang="ts" module>
	import type { SlashCommand, SlashWords } from '#lib/stack/rich-text.js';

	export type SlashMenuProps = {
		/** The text of the field, and the element around it with position: relative, where the menu draws. */
		text: HTMLElement;
		host: HTMLElement;
		/** The commands that the field turns on, in their order. */
		commands: readonly SlashCommand[];
		/** The words of the page; each word that it leaves out keeps the English word. */
		words?: Partial<SlashWords> | undefined;
		/** Takes the command: the typed words of `typed`, the slash and the filter, go, and the command runs. */
		ontake: (command: SlashCommand, typed: Range) => void;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { getField } from '../context.js';
	import { TOOL_ICONS } from '../toolbar/icons.js';
	import { SLASH_WORDS, filterCloses, filterCommands } from './commands.js';

	let { text, host, commands, words, ontake }: SlashMenuProps = $props();

	const field = getField();
	const uid = $props.id();
	const listId = `${uid}-list`;
	const w = $derived({ ...SLASH_WORDS, ...words });

	let ref = $state<HTMLDivElement | null>(null);
	/** The range of the slash while the menu is open, else null. */
	let slash = $state.raw<Range | null>(null);
	let filter = $state('');
	let active = $state(0);
	let at = $state<{ x: number; y: number } | null>(null);
	const shown = $derived(slash ? filterCommands(commands, w.commands, filter) : []);
	const optionId = (c: SlashCommand) => `${uid}-${c}`;

	/** The words of a range as a person sees them: no zero-width space, and a no-break space as a space. */
	const plain = (words: string) => words.replace(/\u200b/g, '').replace(/\u00a0/g, ' ');
	const lineOf = (node: Node) => (node instanceof Element ? node : node.parentElement)?.closest('div, p, h1, h2, h3, h4, h5, h6, li, pre');

	/** The caret in the text, or null for a selection or a caret outside the text. */
	function caret(): Range | null {
		const s = document.getSelection();
		const r = s?.rangeCount ? s.getRangeAt(0) : null;
		return r && r.collapsed && text.contains(r.startContainer) ? r : null;
	}

	/** Opens the menu at the slash that a person typed. */
	export function open(range: Range) {
		slash = range;
		filter = '';
		active = 0;
		follow();
	}

	export function close() {
		if (!slash) return;
		slash = null;
		at = null;
		field.engine?.setAttribute('aria-activedescendant', null);
		field.engine?.setAttribute('aria-controls', null);
	}

	/** Reads the words after the slash, or closes the menu when the slash or the caret left. */
	function follow() {
		const s = slash;
		if (!s) return;
		const c = caret();
		if (!c || field.locked || plain(s.toString()) !== '/') return close();
		// The caret stands after the slash, in its line.
		if (c.comparePoint(s.endContainer, s.endOffset) > 0 || lineOf(c.startContainer) !== lineOf(s.startContainer)) return close();
		const typed = document.createRange();
		typed.setStart(s.endContainer, s.endOffset);
		typed.setEnd(c.startContainer, c.startOffset);
		const next = plain(typed.toString());
		if (filterCloses(next, filterCommands(commands, w.commands, next).length)) return close();
		if (next !== filter) active = 0;
		filter = next;
		place();
	}

	function place() {
		const s = slash;
		if (!s) return;
		const rect = s.getBoundingClientRect();
		const box = host.getBoundingClientRect();
		const width = ref?.offsetWidth ?? 0;
		const height = ref?.offsetHeight ?? 0;
		// Under the line of the slash, or above it where the window has no room under it.
		const below = rect.bottom + 4 + height <= innerHeight || rect.top - 4 - height < 0;
		const x = Math.min(Math.max(0, rect.left - box.left), Math.max(0, box.width - width));
		const y = below ? rect.bottom - box.top + 4 : rect.top - box.top - height - 4;
		at = { x, y };
		// The first show measures a hidden menu as 0 px high, so the menu places itself again once it shows.
		if (height === 0) requestAnimationFrame(place);
	}

	function choose(command: SlashCommand) {
		const s = slash;
		const c = caret();
		if (!s || !c) return close();
		const typed = document.createRange();
		typed.setStart(s.startContainer, s.startOffset);
		typed.setEnd(c.startContainer, c.startOffset);
		close();
		ontake(command, typed);
	}

	/** The keys of the text while the menu is open; true takes the key. */
	export function key(e: KeyboardEvent): boolean {
		if (!slash || e.isComposing) return false;
		if (e.key === 'Escape') {
			close();
			return true;
		}
		// A key that moves the caret along the line closes the menu, with or without a modifier, so that no
		// letter of the next word enters the filter, and Enter does not take it out.
		if (/^(?:ArrowLeft|ArrowRight|Home|End)$/.test(e.key)) {
			close();
			return false;
		}
		if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return false;
		const n = shown.length;
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			if (n > 0) active = (active + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
			return true;
		}
		if (e.key === 'Enter') {
			const c = shown[active];
			if (!c) {
				close();
				return false;
			}
			choose(c);
			return true;
		}
		if (e.key === 'Tab') close();
		return false;
	}

	// The text names the list and its active option while the menu is open.
	$effect(() => {
		const e = field.engine;
		const c = shown[active];
		if (!e || !slash) return;
		e.setAttribute('aria-controls', listId);
		e.setAttribute('aria-activedescendant', c ? optionId(c) : null);
		// The list scrolls to the active option, and the page does not scroll.
		const list = ref?.querySelector<HTMLElement>('[role=listbox]');
		const option = list?.querySelector(`[data-command="${c}"]`);
		if (!list || !option) return;
		const a = option.getBoundingClientRect();
		const b = list.getBoundingClientRect();
		if (a.top < b.top) list.scrollTop -= b.top - a.top;
		else if (a.bottom > b.bottom) list.scrollTop += a.bottom - b.bottom;
	});

	// The menu listens to the document, the window, the text and the engine only while it shows.
	const showing = $derived(slash !== null);
	$effect(() => {
		const e = field.engine;
		if (!showing || !e) return;
		const outside = (ev: PointerEvent) => {
			if (!(ev.target instanceof Node) || !ref?.contains(ev.target)) close();
		};
		const offChange = e.on('change', follow);
		const offState = e.on('state', follow);
		document.addEventListener('pointerdown', outside, true);
		addEventListener('scroll', place, true);
		addEventListener('resize', place);
		text.addEventListener('focusout', close);
		return () => {
			offChange();
			offState();
			document.removeEventListener('pointerdown', outside, true);
			removeEventListener('scroll', place, true);
			removeEventListener('resize', place);
			text.removeEventListener('focusout', close);
		};
	});

	$effect(() => {
		if (field.locked) untrack(close);
	});

	// A menu that goes while it is open, such as when the page turns slash off, leaves no attribute on the text.
	$effect(() => () => untrack(close));
</script>

<!-- A press on the menu keeps the focus and the caret in the text. -->
<div
	bind:this={ref}
	data-slot="rich-text-slash-menu"
	hidden={at === null}
	class="absolute z-20 w-56 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
	style:left="{at?.x ?? 0}px"
	style:top="{at?.y ?? 0}px"
	onmousedown={(e) => e.preventDefault()}
	role="presentation"
>
	<div id={listId} role="listbox" aria-label={w.label} class="no-scrollbar max-h-72 overflow-x-hidden overflow-y-auto">
		{#each shown as c, i (c)}
			{@const Icon = TOOL_ICONS[c]}
			<!-- The keys reach the options through the text, which holds the focus and aria-activedescendant. -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				id={optionId(c)}
				role="option"
				tabindex={-1}
				aria-selected={i === active}
				data-command={c}
				data-selected={i === active ? '' : undefined}
				class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm select-none data-selected:bg-muted data-selected:text-foreground max-md:min-h-11 [&_svg]:size-4 [&_svg]:shrink-0"
				onpointerenter={() => (active = i)}
				onclick={() => choose(c)}
			>
				<Icon aria-hidden="true" />{w.commands[c]}
			</div>
		{/each}
	</div>
	{#if slash && shown.length === 0}<div aria-hidden="true" class="py-6 text-center text-sm">{w.empty}</div>{/if}
</div>
<!-- In the page from the mount, empty, so that a screen reader hears the line of a filter that matches nothing. -->
<p role="status" class="sr-only">{slash && shown.length === 0 ? w.empty : ''}</p>
