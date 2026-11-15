<!--
	A rich text that a person edits in its place (### rich-text-in-place in DESIGN.md), such as the
	description of a record in a properties panel or a note in a row of a table. The text shows as a
	RichTextView. A click on the text, not on a link, or the ghost button Edit swaps in a RichTextField at
	the same width, with the caret at the click. Save or the key of submit, Cmd+Enter by default, calls
	onsave, and Cancel ends the draft. It is an advanced part: it puts the view and the field together.

	- The part loads no field and no engine until a person edits. The field, Save, Cancel and the alert
	  dialog are in a chunk of their own (rich-text/in-place/Edit.svelte). That chunk, the engine and the
	  toolbar load early when the pointer enters the part or the focus reaches Edit, so a page of 50 views
	  loads no engine until a person points at one.
	- The field mounts hidden over the view and shows once its engine loaded, so the view never gives way
	  to an empty box. The caret then goes to the place of the click.
	- While onsave runs the field is read-only. A rejection keeps the draft and calls onfailure with the
	  kind save. Cancel with changes asks first in an alert-dialog. The draft stays when the focus leaves
	  the part. Esc in the text keeps the rule of the field, so a layer around the part stays open.
	- dirty is true while the draft differs from the HTML at its start. A page gives it to its keysOff, so
	  that a key of a list does not leave a text that is not saved.
	- The focus never falls to the page: when the field goes after Save or Cancel, Edit takes the focus if
	  the part held it. A click on an area outside the part that takes no focus ends the hold.
	- readonly shows the view only. A page that sets editing while readonly is true opens no field, and
	  editing goes back to false. A draft that the page makes read-only stays, and Save is off.
	- toolbar="none" gives the field no toolbar: the keys and the bar over selected text still work.
-->
<script lang="ts" module>
	import type { RichTextFieldProps } from './RichTextField.svelte';
	import type { RichTextInPlaceWords } from './rich-text.js';

	/** @behaviour escape:kept keys:submit draft:kept-on-blur cancel:alert-dialog live-region */
	export type RichTextInPlaceProps = Omit<RichTextFieldProps, 'html' | 'editor' | 'readonly' | 'toolbarEnd' | 'onchange'> & {
		/** The stored HTML. The view shows it, and the field starts from it. The page gives the stored HTML back after a save. */
		html: string;
		/** True while the field shows, from a click or Edit until Save or Cancel. A page that sets it to false ends the draft. */
		editing?: boolean | undefined;
		/** True while the draft differs from html. Bind it, and give it to the keysOff of the page. */
		dirty?: boolean | undefined;
		/** The text shows as a view only: no Edit, and a click on the text opens no field. */
		readonly?: boolean | undefined;
		/** The words of the view while html holds no words, no picture and no divider, such as "No description". */
		empty?: string | undefined;
		/**
		 * Stores the HTML of the draft, cleaned by the load list, and resolves when the store is done; the part
		 * then shows the view of html. While it runs the field is read-only. A rejection keeps the draft and
		 * reaches onfailure with the kind save.
		 */
		onsave: (html: string) => Promise<void>;
		/** The person ended the draft with Cancel. */
		oncancel?: (() => void) | undefined;
		/** The words of the part in the language of the product: Edit, Save, Cancel and the alert dialog. */
		words?: Partial<RichTextInPlaceWords> | undefined;
	};
</script>

<script lang="ts">
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import { onMount, tick, untrack } from 'svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import type EditType from '#lib/rich-text/in-place/Edit.svelte';
	import { IN_PLACE_WORDS } from '#lib/rich-text/in-place/words.js';
	import { cn } from '#lib/utils.js';
	import RichTextView from './RichTextView.svelte';
	import { defaultPicture, sanitizeRichText, type RichTextFailure } from './rich-text.js';

	let {
		html,
		editing = $bindable(false),
		dirty = $bindable(false),
		readonly = false,
		empty,
		onsave,
		oncancel,
		words,
		preset = 'full',
		toolbar = 'full',
		placeholder,
		invalid,
		required,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby,
		picture = defaultPicture,
		upload,
		paper,
		onfailure,
		onselection,
		keys,
		writing,
		bar,
		foot,
		onpointerenter,
		onfocusin,
		onfocusout,
		class: className,
		ref = $bindable(null),
		...rest
	}: RichTextInPlaceProps = $props();

	const uid = $props.id();
	const w = $derived({ ...IN_PLACE_WORDS, ...words });
	const kind = untrack(() => preset);
	const toolbarKind = untrack(() => toolbar);
	/** The props of the field, as the page gave them. */
	const field = $derived({
		preset: kind,
		toolbar: toolbarKind,
		placeholder,
		invalid,
		required,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby,
		picture,
		upload,
		paper,
		onselection,
		keys,
		writing,
		bar,
		foot
	});

	/** True for HTML with no words, no picture and no divider. */
	const noContent = (h: string) => !/<(?:img|hr)\b/i.test(h) && h.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;|[\s​]/gi, '') === '';
	// The load list needs a DOM, so the test of the HTML that the view shows runs after the mount.
	let mounted = $state(false);
	onMount(() => (mounted = true));
	/**
	 * A text that shows the words of empty: the HTML has no words, no picture and no divider, or the view
	 * shows none after it cleans the HTML with the load list, such as a picture that the picture test refuses.
	 */
	const blank = $derived(empty !== undefined && (noContent(html) || (mounted && noContent(sanitizeRichText(html, { list: 'load', preset: kind, picture })))));
	const onPaper = $derived(paper !== undefined || kind === 'full');

	let view = $state<HTMLDivElement | null>(null);
	let text = $state<HTMLDivElement | null>(null);
	let editButton = $state<HTMLButtonElement | null>(null);
	/** The field shows: its engine loaded. Until then it stands hidden over the view. */
	let ready = $state(false);
	let point = $state.raw<{ node: Node; offset: number } | null>(null);
	/** The words of the page for a field that did not load, above the view. */
	let loadLine = $state<string | null>(null);
	/** True while the focus is inside the part. A control that leaves the page gives no relatedTarget, and the focus stays counted. */
	let inside = false;

	// ---- The chunk of the edit state, and what the field loads at its mount, once.
	let EditPart = $state.raw<typeof EditType | null>(null);
	let editChunk: Promise<typeof import('../rich-text/in-place/Edit.svelte')> | null = null;
	function loadEdit() {
		editChunk ??= import('../rich-text/in-place/Edit.svelte');
		return editChunk;
	}
	let preloaded = false;
	function preload() {
		if (preloaded || readonly) return;
		preloaded = true;
		import('../rich-text/engine/engine.js').catch(() => {});
		loadEdit().then(
			(m) => m.preload(kind, toolbarKind),
			() => (editChunk = null)
		);
	}

	function fail(f: RichTextFailure): string | null {
		const said = onfailure?.(f);
		return said ? said : null;
	}

	// The field opens: from a click, from Edit, or from the page that sets editing. A read-only part opens
	// no field, as open() does, and an open clears the line of a field that did not load. The effect runs
	// again only when the chunk comes, before the field mounts, so no draft is open at either run.
	$effect(() => {
		if (!editing) return;
		const loaded = EditPart !== null;
		untrack(() => {
			if (readonly) {
				editing = false;
				return;
			}
			loadLine = null;
			if (loaded) return;
			loadEdit().then(
				(m) => (EditPart = m.default),
				(error: unknown) => {
					// Such as a chunk of an earlier build after a deploy: the view stays, and the page says so.
					console.error('The rich text in place did not load its field:', error);
					editChunk = null;
					editing = false;
					point = null;
					loadLine = fail({ kind: 'load', part: 'field', error }) ?? loadLine;
				}
			);
		});
	});

	// The page ends the draft, or the part did: the view comes back, and Edit takes the focus if the part held it.
	let wasEditing = untrack(() => editing);
	$effect(() => {
		const now = editing;
		untrack(() => {
			if (now === wasEditing) return;
			wasEditing = now;
			if (now) return;
			ready = false;
			point = null;
			dirty = false;
			if (inside) void tick().then(() => editButton?.focus());
		});
	});

	function open(at: { node: Node; offset: number } | null) {
		if (readonly || editing) return;
		preload();
		loadLine = null;
		point = at;
		editing = true;
	}

	/** The place in the view under the pointer. */
	function caretPoint(x: number, y: number): { node: Node; offset: number } | null {
		const pos = document.caretPositionFromPoint?.(x, y);
		if (pos) return { node: pos.offsetNode, offset: pos.offset };
		const range = (document as Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null }).caretRangeFromPoint?.(x, y);
		return range ? { node: range.startContainer, offset: range.startOffset } : null;
	}

	// While the field shows, a press outside the part on an area that takes no focus ends the hold of the
	// focus, so Edit does not take the focus from the page when the draft ends.
	$effect(() => {
		if (!editing) return;
		const down = (e: PointerEvent) => {
			if (!(e.target instanceof Node) || !ref?.contains(e.target)) inside = false;
		};
		document.addEventListener('pointerdown', down, true);
		return () => document.removeEventListener('pointerdown', down, true);
	});

	// A click on the text opens the field, with the caret at the click. The text is no control, so the
	// listener is set here and not as an attribute; the keyboard reaches the field through Edit. The text
	// comes back after each edit, so the listener follows it.
	$effect(() => {
		const el = text;
		if (!el) return;
		const click = (e: MouseEvent) => {
			if (readonly || editing || e.button !== 0) return;
			if (e.target instanceof Element && e.target.closest('a[href]')) return;
			// A person who selects words in the view, such as to copy them, keeps the selection.
			const s = document.getSelection();
			if (s && !s.isCollapsed && s.anchorNode && el.contains(s.anchorNode)) return;
			const at = caretPoint(e.clientX, e.clientY);
			open(at && view?.contains(at.node) ? at : null);
		};
		el.addEventListener('click', click);
		return () => el.removeEventListener('click', click);
	});

	function done(how: 'saved' | 'cancelled', focus: boolean) {
		if (focus) inside = true;
		editing = false;
		if (how === 'cancelled') oncancel?.();
	}
</script>

<div
	bind:this={ref}
	data-slot="rich-text-in-place"
	class={cn('relative flex w-full min-w-0 flex-col gap-1.5', className)}
	onpointerenter={(e) => {
		preload();
		onpointerenter?.(e);
	}}
	onfocusin={(e) => {
		inside = true;
		onfocusin?.(e);
	}}
	onfocusout={(e) => {
		if (e.relatedTarget instanceof Node && !ref?.contains(e.relatedTarget)) inside = false;
		onfocusout?.(e);
	}}
	{...rest}
>
	<!-- The words of the page for a field that did not load. The part writes none of its own. -->
	{#if loadLine}<p role="alert" class="text-base md:text-md">{loadLine}</p>{/if}
	{#if !ready}
		<div bind:this={text} data-slot="rich-text-in-place-text" class={cn('min-w-0', !readonly && 'cursor-text')}>
			{#if blank && empty}
				<div
					class={cn('min-w-0 text-base md:text-md', onPaper ? 'rounded-lg bg-rich-text-paper px-3 py-2.5 text-rich-text-ink/70' : 'text-muted-foreground')}
					style:--rich-text-paper={paper?.paper}
					style:--rich-text-ink={paper?.ink}
				>
					{empty}
				</div>
			{:else}
				<RichTextView bind:ref={view} {html} preset={kind} {picture} {paper} />
			{/if}
		</div>
		{#if !readonly}
			<div class="flex">
				<Button
					bind:ref={editButton}
					variant="ghost"
					size="xs"
					data-action="edit"
					aria-describedby={ariaLabelledby ?? (ariaLabel ? `${uid}-label` : undefined)}
					onfocus={preload}
					onclick={() => open(null)}
				>
					<PencilIcon data-icon="inline-start" />{w.edit}
				</Button>
				<!-- With aria-label alone, its words describe Edit. -->
				{#if !ariaLabelledby && ariaLabel}<span id="{uid}-label" hidden>{ariaLabel}</span>{/if}
			</div>
		{/if}
	{/if}
	{#if editing && EditPart}
		<!-- Hidden over the view until its engine loaded, so the field never shows as an empty box. -->
		<div class={cn('min-w-0', !ready && 'invisible absolute inset-x-0 top-0')}>
			<EditPart
				{field}
				{html}
				{readonly}
				{point}
				{view}
				words={w}
				{onsave}
				{onfailure}
				onready={() => (ready = true)}
				ondirty={(d) => (dirty = d)}
				ondone={done}
			/>
		</div>
	{/if}
</div>
