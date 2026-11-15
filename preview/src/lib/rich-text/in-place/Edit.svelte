<!--
	The edit state of RichTextInPlace (### rich-text-in-place in DESIGN.md): the field with the draft, Save,
	Cancel, the status region of a failed save and the alert dialog of Cancel with changes. The part loads
	this chunk with a dynamic import when a person first opens the field, when the pointer enters the part
	or when the focus reaches Edit, so a page of many views loads no field and no engine.

	- The field mounts hidden over the view, and the part shows it once its engine loaded (onready). This
	  part then puts the caret at the place of the click: it reads the line and the offset of the point in
	  the view with the line model of the field (engine/lines.ts), and puts the caret at the same place of
	  the text. With no point the caret goes to the end of the text.
	- Save and the key of the action submit of behaviour/keys, Cmd+Enter by default or the key that the
	  person chose, call onsave with the HTML of the draft. This part takes the key on its own elements,
	  wherever the focus is inside it: in the text, on a tool of the toolbar and on Save. On Cancel and in the
	  alert dialog the key does nothing. While onsave runs, the field is read-only, and Save is the busy
	  button of ### button, with aria-disabled and not disabled, so that the focus stays on it. A rejection
	  keeps the draft, unlocks the field and calls onfailure with the kind save, and the words of the page
	  show in the status region. While the page makes the part read-only, Save takes aria-disabled and saves
	  nothing.
	- Cancel ends the draft. With changes it asks first in an alert dialog: Keep editing gives the focus back
	  to the text, and Discard changes ends the draft. Esc in the text keeps the rule of the field.
	- dirty: the HTML of the draft differs from the HTML of the field when its engine loaded. The part reads
	  it again at each change of the text.
-->
<script lang="ts" module>
	import type { OnFailure, RichTextInPlaceWords, RichTextPreset } from '#lib/stack/rich-text.js';
	import type { RichTextFieldProps } from '#lib/stack/RichTextField.svelte';
	import { menu } from '../toolbar/parts.js';

	export type EditProps = {
		/** The props of the field, as the page gave them to the part. */
		field: Omit<RichTextFieldProps, 'html' | 'editor' | 'readonly' | 'toolbarEnd' | 'onchange' | 'onfailure' | 'ref' | 'class'>;
		/** The HTML that the draft starts from. Read once. */
		html: string;
		readonly: boolean;
		/** The place of the click in the view, and the view, for the caret; null puts the caret at the end. */
		point: { node: Node; offset: number } | null;
		view: HTMLElement | null;
		words: RichTextInPlaceWords;
		onsave: (html: string) => Promise<void>;
		onfailure: OnFailure | undefined;
		/** The engine of the field loaded, or did not load: the part shows the field. */
		onready: () => void;
		ondirty: (dirty: boolean) => void;
		/** The draft ended, saved or left with Cancel. focus is true when the part takes the focus. */
		ondone: (how: 'saved' | 'cancelled', focus: boolean) => void;
	};

	/** Loads what the field loads at its mount: the engine, and the groups of tools with the menus of the full preset. A chunk that does not load reaches the page when the field loads it again. */
	export function preload(preset: RichTextPreset, toolbar: 'full' | 'none'): void {
		import('../engine/engine.js').catch(() => {});
		if (toolbar === 'none') return;
		import('../toolbar/index.js').catch(() => {});
		if (preset === 'full') menu.load().catch(() => {});
	}
</script>

<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { onDestroy, tick, untrack } from 'svelte';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { actionKeys, isKey, matches, parseKey } from '#lib/stack/behaviour/keys.js';
	import RichTextField from '#lib/stack/RichTextField.svelte';
	import type { RichTextEditor, RichTextFailure } from '#lib/stack/rich-text.js';
	import { caretAt, pointOf, readLines } from '../engine/lines.js';

	let { field, html, readonly, point, view, words: w, onsave, onfailure, onready, ondirty, ondone }: EditProps = $props();

	const start = untrack(() => html);
	let root = $state<HTMLDivElement | null>(null);
	let editor = $state<RichTextEditor | null>(null);
	/** The HTML of the draft when the engine loaded, which dirty compares with. */
	let base: string | null = null;
	let dirty = $state(false);
	let saving = $state(false);
	/** The words of the page for a failed save. */
	let line = $state<string | null>(null);
	let asking = $state(false);
	let shown = false;
	let gone = false;
	onDestroy(() => (gone = true));

	function show() {
		if (shown) return;
		shown = true;
		onready();
	}

	/** The failures of the field reach the page. A field whose engine did not load shows too, with the HTML in its read view. */
	const failed: OnFailure = (f) => {
		if (f.kind === 'load' && f.part === 'engine') show();
		return onfailure?.(f);
	};

	function report(f: RichTextFailure): string | null {
		const words = onfailure?.(f);
		return words ? words : null;
	}

	// The engine loaded: the part shows the field, and the caret goes to the place of the click.
	$effect(() => {
		const e = editor;
		if (!e || base !== null) return;
		untrack(() => {
			base = e.html();
			// The place of the click, read before the part removes the view.
			const at = point && view?.contains(point.node) ? pointOf(readLines(view), point.node, point.offset) : null;
			show();
			void tick().then(() => place(at));
		});
	});

	/** Gives the focus to the text, with the caret at [line, offset], or at the end of the text. */
	function place(at: [number, number] | null) {
		if (gone) return;
		editor?.focus();
		const text = root?.querySelector<HTMLElement>('[data-slot=rich-text-field] [role=textbox]');
		if (!text) return;
		const model = readLines(text);
		const end = model.lines.length - 1;
		const spot = caretAt(model, at?.[0] ?? end, at?.[1] ?? (model.lines[end] ?? '').length);
		if (spot) document.getSelection()?.setBaseAndExtent(spot[0], spot[1], spot[0], spot[1]);
	}

	function changed() {
		const next = !!editor && base !== null && editor.html() !== base;
		if (next === dirty) return;
		dirty = next;
		ondirty(next);
	}

	async function save() {
		if (saving || readonly || !editor) return;
		saving = true;
		line = null;
		const out = editor.html();
		try {
			await onsave(out);
		} catch (error: unknown) {
			if (gone) return;
			saving = false;
			line = report({ kind: 'save', error });
			return;
		}
		if (gone) return;
		saving = false;
		ondone('saved', !!root?.contains(document.activeElement));
	}

	/**
	 * True for a key of submit, the keys that the person chose or Cmd+Enter. A key with Cmd, Ctrl or Alt counts
	 * wherever the focus is, also on a button, where matches() leaves Enter to the button. Any other key counts
	 * only where matches() lets it fire, so Enter and Space still run a button, and the text types them.
	 */
	function submitKey(e: KeyboardEvent): boolean {
		return actionKeys('submit').some((key) => {
			const k = parseKey(key);
			return isKey(e, key) && (k.cmd || k.ctrl || k.alt || matches(e, key));
		});
	}

	// The key of submit saves while the focus is anywhere inside this part: in the text, on a tool of the
	// toolbar and on Save. On Cancel it does nothing. The listener of behaviour/keys on the window never
	// matches Enter on a button, so this part takes the key on its own elements, before that listener.
	$effect(() => {
		const el = root;
		if (!el) return;
		const onkeydown = (e: KeyboardEvent) => {
			if (e.defaultPrevented || !submitKey(e)) return;
			e.preventDefault();
			if (e.target instanceof Element && e.target.closest('[data-action=cancel]')) return;
			void save();
		};
		el.addEventListener('keydown', onkeydown);
		return () => el.removeEventListener('keydown', onkeydown);
	});

	function cancel() {
		if (saving) return;
		if (dirty) asking = true;
		else ondone('cancelled', !!root?.contains(document.activeElement));
	}

	/** Discard changes ends the draft once the dialog has closed, so the dialog gives back the page before the field goes. */
	let discarding = false;
	function discard() {
		discarding = true;
		asking = false;
	}
</script>

<div bind:this={root} data-slot="rich-text-in-place-edit" class="flex min-w-0 flex-col gap-1.5">
	<RichTextField bind:editor {...field} html={start} readonly={readonly || saving} onchange={changed} onfailure={failed} />
	<div data-slot="rich-text-in-place-actions" class="flex flex-wrap items-center gap-2">
		<!-- The busy button of ### button: the spinner takes the place of the icon, so the label and the width stay. -->
		<Button
			size="sm"
			data-action="save"
			data-loading={saving ? '' : undefined}
			aria-busy={saving ? 'true' : undefined}
			aria-disabled={saving || readonly ? 'true' : undefined}
			class={readonly && !saving ? 'aria-disabled:cursor-not-allowed aria-disabled:opacity-50' : 'aria-disabled:cursor-not-allowed'}
			onclick={() => void save()}
		>
			{#if saving}<Spinner data-icon="inline-start" aria-hidden="true" role="presentation" />{:else}<CheckIcon data-icon="inline-start" />{/if}{w.save}
		</Button>
		<Button size="sm" variant="ghost" data-action="cancel" aria-disabled={saving ? 'true' : undefined} class="aria-disabled:cursor-not-allowed aria-disabled:opacity-50" onclick={cancel}>{w.cancel}</Button>
		<!-- In the page from the mount, empty, so that a screen reader hears the first words that come into it. -->
		<p role="status" class="flex min-w-0 items-center gap-1.5 text-xs">
			{#if line}<TriangleAlertIcon aria-hidden="true" class="size-3.5 shrink-0 text-warning" /><span class="text-foreground">{line}</span>{/if}
		</p>
	</div>
</div>

<AlertDialog.Root bind:open={asking}>
	<AlertDialog.Content
		onkeydown={(e: KeyboardEvent) => {
			// The key of submit does nothing in the dialog.
			if (!e.defaultPrevented && submitKey(e)) e.preventDefault();
		}}
		onCloseAutoFocus={(e: Event) => {
			// Keep editing and Esc give the focus back to the text. Discard changes ends the draft, and Edit of the part takes the focus.
			e.preventDefault();
			if (discarding) ondone('cancelled', true);
			else editor?.focus();
		}}
	>
		<AlertDialog.Header>
			<AlertDialog.Title>{w.discardTitle}</AlertDialog.Title>
			<AlertDialog.Description>{w.discardText}</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>{w.keep}</AlertDialog.Cancel>
			<AlertDialog.Action variant="destructive" onclick={discard}>{w.discard}</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
