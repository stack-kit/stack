<script lang="ts">
	import { tick } from 'svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import OutsidePage from './OutsidePage.svelte';
	import Facts, { type Fact } from './Facts.svelte';
	import { QUOTE, type LinkState } from './data.js';

	// The page of a signed link that approves a quote, in the eight states of "Link page" in
	// DESIGN.md. The address forces the first state. Approve quote then runs Working and Done, as
	// a product does after the POST, and Done moves the focus to the title, because the button
	// that had the focus is gone. The form posts with method="post", so it also works with no
	// script; the preview has no server, so the script stops the post.
	let { initial }: { initial: LinkState } = $props();

	// The address sets the first state; the buttons change it after that.
	// svelte-ignore state_referenced_locally
	let current = $state<LinkState>(initial);
	let sent = $state(false);
	let heading = $state<HTMLHeadingElement | null>(null);

	const VERB = 'Approve quote';
	const facts: Fact[] = [
		{ label: 'Quote', value: QUOTE.id, id: true },
		{ label: 'Client', value: QUOTE.client },
		{ label: 'Amount', value: QUOTE.amount },
		{ label: 'Valid until', value: QUOTE.validUntil }
	];

	const page = $derived.by(() => {
		switch (current) {
			case 'done':
				return {
					title: `You approved the quote ${QUOTE.id}`,
					text: `${QUOTE.client} sees the approval now. You can close this page.`,
					facts: [...facts, { label: 'Approved', value: QUOTE.doneAt }]
				};
			case 'expired':
				return {
					title: 'This link has expired',
					text: `A link to approve a quote works for ${QUOTE.linkDays} days. This link expired on ${QUOTE.expired}.`
				};
			case 'used':
				return {
					title: 'This link was already used',
					text: `The quote ${QUOTE.id} was approved on ${QUOTE.usedOn}. A link works only once.`
				};
			case 'changed':
				return {
					title: `The quote ${QUOTE.id} changed after the email`,
					text: `${QUOTE.client} changed the amount on ${QUOTE.changedOn}. To approve the quote as it is now, use a new link.`,
					facts: facts.map((f) => (f.label === 'Amount' ? { ...f, value: QUOTE.amountNow, was: QUOTE.amount } : f))
				};
			case 'not-valid':
				return {
					title: 'This link does not work',
					text: 'The address is not complete, or it changed. Open the link from the email again, or copy the whole address into the browser.'
				};
			default:
				return {
					title: `Approve the quote ${QUOTE.id}?`,
					text: `${VERB} accepts the quote as the facts below show it. Nothing changes until you choose ${VERB}.`,
					facts
				};
		}
	});

	// The title wraps on a phone, and the identifier in it keeps one line.
	const titleParts = $derived(page.title.split(QUOTE.id));
	const working = $derived(current === 'working');
	const hasVerb = $derived(['ready', 'working', 'failed', 'changed'].includes(current));
	const canResend = $derived(current === 'expired' || current === 'changed');

	async function approve(e: SubmitEvent) {
		e.preventDefault();
		if (current !== 'ready' && current !== 'failed') return;
		current = 'working';
		await new Promise((r) => setTimeout(r, 1200));
		current = 'done';
		await tick();
		heading?.focus();
	}
</script>

<OutsidePage title={page.title}>
	<div class="flex flex-col gap-2">
		<h1 bind:this={heading} tabindex="-1" class="text-xl font-semibold">
			{#each titleParts as part, i (i)}{#if i > 0}<span class="whitespace-nowrap">{QUOTE.id}</span>{/if}{part}{/each}
		</h1>
		<p class="text-sm text-muted-foreground">{page.text}</p>
	</div>

	{#if page.facts}
		<Facts facts={page.facts} />
	{/if}

	{#if hasVerb || canResend}
		<form method="post" class="flex flex-col" onsubmit={approve}>
			<div class="flex gap-2 max-md:flex-col">
				{#if hasVerb}
					{#if current === 'changed'}
						<!-- Disabled with a reason: in the tab order, and the visible state line is its
						     description, so it needs no tooltip. -->
						<Button
							type="submit"
							class="aria-disabled:cursor-not-allowed aria-disabled:opacity-50 max-md:w-full"
							aria-disabled="true"
							aria-describedby="link-reason"
							onclick={(e) => e.preventDefault()}><CheckIcon data-icon="inline-start" />{VERB}</Button
						>
					{:else}
						<Button type="submit" class="max-md:w-full" disabled={working} aria-busy={working || undefined} data-loading={working || undefined}>
							{#if working}<Spinner data-icon="inline-start" aria-label="Approving the quote" />{:else}<CheckIcon data-icon="inline-start" />{/if}{VERB}
						</Button>
					{/if}
				{/if}
				{#if canResend}
					<Button variant="outline" class="max-md:w-full" onclick={() => (sent = true)}>Send a new link</Button>
				{/if}
			</div>
			{#if current === 'changed'}
				<p id="link-reason" class="mt-2 text-xs text-muted-foreground">
					The quote changed after the email. Send a new link to approve it as it is now.
				</p>
			{/if}
			<!-- The two regions are in the page from the first render, so a screen reader reads each new text. -->
			<div role="status">
				{#if sent}<p class="mt-2 text-xs text-muted-foreground">A new link is on the way to the address that got this one.</p>{/if}
			</div>
			<div role="alert">
				{#if current === 'failed'}
					<p class="mt-2 flex items-start gap-2 text-sm text-destructive">
						<CircleXIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
						<span>The approval did not save. Choose {VERB} to try again. Request id <span class="font-mono text-xs">{QUOTE.requestId}</span>.</span>
					</p>
				{/if}
			</div>
		</form>
	{/if}
</OutsidePage>
