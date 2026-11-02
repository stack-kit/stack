<script lang="ts" module>
	import type { Fact } from './Facts.svelte';
	import type { OutsideRoot, Refused } from './OutsidePage.svelte';

	/** The eight states of a link page. Working shows only while act runs. */
	export type LinkState = 'ready' | 'working' | 'done' | 'expired' | 'used' | 'changed' | 'failed' | 'not-valid';
	/** A POST that failed on the server, with the request id of its answer, which the state line of Failed shows. */
	export type LinkFailed = Refused<'failed'> & { requestId?: string };
	/**
	 * The texts of the states that name the object and its times. The page writes the titles of Expired
	 * and Already used, the whole of Not valid, and the line of Failed.
	 */
	export type LinkTexts = {
		/** Done: the result as the title, such as "You approved the quote QUO-0042", and what happens next. */
		done: { title: string; text: string };
		/** Expired: when the link expired, and how long a link works. With no resend, it also names who sends a new link. */
		expired: string;
		/** Already used: when the link was used, and its result. */
		used: string;
		/**
		 * Changed: what changed after the email as the title, who changed it and when, and the reason of the
		 * disabled button. With none, the page writes a general text, for an object that does not change.
		 */
		changed?: { title: string; text: string; reason: string };
	};

	export type LinkPageProps = OutsideRoot & {
		/** The state that the server found for the token on the GET, or the result of a POST with no script. */
		initial: Exclude<LinkState, 'working'>;
		/** The title of Ready, Working and Failed: the action and the object as a question, such as "Approve the quote QUO-0042?". */
		title: string;
		/** The text of Ready, Working and Failed: what the action does. The page adds "Nothing changes until you choose" and the verb. */
		text: string;
		/** The label of the primary button, which repeats the verb of the button in the email, such as "Approve quote". */
		verb: string;
		/**
		 * The facts that the action fixes. Expired and Not valid show none. The fact with id is the identifier, which keeps one line in the title.
		 * In Expired and Not valid, give `facts: []` and no text that names the object. The part draws none of it, and a server page sends its props to the browser.
		 */
		facts: Fact[];
		/** The texts of Done, Expired, Already used and Changed. */
		texts: LinkTexts;
		/**
		 * The primary button: the POST that spends the token and runs the action. A rejection is the state
		 * failed. With facts, Done shows them in the place of the facts, such as with the time of the action.
		 */
		act: () => Promise<{ ok: true; facts?: Fact[] } | Refused<'expired' | 'used' | 'changed'> | LinkFailed>;
		/** "Send a new link" in Expired and Changed: the POST that sends the link again to the address that got the email. With none, the page has no such button. */
		resend?: () => Promise<{ ok: true } | Refused<'failed'>>;
		/** The request id of a failed POST with no script, which the state line of Failed shows. */
		requestId?: string;
		/** destructive for an action that deletes or ends something, such as the end of a subscription. */
		variant?: 'default' | 'destructive';
		/**
		 * The address that the form posts to with no script: the primary button with no field, and Send a
		 * new link with the field choice=resend. With none, the form posts to the address of the page.
		 */
		action?: string;
	};

	/** The whole of Not valid, which the link page and the read-only link share. */
	export const NOT_VALID = {
		title: 'This link does not work',
		text: 'The address is not complete, or it changed. Open the link from the email again, or copy the whole address into the browser.'
	};
	const CHANGED = {
		title: 'This changed after the email',
		reason: 'This changed after the email.'
	};
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { cn } from '#lib/utils.js';
	import Facts from './Facts.svelte';
	import OutsidePage from './OutsidePage.svelte';
	import StateLine from './StateLine.svelte';

	// The page of a signed link, in the eight states of "Link page" in DESIGN.md. The server gives the
	// first state. The primary button runs act, as the POST of the form: Working, then the state of the
	// answer. Done and the refusals move the focus to the title, because the button that had the focus
	// changes or goes. Failed gives the focus back to the button, which tries again. The form posts with
	// method="post", so it also works with no script: the product then answers the POST with the page in
	// its next state, as initial.
	let {
		product,
		initial,
		title,
		text,
		verb,
		facts,
		texts,
		act,
		resend,
		requestId,
		variant = 'default',
		action,
		class: className,
		ref = $bindable(null),
		...rest
	}: LinkPageProps = $props();

	const uid = $props.id();
	// The server sets the first state; the buttons change it after that.
	// svelte-ignore state_referenced_locally
	let current = $state<LinkState>(initial);
	// svelte-ignore state_referenced_locally
	let failedId = $state(requestId);
	let doneFacts = $state<Fact[] | null>(null);
	let sent = $state<'sent' | 'failed' | null>(null);
	let heading = $state<HTMLHeadingElement | null>(null);
	let button = $state<HTMLElement | null>(null);
	let sending = false;

	const changed = $derived(
		texts.changed ?? {
			...CHANGED,
			text: resend ? 'To see it as it is now, use a new link.' : 'What this page shows may not match the email any more.'
		}
	);
	const view = $derived.by((): { title: string; text: string; facts?: Fact[] } => {
		switch (current) {
			case 'done':
				return { ...texts.done, facts: doneFacts ?? facts };
			case 'expired':
				return { title: 'This link has expired', text: texts.expired };
			case 'used':
				return { title: 'This link was already used', text: texts.used, facts };
			case 'changed':
				return { title: changed.title, text: changed.text, facts };
			case 'not-valid':
				return NOT_VALID;
			default:
				return { title, text: `${text} Nothing changes until you choose ${verb}.`, facts };
		}
	});

	// The title wraps on a phone, and the identifier in it keeps one line.
	const identifier = $derived(facts.find((f) => f.id)?.value);
	const titleParts = $derived(identifier ? view.title.split(identifier) : [view.title]);
	const working = $derived(current === 'working');
	const hasVerb = $derived(['ready', 'working', 'failed', 'changed'].includes(current));
	const canResend = $derived(!!resend && (current === 'expired' || current === 'changed'));
	const answer = $derived(
		current === 'failed'
			? { kind: 'fail' as const, text: `This app could not save your choice. Choose ${verb} to try again.` }
			: sent === 'failed'
				? { kind: 'fail' as const, text: 'This app could not send a new link. Choose Send a new link to try again.' }
				: sent === 'sent'
					? { kind: 'wait' as const, text: 'A new link is on the way to the address that got this one.' }
					: undefined
	);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (e.submitter?.getAttribute('value') === 'resend') return send();
		if (current !== 'ready' && current !== 'failed') return;
		current = 'working';
		const result = await Promise.resolve().then(act).catch((): LinkFailed => ({ ok: false, state: 'failed' }));
		if (result.ok) {
			doneFacts = result.facts ?? null;
			current = 'done';
		} else {
			current = result.state;
			if (result.state === 'failed') failedId = result.requestId;
		}
		await tick();
		(current === 'failed' ? button : heading)?.focus();
	}

	async function send() {
		if (sending || !resend) return;
		sending = true;
		const result = await resend()
			.catch((): Refused<'failed'> => ({ ok: false, state: 'failed' }))
			.finally(() => (sending = false));
		sent = result.ok ? 'sent' : 'failed';
	}
</script>

<OutsidePage bind:ref {product} title={view.title} data-slot="link-page" class={cn(className)} {...rest}>
	<div class="flex flex-col gap-2">
		<h1 bind:this={heading} tabindex="-1" class="text-xl font-semibold">
			{#each titleParts as part, i (i)}{#if i > 0}<span class="whitespace-nowrap">{identifier}</span>{/if}{part}{/each}
		</h1>
		<p class="text-sm text-muted-foreground">{view.text}</p>
	</div>

	{#if view.facts}
		<Facts facts={view.facts} />
	{/if}

	{#if hasVerb || canResend}
		<form method="post" {action} class="flex flex-col" onsubmit={submit}>
			<div class="flex gap-2 max-md:flex-col">
				{#if hasVerb}
					{#if current === 'changed'}
						<!-- Disabled with a reason: in the tab order, and the visible state line is its
						     description, so it needs no tooltip. -->
						<Button
							{variant}
							class="aria-disabled:cursor-not-allowed aria-disabled:opacity-50 max-md:w-full"
							aria-disabled="true"
							aria-describedby="{uid}-reason"><CheckIcon data-icon="inline-start" />{verb}</Button
						>
					{:else}
						<Button
							bind:ref={button}
							type="submit"
							{variant}
							class="max-md:w-full"
							disabled={working}
							aria-busy={working || undefined}
							data-loading={working || undefined}
						>
							{#if working}<Spinner data-icon="inline-start" aria-label="Working" />{:else}<CheckIcon data-icon="inline-start" />{/if}{verb}
						</Button>
					{/if}
				{/if}
				{#if canResend}
					<Button type="submit" name="choice" value="resend" variant="outline" class="max-md:w-full">Send a new link</Button>
				{/if}
			</div>
			{#if current === 'changed'}
				<StateLine id="{uid}-reason" kind="wait" text={changed.reason} />
			{/if}
			<!-- The line is in the page from the first render, so a screen reader reads each new text.
			     Svelte trims the space at the start of a block, so the space before the request id is an expression. -->
			<StateLine kind={answer?.kind}>
				{answer?.text}{#if current === 'failed' && failedId}{' '}Request id <span class="font-mono text-xs">{failedId}</span>.{/if}
			</StateLine>
		</form>
	{/if}
</OutsidePage>
