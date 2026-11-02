<script lang="ts" module>
	import type { Done, OutsideRoot, Refused } from './OutsidePage.svelte';

	/** A step that spent the link: the new recovery code, which the page shows once. */
	export type WithCode = { ok: true; recoveryCode: string };

	export type SetupLinkPageProps = OutsideRoot & {
		/** The title of the step. With none, the title names the product, such as "Set up a passkey for Product". */
		title?: string;
		/** "Create a passkey": the browser makes a passkey, and the server saves it and spends the link. */
		addPasskey: () => Promise<WithCode | Refused<'cancelled' | 'failed'>>;
		/** "Not now": the server spends the link with no passkey, for this session only. */
		notNow: () => Promise<WithCode | Refused<'failed'>>;
		/** Continue under the recovery code: the person is in, and the product goes on. */
		ondone: Done;
		/** The address that Not now posts to with no script. With none, it posts to the address of the page. */
		action?: string;
		/** The h1 of the page, for the focus after a step that removes the buttons, as on OutsidePage. */
		titleRef?: HTMLHeadingElement | null;
	};
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import CodeBlock from '#lib/stack/CodeBlock.svelte';
	import { cn } from '#lib/utils.js';
	import OutsidePage from './OutsidePage.svelte';
	import StateLine from './StateLine.svelte';

	// The page of a setup link, as "Setup link" in DESIGN.md: the step "Make a passkey on this device"
	// with "Create a passkey" as its action. Not now calls notNow, which spends the token of the link.
	// With no script, Not now is a form that posts. After the new passkey or Not now, the page shows
	// the new recovery code once, as "Recovery code" says, and Continue runs ondone. A link that does
	// not work is the error page of a link page, so this page has no such state. The recovery page
	// shows this page after a right code, with the title of its step.
	let {
		product,
		title,
		addPasskey,
		notNow,
		ondone,
		action,
		titleRef = $bindable(null),
		class: className,
		ref = $bindable(null),
		...rest
	}: SetupLinkPageProps = $props();

	let recovery = $state<string | null>(null);
	/** The answer of the last step: Waiting, a cancel or a failure of Create a passkey, or a failure of Not now. */
	let answer = $state<'ready' | 'waiting' | 'cancelled' | 'failed' | 'not-now-failed'>('ready');
	let button = $state<HTMLElement | null>(null);
	let sending = false;

	const waiting = $derived(answer === 'waiting');
	const LINES = {
		waiting: { kind: 'wait', text: 'Follow the steps in the window of your browser.' },
		failed: { kind: 'fail', text: 'This app could not save the passkey. Choose Create a passkey to try again, or choose Not now.' },
		cancelled: { kind: 'cancel', text: 'No passkey was made. Choose Create a passkey to try again, or choose Not now.' },
		'not-now-failed': { kind: 'fail', text: 'This app could not save your choice. Choose Not now to try again, or choose Create a passkey.' }
	} as const;
	const line = $derived(answer === 'ready' ? undefined : LINES[answer]);

	/** Shows the recovery code, and puts the focus on the title, because the buttons are gone. */
	async function show(code: string) {
		recovery = code;
		answer = 'ready';
		await tick();
		titleRef?.focus();
	}

	async function create() {
		answer = 'waiting';
		const result = await addPasskey().catch((): Refused<'failed'> => ({ ok: false, state: 'failed' }));
		if (result.ok) return show(result.recoveryCode);
		answer = result.state;
		await tick();
		button?.focus();
	}

	async function skip(e: SubmitEvent) {
		e.preventDefault();
		if (sending || waiting) return;
		sending = true;
		const result = await notNow()
			.catch((): Refused<'failed'> => ({ ok: false, state: 'failed' }))
			.finally(() => (sending = false));
		if (result.ok) return show(result.recoveryCode);
		answer = 'not-now-failed';
	}
</script>

<OutsidePage
	bind:ref
	bind:titleRef
	{product}
	title={recovery === null ? (title ?? `Set up a passkey for ${product.name}`) : 'Save your recovery code'}
	text={recovery === null
		? 'With a passkey here, this device signs in with no code next time. On a computer that you borrowed, choose Not now: you then stay signed in for this session only.'
		: 'This code gets you in with no passkey and no device. It works once, and this page shows it only now.'}
	noscript={recovery === null ? 'A passkey needs JavaScript. Turn on JavaScript, or choose Not now.' : undefined}
	data-slot="setup-link-page"
	class={cn(className)}
	{...rest}
>
	{#if recovery === null}
		<form method="post" {action} class="flex flex-col" onsubmit={skip}>
			<div class="flex gap-2 max-md:flex-col">
				<Button
					bind:ref={button}
					data-needs-js
					class="max-md:w-full"
					disabled={waiting}
					aria-busy={waiting || undefined}
					data-loading={waiting || undefined}
					onclick={create}
				>
					{#if waiting}<Spinner data-icon="inline-start" aria-label="Making a passkey" />{:else}<KeyRoundIcon data-icon="inline-start" />{/if}Create a passkey
				</Button>
				<Button type="submit" name="choice" value="not-now" variant="outline" class="max-md:w-full">Not now</Button>
			</div>
			<StateLine kind={line?.kind} text={line?.text} />
		</form>
	{:else}
		<CodeBlock code={recovery} aria-label="Recovery code" />
		<div class="flex gap-2 max-md:flex-col">
			<Button class="max-md:w-full" onclick={() => ondone()}>Continue</Button>
			<Button variant="outline" class="max-md:w-full" onclick={() => window.print()}>Print</Button>
		</div>
	{/if}
</OutsidePage>
