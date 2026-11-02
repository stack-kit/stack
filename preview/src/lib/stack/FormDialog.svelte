<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Dialog as DialogPrimitive } from 'bits-ui';
	import type { WithoutChildrenOrChild } from '#lib/utils.js';

	/** @behaviour keys:submit form-screen first-field */
	export type FormDialogProps = Omit<WithoutChildrenOrChild<DialogPrimitive.ContentProps>, 'id' | 'title' | 'onsubmit' | 'ref' | 'onOpenAutoFocus'> & {
		/** The root, the content of the dialog in its layer over the page. It is null while the dialog is closed. */
		ref?: HTMLDivElement | null;
		open?: boolean;
		/** The id of the form, which the action of the header names. */
		id: string;
		title: string;
		description: string;
		/** The label of the primary action, which repeats the verb of the button that opened the dialog. */
		action: string;
		/** The label of the action in the header of the form screen, a verb such as Add. */
		short: string;
		/** The label of the button that closes the dialog with no change. */
		cancelLabel?: string;
		/** True for a long form or a list: at most 640 px wide. */
		wide?: boolean;
		/** True while the form has nothing to save, such as an empty text: no reason to give, so disabled. */
		disabled?: boolean;
		/** True when Cmd+Enter runs the primary action from any field of the form. */
		runKey?: boolean;
		onOpenChange?: (open: boolean) => void;
		onsubmit: (e: SubmitEvent) => void;
		/** The fields of the form. */
		children: Snippet;
	};
</script>

<script lang="ts">
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import * as Kbd from '#lib/components/ui/kbd/index.js';
	import { bindKey, keyHint } from '#lib/stack/behaviour/keys.js';
	import { cn } from '#lib/utils.js';

	// A dialog of one short form whose first field is a text field or a text area (### dialog of
	// DESIGN.md, Phone). Below 768 px it is a form screen: stack.css makes it fill the screen with the
	// safe area, and its header reaches the edges, 52 px high with a border below, and holds Cancel, the
	// title and the primary action, because the keyboard of the phone covers the bottom of the screen.
	// The description stays for a screen reader, and the footer does not show. The dialog has no close
	// button, so from 768 px the footer holds Cancel before the primary action. It puts the focus in
	// the first field when it opens. From 768 px the dialog is at most 11/12 of the window high, and
	// the body scrolls between the header and the footer. With runKey, Cmd+Enter runs the primary action
	// from any field (the action submit of behaviour/keys), and the action of the footer shows the key.
	// While the form is disabled, the part keeps Cmd+Enter and runs nothing, so that a binding of the
	// page under the dialog does not run.
	//
	// The root is the content of the dialog (dialog-content), which takes the rest attributes, the
	// class and ref. So a page can give it escapeKeydownBehavior and interactOutsideBehavior while the
	// action runs. The content is not in the page while the dialog is closed, so ref is null then. The
	// part keeps its own handler of onOpenAutoFocus, which puts the focus in the first field.
	let {
		open = $bindable(false),
		id,
		title,
		description,
		action,
		short,
		cancelLabel = 'Cancel',
		wide = false,
		disabled = false,
		runKey = false,
		onOpenChange,
		onsubmit,
		children,
		class: className,
		ref = $bindable(null),
		...rest
	}: FormDialogProps = $props();

	let form = $state<HTMLFormElement | null>(null);

	/** The keys of submit in the form of aria-keyshortcuts, such as "Meta+Enter". "" when the key is off. */
	const hint = $derived(runKey ? (keyHint('submit').split(' ')[0] ?? '') : '');
	/** The keys of the hint as a Kbd shows them: glyphs on macOS, words on other systems. */
	const NAMES: Readonly<Record<string, string>> = { Meta: '⌘', Control: 'Ctrl', Alt: 'Alt', Shift: 'Shift' };
	const shown = $derived(hint ? hint.split('+').map((k) => NAMES[k] ?? k) : []);

	$effect(() => {
		if (!open || !runKey) return;
		return bindKey('submit', () => {
			if (!disabled && form) form.requestSubmit();
		});
	});

	function focusFirstField(e: Event) {
		const field = form?.querySelector<HTMLElement>('input:not([type=hidden]):not(:disabled), textarea:not(:disabled)');
		if (!field) return;
		e.preventDefault();
		field.focus();
	}
</script>

<Dialog.Root bind:open onOpenChange={(o) => onOpenChange?.(o)}>
	<Dialog.Content
		bind:ref
		data-slot="dialog-content"
		class={cn('flex flex-col md:max-h-11/12', wide && 'sm:max-w-160', className)}
		{...rest}
		showCloseButton={false}
		onOpenAutoFocus={focusFirstField}
	>
		<Dialog.Header class="max-md:-mx-4 max-md:-mt-4 max-md:h-13 max-md:shrink-0 max-md:flex-row max-md:items-center max-md:gap-1 max-md:border-b max-md:border-border max-md:px-1">
			<Dialog.Close class="{buttonVariants({ variant: 'ghost' })} md:hidden">{cancelLabel}</Dialog.Close>
			<Dialog.Title class="max-md:min-w-0 max-md:flex-1 max-md:truncate">{title}</Dialog.Title>
			<Dialog.Description class="max-md:sr-only">{description}</Dialog.Description>
			<Button size="sm" type="submit" form={id} {disabled} class="md:hidden">{short}</Button>
		</Dialog.Header>
		<form {id} bind:this={form} data-slot="form-dialog-form" class="flex min-h-0 flex-1 flex-col gap-5" {onsubmit} novalidate>
			<!-- The body scrolls between the header and the footer, with its scroll bar at the edge. -->
			<div data-slot="form-dialog-body" class="-mx-4 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4">{@render children()}</div>
			<Dialog.Footer class="max-md:hidden">
				<Dialog.Close class={buttonVariants({ variant: 'outline' })}>{cancelLabel}</Dialog.Close>
				<Button type="submit" {disabled} aria-keyshortcuts={hint || undefined}>
					{action}
					{#if shown.length}
						<Kbd.Group class="max-md:hidden">
							{#each shown as key, i (i)}<Kbd.Root class="border border-primary-foreground/35 bg-transparent text-primary-foreground">{key}</Kbd.Root>{/each}
						</Kbd.Group>
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
