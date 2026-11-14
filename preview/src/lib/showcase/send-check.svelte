<script lang="ts">
	import { tick } from 'svelte';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import type { Fact } from '#lib/outside/Facts.svelte';
	import { bindKey } from '#lib/stack/behaviour/keys.js';
	import HtmlFrame from '#lib/stack/HtmlFrame.svelte';
	import SendCheck from '#lib/stack/SendCheck.svelte';

	// The check of a send in the place of its form. A person writes the note of an invoice and presses
	// Send, or Cmd+Enter in the note. The check takes the place of the form: the question, the facts in
	// the order of the alert dialog, the preview of the invoice that the product draws, and Back to edit
	// and the send. Esc goes back to the form, which keeps its text. After the send the invoice shows as
	// Sent, and the focus moves to that line. The second check is a reply to a mail: the product puts
	// the HTML part as it goes out into the preview, in an HTML frame from a sample page of the preview,
	// and a warning blocks the send until the person checks it. The third check is a message to many
	// recipients with no preview: the first send fails, and the check stays with the reason. Every
	// person, company and address is invented.
	const facts: Fact[] = [
		{ label: 'Invoice', value: 'INV-0042', id: true },
		{ label: 'To', value: 'Westbrook Supplies <accounts@westbrook.example>' },
		{ label: 'Amount', value: '€1,240.00' },
		{ label: 'Due', value: '14 Dec 2026' },
		{ label: 'File', value: 'INV-0042.pdf, 84 KB' }
	];
	const lines = [
		{ item: 'Oak shelf, 4 at €180.00', amount: '€720.00' },
		{ item: 'Delivery and assembly', amount: '€520.00' }
	];
	const NOTE = 'Thank you for the order. The shelves arrive on 2 Dec.';

	// The first check: the invoice, the send, and the line that shows it as Sent.
	let note = $state(NOTE);
	let open = $state(false);
	let working = $state(false);
	let sent = $state(false);
	let result = $state<HTMLElement | null>(null);
	let invoice = $state<HTMLDivElement | null>(null);

	// The form sends with Cmd+Enter from its note. The check binds the key while it shows, so the
	// newer binding runs, and this one only opens the check.
	$effect(() =>
		bindKey('submit', () => {
			if (!invoice?.contains(document.activeElement) || open) return false;
			open = true;
		})
	);

	async function send() {
		working = true;
		await new Promise((r) => setTimeout(r, 600));
		working = false;
		open = false;
		sent = true;
		await tick();
		result?.focus();
	}

	// The second check: a reply with the HTML part as it goes out, and a warning that blocks the send.
	const replyFacts: Fact[] = [
		{ label: 'From', value: 'Support <support@example.com>' },
		{ label: 'To', value: 'Ana Turner <ana.turner@example.org>' },
		{ label: 'Cc', value: 'Billing <billing@example.com>' },
		{ label: 'Subject', value: 'Re: Refund for order 8841' }
	];
	let open2 = $state(false);
	let leave = $state(false);
	let sent2 = $state(false);
	let result2 = $state<HTMLElement | null>(null);
	async function send2() {
		open2 = false;
		sent2 = true;
		await tick();
		result2?.focus();
	}
	// The third check: a message to many recipients. The first send fails, and the check stays with the
	// reason. The second send goes, and the focus moves to the line that says so.
	let open3 = $state(false);
	let working3 = $state(false);
	let failed = $state<string | undefined>();
	let sent3 = $state(false);
	let result3 = $state<HTMLElement | null>(null);
	let tries = 0;
	async function send3() {
		failed = undefined;
		working3 = true;
		await new Promise((r) => setTimeout(r, 600));
		working3 = false;
		tries += 1;
		if (tries % 2 === 1) {
			failed = 'The server did not answer, so the message did not go out. Send it again.';
			return;
		}
		open3 = false;
		sent3 = true;
		await tick();
		result3?.focus();
	}
</script>

<section id="showcase-send-check" data-showcase="send-check" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">send-check</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		The check of a send in the place of its form. Send, or Cmd+Enter in the note, shows the check: the question, the facts in the order of the alert
		dialog, the preview that the product draws, Back to edit and the send. Esc goes back to the form, which keeps its text. After the send the invoice
		shows as Sent. In the second check a mail product puts its reply into the preview with an HTML frame, and a warning blocks the send until the
		person checks it. The third check has no preview, and its first send fails: the check stays with the reason.
	</p>

	<h3 class="text-xs font-medium text-muted-foreground">An invoice to a customer, with the preview of the invoice</h3>
	<div class="flex max-w-3xl flex-col gap-4 rounded-lg border border-border p-4">
		{#if sent}
			<p bind:this={result} tabindex="-1" role="status" class="text-muted-foreground outline-none">
				INV-0042 is Sent to accounts@westbrook.example. <Button variant="outline" size="xs" onclick={() => (sent = false)}>Show the form again</Button>
			</p>
		{:else}
			<SendCheck
				bind:ref={invoice}
				bind:open
				title="Send the invoice INV-0042 to Westbrook Supplies?"
				{facts}
				action="Send to accounts@westbrook.example"
				note="It goes out at once, and the invoice then shows as Sent."
				{working}
				onsend={send}
			>
				{#snippet form()}
					<Field.Field>
						<Field.Label for="send-check-note">Note on the invoice</Field.Label>
						<Textarea id="send-check-note" bind:value={note} rows={3} />
					</Field.Field>
					<div class="mt-3 flex justify-end">
						<Button onclick={() => (open = true)}>Send</Button>
					</div>
				{/snippet}
				{#snippet preview()}
					<div class="flex flex-col gap-3 rounded-lg border border-border p-3">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head>Item</Table.Head>
									<Table.Head class="text-right">Amount</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each lines as line (line.item)}
									<Table.Row>
										<Table.Cell>{line.item}</Table.Cell>
										<Table.Cell class="text-right">{line.amount}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
							<Table.Footer>
								<Table.Row>
									<Table.Cell>Total</Table.Cell>
									<Table.Cell class="text-right">€1,240.00</Table.Cell>
								</Table.Row>
							</Table.Footer>
						</Table.Root>
						{#if note.trim()}<p class="whitespace-pre-line">{note}</p>{/if}
					</div>
				{/snippet}
			</SendCheck>
		{/if}
	</div>

	<h3 class="text-xs font-medium text-muted-foreground">A reply to a mail: the product puts the HTML part into the preview, and a warning blocks the send</h3>
	<div class="flex max-w-3xl flex-col gap-4 rounded-lg border border-border p-4">
		{#if sent2}
			<p bind:this={result2} tabindex="-1" role="status" class="text-muted-foreground outline-none">
				The reply waits to go out. <Button variant="outline" size="xs" onclick={() => (sent2 = false)}>Show the form again</Button>
			</p>
		{:else}
			<SendCheck
				bind:open={open2}
				title="Send the reply to Ana Turner?"
				facts={replyFacts}
				action="Send to ana.turner@example.org and 1 more"
				blocked={leave ? undefined : 'Check the warning to send.'}
				onsend={send2}
			>
				{#snippet form()}
					<p class="mb-3 text-muted-foreground">The editor of the product stands here. Its text and its 2 proposed changes stay while the check shows.</p>
					<div class="flex justify-end"><Button onclick={() => (open2 = true)}>Send</Button></div>
				{/snippet}
				{#snippet preview()}
					<div class="flex flex-col items-start gap-3 rounded-lg border border-dashed border-input p-3">
						<Badge variant="outline" class="border-input">As it goes out</Badge>
						<HtmlFrame src="/frames/reply.html" title="The reply to Ana Turner, as it goes out" />
					</div>
				{/snippet}
				{#snippet warnings()}
					<Field.Field orientation="horizontal">
						<Checkbox id="send-check-attachment" bind:checked={leave} />
						<Field.Label for="send-check-attachment">The text names an attachment, and the mail has none. Send it without one.</Field.Label>
					</Field.Field>
				{/snippet}
			</SendCheck>
		{/if}
	</div>

	<h3 class="text-xs font-medium text-muted-foreground">A message to many recipients, with no preview: the first send fails, and the check stays with the reason</h3>
	<div class="flex max-w-3xl flex-col gap-4 rounded-lg border border-border p-4">
		{#if sent3}
			<p bind:this={result3} tabindex="-1" role="status" class="text-muted-foreground outline-none">
				The message went out to 240 customers. <Button variant="outline" size="xs" onclick={() => (sent3 = false)}>Show the form again</Button>
			</p>
		{:else}
			<SendCheck
				bind:open={open3}
				title="Send the message to 240 customers?"
				facts={[
					{ label: 'Message', value: 'Our opening hours over the holidays', id: true },
					{ label: 'To', value: 'The customers with an open order, 240 people' },
					{ label: 'From', value: 'Support <support@example.com>' }
				]}
				action="Send to 240 customers"
				working={working3}
				{failed}
				onsend={send3}
			>
				{#snippet form()}
					<div class="flex justify-end"><Button onclick={() => (open3 = true)}>Send</Button></div>
				{/snippet}
			</SendCheck>
		{/if}
	</div>
</section>
