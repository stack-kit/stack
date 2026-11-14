<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Fact } from '#lib/outside/Facts.svelte';

	/** @behaviour keys:submit escape:item kept-form focus:check,back */
	export type SendCheckProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> & {
		/** The root: the box of the form and of its check. */
		ref?: HTMLDivElement | null;
		/** True while the check shows in the place of the form. The form stays in the page with hidden, so an editor keeps its text, its pictures and its undo history. */
		open?: boolean;
		/** The form of the send, such as the fields of an invoice or a reply, and its Send button. Its Send button sets open to true. */
		form: Snippet;
		/** The question of the check, which names the action and the object, as the title of an alert dialog: "Send the invoice INV-0042 to Westbrook Supplies?" */
		title: string;
		/** The line under the question. */
		description?: string;
		/** The facts that the send fixes, in the order of the summary of the alert dialog that the check replaces: the object first, then the facts that the send fixes, such as the recipient, the amount, the due date and the files. */
		facts: Fact[];
		/** What goes out, as the person checks it before the send, such as the invoice, the message or the mail. The product draws it, such as a mail in an HtmlFrame. It shows under the facts. */
		preview?: Snippet;
		/** The warnings of the send, each with a check box, or a field that the send needs, as in an alert dialog. */
		warnings?: Snippet;
		/** The label of the action, which names the recipient: "Send to accounts@westbrook.example". */
		action: string;
		/** The label of the button that goes back to the form. */
		backLabel?: string;
		/** Why the send cannot run yet, as a sentence, such as "Check the warning to send." Leave it undefined while the send may run. */
		blocked?: string;
		/** True while the send runs. The action shows a spinner, and Esc and the back button do nothing. */
		working?: boolean;
		/** Why the last send failed, with the retry, such as "The server did not answer. Send it again." The check stays and shows these words in place. The part shows no toast. */
		failed?: string;
		/** One line under the actions that says what happens after the send, such as "It goes out at once, and the invoice then shows as Sent." */
		note?: string;
		/** Runs the send. The part does not close the check: the product sets open to false when the send is done. */
		onsend: () => void;
	};
</script>

<script lang="ts">
	import { tick, untrack } from 'svelte';
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Kbd from '#lib/components/ui/kbd/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import Facts from '#lib/outside/Facts.svelte';
	import { bindKey, inText, keyHint } from '#lib/stack/behaviour/keys.js';
	import { cn } from '#lib/utils.js';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import InfoIcon from '@lucide/svelte/icons/info';

	// The check of a send in the place of its form (### send-check in DESIGN.md, and "Actions with a
	// lasting effect" in architecture/web-app.md). The form stays in the page with hidden while the
	// check shows, so an editor keeps its text. The check is an alert in the page with the question,
	// the summary of the facts of an alert dialog, the preview of the product, the warnings, the reason
	// of a failed send, and the actions: the back button, then the send. The check takes the focus
	// when it opens. Esc and the back button go back to the form, and the focus goes back to the
	// element of the form that had it last. Esc binds at the level of the item column, so an open
	// layer and the selection take Esc first, and the item column closes only after the check went.
	// Esc never matches in a text field, so the part listens on the window for Esc from a field of the
	// check itself, after an open layer of that field.
	// Cmd+Enter runs the send only while the focus is in the check or on the body, and a held
	// Cmd+Enter that opened the check does not send. While the send runs, the action keeps the focus
	// with aria-disabled, and Esc does nothing.
	let {
		open = $bindable(false),
		form,
		title,
		description = 'Nothing goes out until you send it.',
		facts,
		preview,
		warnings,
		action,
		backLabel = 'Back to edit',
		blocked,
		working = false,
		failed,
		note,
		onsend,
		class: className,
		ref = $bindable(null),
		...rest
	}: SendCheckProps = $props();

	const uid = $props.id();
	let content = $state<HTMLElement | null>(null);
	let formBox = $state<HTMLElement | null>(null);
	/** The element of the form that had the focus last, which takes it again when the check goes back. */
	let last: HTMLElement | null = null;

	/** The keys in the form of aria-keyshortcuts, such as "Meta+Enter". "" when the key is off. */
	const sendHint = $derived(keyHint('submit').split(' ')[0] ?? '');
	const backHint = $derived(keyHint('escape').split(' ')[0] ?? '');
	/** The keys of the hint as a Kbd shows them: glyphs on macOS, words on other systems. */
	const NAMES: Readonly<Record<string, string>> = { Meta: '⌘', Control: 'Ctrl', Alt: 'Alt', Shift: 'Shift', Escape: 'Esc' };
	const shown = (hint: string) => (hint ? hint.split('+').map((k) => NAMES[k] ?? k) : []);
	const off = $derived(working || !!blocked);
	/** The controls of the form that can take the focus, the first of which takes it when no element of the form had it. */
	const CONTROLS =
		'a[href], button:not(:disabled), input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea:not(:disabled), [contenteditable]:not([contenteditable=false]), [tabindex]:not([tabindex="-1"])';

	function send() {
		if (off) return;
		onsend();
	}

	async function back() {
		if (working) return;
		open = false;
		await tick();
		// When the check opened with no focus in the form, such as from a key on the body, the first
		// control of the form takes the focus, and not the body.
		const to = last?.isConnected ? last : formBox?.querySelector<HTMLElement>(CONTROLS);
		to?.focus();
	}

	// Esc never matches in a text field (keys.ts), so Esc from a field of the check, such as a field of
	// the warnings, goes back here, as an alert dialog cancels from its field. The listener is on the
	// window, so it runs after an open layer of the field, such as the list of a combobox. Bits UI
	// listens on the document, closes the layer and prevents the default, so this Esc closes only the
	// layer, and the next Esc goes back. Esc from another element of the check reaches the binding at
	// the level of the item column, after a layer and the selection.
	function onkeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing || !inText(e)) return;
		if (!(e.target instanceof Node) || !content?.contains(e.target)) return;
		e.preventDefault();
		void back();
	}

	// The check takes the focus each time it opens, and not when the page starts with it open.
	let was = untrack(() => open);
	$effect(() => {
		const now = open;
		if (now && !was) void tick().then(() => content?.focus());
		was = now;
	});

	// A send that fails can leave the focus outside the check. The check then takes it again, when
	// the reason comes, and not when the check opens with a reason.
	let failedBefore = untrack(() => failed);
	$effect(() => {
		const now = failed;
		if (now && now !== failedBefore && content && !content.contains(document.activeElement)) content.focus();
		failedBefore = now;
	});

	$effect(() => {
		if (!open) return;
		const offs = [
			bindKey('escape', () => {
				void back();
			}),
			bindKey('submit', (e) => {
				// Cmd+Enter in a field of the page outside the check, or in a second check, is not for this
				// check. The binding declines, and the older binding of the key runs.
				const at = document.activeElement;
				if (at !== document.body && !content?.contains(at)) return false;
				if (!e.repeat) send();
			})
		];
		// Added after the bindings, so it runs after the listener of keys.ts too.
		window.addEventListener('keydown', onkeydown);
		return () => {
			offs.forEach((o) => o());
			window.removeEventListener('keydown', onkeydown);
		};
	});
</script>

<div bind:this={ref} data-slot="send-check" class={cn('flex flex-col', className)} {...rest}>
	<div bind:this={formBox} data-slot="send-check-form" hidden={open} onfocusin={(e) => (last = e.target instanceof HTMLElement ? e.target : last)}>
		{@render form()}
	</div>
	{#if open}
		<section
			bind:this={content}
			data-slot="send-check-content"
			tabindex="-1"
			aria-labelledby="{uid}-title"
			aria-describedby="{uid}-description"
			class="flex max-w-180 flex-col gap-4 text-sm outline-none"
		>
			<Alert.Root role="status">
				<InfoIcon />
				<Alert.Title id="{uid}-title">{title}</Alert.Title>
				<Alert.Description id="{uid}-description">{description}</Alert.Description>
			</Alert.Root>
			<Facts {facts} />
			{#if preview}<div data-slot="send-check-preview" class="flex flex-col gap-3">{@render preview()}</div>{/if}
			{#if warnings}<div data-slot="send-check-warnings" class="flex flex-col gap-2">{@render warnings()}</div>{/if}
			{#if failed}
				<div data-slot="send-check-failed" role="alert" class="flex items-start gap-2 text-destructive">
					<CircleAlertIcon class="mt-0.5 size-4 shrink-0" />
					<p class="min-w-0 flex-1">{failed}</p>
				</div>
			{/if}
			{#if blocked}<p id="{uid}-blocked" class="text-muted-foreground">{blocked}</p>{/if}
			<div class="flex flex-col gap-2">
				<div data-slot="send-check-actions" class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button variant="outline" aria-disabled={working ? 'true' : undefined} aria-keyshortcuts={backHint || undefined} class="aria-disabled:cursor-not-allowed aria-disabled:opacity-50" onclick={() => void back()}>
						{backLabel}
						{#if backHint}<Kbd.Root class="max-md:hidden">{shown(backHint).join('')}</Kbd.Root>{/if}
					</Button>
					<Button
						aria-disabled={off ? 'true' : undefined}
						aria-describedby={blocked ? `${uid}-blocked` : undefined}
						aria-busy={working || undefined}
						data-loading={working || undefined}
						aria-keyshortcuts={sendHint || undefined}
						class="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
						onclick={send}
					>
						{#if working}<Spinner data-icon="inline-start" />{/if}
						{action}
						{#if sendHint}
							<Kbd.Group class="max-md:hidden">
								{#each shown(sendHint) as key, i (i)}<Kbd.Root class="border border-primary-foreground/35 bg-transparent text-primary-foreground">{key}</Kbd.Root>{/each}
							</Kbd.Group>
						{/if}
					</Button>
				</div>
				{#if note}<p data-slot="send-check-note" class="text-xs text-muted-foreground sm:text-right">{note}</p>{/if}
			</div>
		</section>
	{/if}
</div>
