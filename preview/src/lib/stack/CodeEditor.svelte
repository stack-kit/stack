<!--
	The code editor of DESIGN.md (### code-editor): CodeMirror 6 from its three core packages, in a
	box with the edge of an input. The box is the .cm-editor element itself, so that its max-height
	makes the scroller scroll. EditorView.theme reads the tokens of stack.css as CSS custom
	properties, so a change of the mode or the theme needs no editor code. It also replaces each
	value of the base theme that would show: the dotted focus outline, the monospace font and the
	1.4 line height of the scroller, the black caret, and the grey gutter.

	Tab indents and Shift+Tab outdents. Esc, then Tab within 2 s, moves the focus out, and so does
	Tab in a read-only editor. Esc and Cmd+Enter keep no binding of the default keymap: Esc then
	always opens the 2 s window, also over a selection, and Cmd+Enter stays the shared key of the
	form. In an editor that a person can edit, Esc does not reach a dialog around it. A read-only
	editor lets Esc through, because Tab leaves it at once. Below 768 px the gutter hides and long
	lines wrap.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { ScreenQuery } from '#lib/stack/screen-query.svelte.js';
	import { Compartment, EditorState, type Extension } from '@codemirror/state';
	import { EditorView, keymap, lineNumbers } from '@codemirror/view';
	import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
	import { cn } from '#lib/utils.js';

	let {
		value = $bindable(''),
		readonly = false,
		invalid = false,
		class: className,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby
	}: {
		value?: string;
		readonly?: boolean;
		invalid?: boolean;
		/** Classes for the box, such as the height where it stops growing: max-h-120. */
		class?: string;
		'aria-label'?: string;
		'aria-labelledby'?: string;
		'aria-describedby'?: string;
	} = $props();

	// The edge and the radius of an input, the code step, the focus ring of ## Shapes, and the
	// invalid edge and halo of a text area. The ground is background in both modes, not the ground of
	// an input: the gutter must be opaque to cover a line that scrolls sideways under it, and it takes
	// the ground of the box. A read-only box keeps the ring edge on focus. The content is a
	// contenteditable element, so :focus-visible matches on a click too, as on an input.
	const BOX =
		'overflow-hidden rounded-lg border border-input bg-background font-mono text-xs text-foreground transition-colors ' +
		'has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50 ' +
		'has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 ' +
		'dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40 ' +
		'data-readonly:border-transparent data-readonly:bg-muted data-readonly:has-focus-visible:border-ring';

	const theme = EditorView.theme({
		'&.cm-focused': { outline: 'none' },
		// The scroller takes the font of the box, and it scrolls once the box reaches its max-height.
		'.cm-scroller': { fontFamily: 'inherit', lineHeight: 'inherit', overflow: 'auto' },
		// The content and the gutter are at least 64 px high, so that the gutter edge runs to the
		// bottom of an empty box. A min-height on the box would leave the gutter at the height of the text.
		'.cm-content, .cm-gutter': { minHeight: 'calc(var(--spacing) * 16)' },
		'.cm-content': { padding: 'calc(var(--spacing) * 2) 0', caretColor: 'var(--color-foreground)' },
		'.cm-line': { padding: '0 calc(var(--spacing) * 2.5)' },
		// The gutter sticks to the left edge when a long line scrolls, so it keeps the ground of the box.
		'.cm-gutters': {
			backgroundColor: 'var(--color-background)',
			color: 'var(--color-muted-foreground)',
			borderRightColor: 'var(--color-border)'
		},
		'&[data-readonly] .cm-gutters': { backgroundColor: 'var(--color-muted)' },
		'.cm-lineNumbers .cm-gutterElement': {
			minWidth: 'calc(var(--spacing) * 9)',
			padding: '0 calc(var(--spacing) * 2) 0 var(--spacing)'
		}
	});

	// The keys of the editor. Two bindings of the default keymap go. Escape would collapse a
	// selection and so swallow the Escape that lets Tab leave. Mod-Enter is the shared key of the main
	// action of a form (architecture/web-app.md), so the editor does not take it to add a blank line.
	const DROPPED = ['Escape', 'Mod-Enter'];
	const keys = keymap.of([
		indentWithTab,
		...historyKeymap,
		...defaultKeymap.filter((b) => !DROPPED.includes(b.key ?? ''))
	]);

	// In an editor that a person can edit, Esc stays in the editor, so that a dialog, a sheet, a
	// drawer or a popover around it does not close, and Esc, then Tab, leaves the editor there too.
	// Esc from the next control then closes the layer. A read-only editor lets Esc through, because
	// Tab leaves it at once. The handler returns false, so CodeMirror still opens its 2 s window for Tab.
	const keepEscape = EditorView.domEventHandlers({
		keydown(event, view) {
			if (event.key === 'Escape' && !view.state.readOnly) event.stopPropagation();
			return false;
		}
	});

	const phone = new ScreenQuery('(width < 48rem)');
	const layout = new Compartment();
	const settings = new Compartment();

	function layoutOf(isPhone: boolean): Extension {
		return isPhone ? EditorView.lineWrapping : lineNumbers();
	}

	function settingsOf(): Extension {
		const content: Record<string, string> = {};
		if (ariaLabel) content['aria-label'] = ariaLabel;
		if (ariaLabelledby) content['aria-labelledby'] = ariaLabelledby;
		if (ariaDescribedby) content['aria-describedby'] = ariaDescribedby;
		if (invalid) content['aria-invalid'] = 'true';
		const box: Record<string, string> = { 'data-slot': 'code-editor', dir: 'ltr', class: cn(BOX, className) };
		if (readonly) box['data-readonly'] = '';
		return [
			EditorState.readOnly.of(readonly),
			EditorView.editorAttributes.of(box),
			EditorView.contentAttributes.of(content)
		];
	}

	let host: HTMLDivElement;
	let view: EditorView | undefined;

	onMount(() => {
		view = new EditorView({
			parent: host,
			state: EditorState.create({
				doc: value,
				extensions: [
					history(),
					keys,
					keepEscape,
					theme,
					layout.of(layoutOf(phone.current)),
					settings.of(settingsOf()),
					EditorView.updateListener.of((u) => {
						if (u.docChanged) value = u.state.doc.toString();
					})
				]
			})
		});
		return () => {
			view?.destroy();
			view = undefined;
		};
	});

	$effect(() => {
		const next = layoutOf(phone.current);
		view?.dispatch({ effects: layout.reconfigure(next) });
	});

	$effect(() => {
		const next = settingsOf();
		view?.dispatch({ effects: settings.reconfigure(next) });
	});

	// A value that the page sets replaces the text. A value that the editor wrote is already the text.
	$effect(() => {
		const next = value;
		if (view && next !== view.state.doc.toString()) {
			view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: next } });
		}
	});
</script>

<div bind:this={host}></div>
