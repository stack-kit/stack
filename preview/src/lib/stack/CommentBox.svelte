<!--
	The box that writes a comment (### comment-box in DESIGN.md), at the end of a list of comments or in
	the place of the comment at the end of a thread. It holds a RichTextField of the simple preset by
	default, the count of the characters left when the product gives a limit, the status region of a
	send, and the send button with the key of submit. A key, C by default, puts the caret in the field.
	It is an advanced part: it puts the field, the button and InternalMark together.

	- onsend(html, words) stores the comment and resolves when the store is done. The box then empties the
	  field, the field keeps the focus when the box held it, and the status region says "Comment added."
	  to a screen reader until the next change of the field. While onsend runs the field is read-only and
	  the send button is the busy button of ### button. A rejection keeps the draft, unlocks the field and
	  calls onfailure with the kind save. The words of the product show in the status region, and the part
	  writes no failure text and shows no toast of its own.
	- The send button is outline. primary makes it the default variant, the one primary action of its
	  panel. It takes disabled while the field is empty, and aria-disabled with the count line as its
	  reason while the text is over the limit.
	- The key of submit of behaviour/keys, Cmd+Enter by default, sends while the focus is anywhere inside
	  the box. A held key sends once.
	- The keys of caretKeys put the caret in the field while the focus is outside a text field and outside
	  an open layer that does not hold the box, and while the box shows. A box that a tab hides calls
	  onreveal first. Each key takes its whole press (takePress), so a held C types no letter. [] turns
	  the keys off. When two boxes show on one page, the box that mounted first takes the key.
	- The box takes no quote and no quoteEdited of the field: a comment quotes no earlier mail, and a reply
	  to a mail takes a RichTextField. The simple preset keeps no quote. With the full preset, an html that
	  holds a blockquote with type="cite" keeps the keys of the field for that quote: Enter splits it, and
	  Backspace and Delete move no words over its edge.
-->
<script lang="ts" module>
	import type { RichTextFieldProps } from './RichTextField.svelte';

	/** The words of the box, in the language of the product. */
	export type CommentBoxWords = {
		/** The name of the field, when the page gives no aria-label and no aria-labelledby. */
		label: string;
		placeholder: string;
		/** The label of the send button, a verb that names the result. */
		send: string;
		/** The count line, with the characters left or over the limit. */
		left: (n: number) => string;
		over: (n: number) => string;
		/** The word of the internal mark, which also starts the name of the field of an internal box. */
		internal: string;
		/** The words that the status region says to a screen reader after a send, until the next change of the field. */
		sent?: string;
	};

	/** @behaviour keys:submit keys:caret take-press draft:kept-on-failure focus:field-after-send */
	export type CommentBoxProps = Omit<RichTextFieldProps, 'editor' | 'onchange' | 'invalid' | 'required' | 'quote' | 'quoteEdited'> & {
		/**
		 * Stores the comment: the HTML of the field, cleaned by the load list, and its words, one line of the
		 * text on each line. Resolve when the store is done, and the box empties the field. A rejection keeps
		 * the draft and reaches onfailure with the kind save.
		 */
		onsend: (html: string, words: string) => Promise<void>;
		/** The most characters of the words of the field. The box then shows the count of the characters left, and blocks the send over the limit. */
		limit?: number | undefined;
		/** True when the send is the one primary action of its panel, such as the panel of a Comment tab. The button then takes the default variant, and outline otherwise. */
		primary?: boolean | undefined;
		/** True when the box stands among content that goes out, such as at the end of a mail thread: it stands in the internal mark, and the name of its field starts with the word of the mark. In a list of comments that stands in one mark, leave it false. */
		internal?: boolean | undefined;
		/** The keys that put the caret in the field, such as the keys that a person chose. ['C'] by default, and [] turns them off. */
		caretKeys?: readonly string[] | undefined;
		/** Shows a box that the page hides, such as the panel of a tab that does not show. A key of caretKeys calls it, then puts the caret in the field. */
		onreveal?: (() => void) | undefined;
		/** True while the field holds a draft. Bind it, and give it to the keysOff of the page. */
		dirty?: boolean | undefined;
		words?: Partial<CommentBoxWords> | undefined;
	};

	/** The words of the box in English, which the words of the product replace one by one. */
	export const COMMENT_BOX_WORDS: CommentBoxWords = {
		label: 'Comment',
		placeholder: 'Write a comment',
		send: 'Comment',
		left: (n) => `${n.toLocaleString('en-GB')} ${n === 1 ? 'character' : 'characters'} left`,
		over: (n) => `${n.toLocaleString('en-GB')} ${n === 1 ? 'character' : 'characters'} over the limit`,
		internal: 'Internal',
		sent: 'Comment added.'
	};
</script>

<script lang="ts">
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { onDestroy, tick, untrack } from 'svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Kbd from '#lib/components/ui/kbd/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { actionKeys, isKey, keyHint, matches, parseKey, takePress } from '#lib/stack/behaviour/keys.js';
	import { cn } from '#lib/utils.js';
	import InternalMark from './InternalMark.svelte';
	import RichTextField from './RichTextField.svelte';
	import type { RichTextEditor, RichTextFailure } from './rich-text.js';

	let {
		onsend,
		limit,
		primary = false,
		internal = false,
		caretKeys = ['C'],
		onreveal,
		dirty = $bindable(false),
		words,
		html,
		preset = 'simple',
		toolbar,
		readonly = false,
		placeholder,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby,
		lang,
		dir,
		picture,
		upload,
		paper,
		onfailure,
		onselection,
		keys,
		markdown,
		slash,
		writing,
		toolbarEnd,
		bar,
		foot,
		class: className,
		ref = $bindable(null),
		...rest
	}: CommentBoxProps = $props();

	const uid = $props.id();
	const w = $derived({ ...COMMENT_BOX_WORDS, ...words });
	let editor = $state<RichTextEditor | null>(null);
	/** The characters of the words of the field, and true while the field holds words, a picture or a divider. */
	let count = $state(0);
	let filled = $state(false);
	let sending = $state(false);
	/** The words of the product for a failed send. */
	let line = $state<string | null>(null);
	/** True after a send, until the next change of the field. */
	let added = $state(false);
	let gone = false;
	onDestroy(() => (gone = true));

	/**
	 * The ids that name the field. With internal, the name starts with the word of the mark, such as
	 * "Internal, Comment", because the caret key puts a person straight into the field, past the badge.
	 */
	const labelledby = $derived(internal ? `${uid}-internal ${ariaLabelledby ?? `${uid}-label`}` : ariaLabelledby);
	const over = $derived(limit !== undefined && count > limit);
	const countLine = $derived(limit === undefined ? null : over ? w.over(count - limit) : w.left(limit - count));

	/** The key of submit in the form of aria-keyshortcuts, such as "Meta+Enter". "" when the key is off. */
	const sendHint = $derived(keyHint('submit').split(' ')[0] ?? '');
	/** The keys of the hint as a Kbd shows them: glyphs on macOS, words on other systems. */
	const NAMES: Readonly<Record<string, string>> = { Meta: '⌘', Control: 'Ctrl', Alt: 'Alt', Shift: 'Shift' };
	const shown = (hint: string) => (hint ? hint.split('+').map((k) => NAMES[k] ?? k) : []);

	/** Reads the field after a change of the person. */
	function changed() {
		if (!editor) return;
		const text = editor.words();
		count = [...text].length;
		filled = text.trim() !== '' || /<(?:img|hr)\b/i.test(editor.html());
		dirty = filled;
		added = false;
	}

	// A field that starts with a draft (html) counts it once its engine loaded.
	$effect(() => {
		if (editor) untrack(changed);
	});

	async function send() {
		if (sending || readonly || !editor || !filled || over) return;
		sending = true;
		line = null;
		added = false;
		const out = editor.html();
		try {
			await onsend(out, editor.words());
		} catch (error: unknown) {
			if (gone) return;
			sending = false;
			const failure: RichTextFailure = { kind: 'save', error };
			line = onfailure?.(failure) || null;
			return;
		}
		if (gone) return;
		// The send button takes disabled with the empty field, and the focus would fall to the page.
		const held = !!ref?.contains(document.activeElement);
		sending = false;
		editor.load('');
		count = 0;
		filled = false;
		dirty = false;
		added = true;
		if (held) editor.focus();
	}

	/**
	 * True for a key of submit, the keys that the person chose or Cmd+Enter. A key with Cmd, Ctrl or Alt counts
	 * wherever the focus is in the box, also on a button. Any other key counts only where matches() lets it
	 * fire, so Enter still runs a button and adds a line in the text.
	 */
	function submitKey(e: KeyboardEvent): boolean {
		return actionKeys('submit').some((key) => {
			const k = parseKey(key);
			return isKey(e, key) && (k.cmd || k.ctrl || k.alt || matches(e, key));
		});
	}

	// The key of submit sends while the focus is anywhere inside the box. The listener of behaviour/keys on
	// the window never matches Enter on a button, so the box takes the key on its own elements.
	$effect(() => {
		const el = ref;
		if (!el) return;
		const onkeydown = (e: KeyboardEvent) => {
			if (e.defaultPrevented || !submitKey(e)) return;
			e.preventDefault();
			if (!e.repeat) void send();
		};
		el.addEventListener('keydown', onkeydown);
		return () => el.removeEventListener('keydown', onkeydown);
	});

	/** The open layers. A key from inside one that does not hold the box stays in the layer. */
	const LAYER = '[role=dialog], [role=alertdialog], [role=menu], [role=listbox]';
	const shows = (el: HTMLElement) => (el.checkVisibility ? el.checkVisibility() : el.getClientRects().length > 0);

	async function caret(e: KeyboardEvent) {
		const box = ref;
		if (!box || readonly) return;
		const layer = e.target instanceof Element ? e.target.closest(LAYER) : null;
		if (layer && !layer.contains(box)) return;
		if (!shows(box) && !onreveal) return;
		e.preventDefault();
		takePress(e);
		if (!shows(box)) {
			onreveal?.();
			await tick();
		}
		if (shows(box)) editor?.focus();
	}

	// The keys that put the caret in the field. matches() never fires a key of characters alone in a text
	// field, so a person types the letter in any field, and the key reaches the box only from elsewhere.
	$effect(() => {
		const list = caretKeys;
		if (list.length === 0) return;
		const onkeydown = (e: KeyboardEvent) => {
			if (e.defaultPrevented || !list.some((key) => matches(e, key))) return;
			void caret(e);
		};
		addEventListener('keydown', onkeydown);
		return () => removeEventListener('keydown', onkeydown);
	});
</script>

{#snippet box()}
	{#if internal}
		<span id="{uid}-internal" hidden>{w.internal},</span>
		{#if !ariaLabelledby}<span id="{uid}-label" hidden>{ariaLabel ?? w.label}</span>{/if}
	{/if}
	<RichTextField
		bind:editor
		{html}
		{preset}
		{toolbar}
		readonly={readonly || sending}
		placeholder={placeholder ?? w.placeholder}
		invalid={over}
		aria-label={internal ? undefined : ariaLabelledby ? ariaLabel : (ariaLabel ?? w.label)}
		aria-labelledby={labelledby}
		aria-describedby={[ariaDescribedby, countLine !== null ? `${uid}-count` : undefined].filter(Boolean).join(' ') || undefined}
		{lang}
		{dir}
		{picture}
		{upload}
		{paper}
		{onfailure}
		{onselection}
		{keys}
		{markdown}
		{slash}
		{writing}
		{toolbarEnd}
		{bar}
		{foot}
		onchange={changed}
	/>
	<div data-slot="comment-box-actions" class="flex flex-wrap items-center gap-x-3 gap-y-2">
		{#if countLine !== null}
			<p id="{uid}-count" data-slot="comment-box-count" class={cn('text-xs tabular-nums', over ? 'text-destructive' : 'text-muted-foreground')}>{countLine}</p>
		{/if}
		<!-- In the page from the mount, empty, so that a screen reader hears the first words that come into it. -->
		<p role="status" data-slot="comment-box-status" class="flex min-w-0 flex-1 items-center gap-1.5 text-xs">
			{#if line}<TriangleAlertIcon aria-hidden="true" class="size-3.5 shrink-0 text-warning" /><span class="text-foreground">{line}</span>
			{:else if added}<span class="sr-only">{w.sent}</span>{/if}
		</p>
		<Button
			size="sm"
			variant={primary ? 'default' : 'outline'}
			data-action="send"
			class="ms-auto aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
			disabled={!filled || readonly}
			data-loading={sending ? '' : undefined}
			aria-busy={sending ? 'true' : undefined}
			aria-disabled={sending || over ? 'true' : undefined}
			aria-describedby={over ? `${uid}-count` : undefined}
			aria-keyshortcuts={sendHint || undefined}
			onclick={() => void send()}
		>
			{#if sending}<Spinner data-icon="inline-start" aria-hidden="true" role="presentation" />{/if}
			{w.send}
			{#if sendHint}
				<Kbd.Group class="max-md:hidden">
					{#each shown(sendHint) as key, i (i)}<Kbd.Root class={primary ? 'border border-primary-foreground/35 bg-transparent text-primary-foreground' : undefined}>{key}</Kbd.Root>{/each}
				</Kbd.Group>
			{/if}
		</Button>
	</div>
{/snippet}

<div bind:this={ref} data-slot="comment-box" class={cn('flex min-w-0 flex-col', className)} {...rest}>
	{#if internal}
		<InternalMark label={w.internal} class="flex flex-col gap-1.5">{@render box()}</InternalMark>
	{:else}
		<div class="flex flex-col gap-1.5">{@render box()}</div>
	{/if}
</div>
