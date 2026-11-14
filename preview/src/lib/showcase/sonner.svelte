<script lang="ts">
	import { Toaster } from '#lib/components/ui/sonner/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { forcedOpen } from '#lib/preview/view.svelte.js';
	import { endToast, plainToast, undoToast } from '#lib/stack/behaviour/undo.js';
	import { onMount } from 'svelte';

	// Each kind of plainToast. A toast with Undo is in the rows under these buttons.
	const kinds = [
		['message', () => plainToast('A plain message', { description: 'With a description.' })],
		['success', () => plainToast('Saved', { kind: 'success' })],
		['info', () => plainToast('Two people are editing', { kind: 'info' })],
		['warning', () => plainToast('The link expires today', { kind: 'warning' })],
		['error', () => plainToast('The upload failed', { kind: 'error' })]
	] as const;

	// With ?open=sonner every kind shows at once and stays for ten minutes, so that the probe
	// can measure it. Not Infinity: a browser timer runs an infinite delay at once.
	const forced = forcedOpen('sonner');
	onMount(() => {
		if (forced) for (const [, show] of kinds) show();
	});

	// A reply that the product holds for 30 s before it sends it. The toast ends when the hold ends,
	// and hover does not pause it. Send now ends the hold and the toast before that time. The line
	// under the buttons is no live region, so it may change while the toast shows.
	const clock = (at: Date) => at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	let reply = $state('No reply waits.');
	function send() {
		const at = new Date(Date.now() + 30_000);
		// A second send takes the place of the first toast and runs the onend of the first, so the line
		// changes after undoToast.
		undoToast(`The reply to Ruth Fenwick goes out at ${clock(at)}`, {
			id: 'showcase-send',
			until: at,
			undo: () => {
				reply = 'The reply is back in the draft.';
			},
			onend: () => {
				reply = `The chance to undo ended. The reply goes out at ${clock(at)}.`;
			}
		});
		reply = `The reply waits until ${clock(at)}.`;
	}

	// Three orders move into a new batch. Open opens the batch and ends the toast, and Undo moves the
	// orders back. The line under the buttons stands for the batch.
	let batch = $state('The orders wait in the inbox.');
	function toBatch() {
		batch = 'Batch 7 holds the 3 orders.';
		undoToast('Batch 7 created. 3 orders moved.', {
			id: 'showcase-batch',
			undo: () => {
				batch = 'The orders are back in the inbox.';
			},
			open: () => {
				batch = 'Batch 7 is open, by Open of the toast.';
			}
		});
	}

	// Five orders archived one by one: five toasts with Undo wait. The stack shows three, and the bar
	// under it holds "+2 more" and Close all. Close all runs the onend of each toast.
	let archived = $state('No order is archived.');
	let ends = 0;
	function archiveFive() {
		ends = 0;
		archived = '5 orders archived.';
		for (const n of [1, 2, 3, 4, 5]) {
			undoToast(`Order ${n} archived`, {
				id: `showcase-order-${n}`,
				undo: () => {
					archived = `Order ${n} is back in the inbox.`;
				},
				onend: () => {
					ends += 1;
					archived = `The chance to undo ended for ${ends} of the 5 orders.`;
				}
			});
		}
	}
</script>

<section id="showcase-sonner" data-showcase="sonner" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">sonner</h2>
	<Toaster expand={forced} duration={forced ? 600_000 : 4000} visibleToasts={forced ? kinds.length : 3} />
	<div class="flex flex-wrap gap-2">
		{#each kinds as [kind, show], i (kind)}
			<Button variant="outline" onclick={show} data-open-id={i === 0 ? 'sonner' : undefined}>Show {kind}</Button>
		{/each}
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">Undo until the time of a send</h3>
	<div class="flex flex-wrap items-center gap-2">
		<Button variant="outline" onclick={send}>Send the reply</Button>
		<Button variant="outline" onclick={() => endToast('showcase-send')}>Send now</Button>
		<p class="text-sm text-muted-foreground">{reply}</p>
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">Undo and Open for the result of a move</h3>
	<div class="flex flex-wrap items-center gap-2">
		<Button variant="outline" onclick={toBatch}>Move 3 orders to a new batch</Button>
		<p class="text-sm text-muted-foreground">{batch}</p>
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">Toasts that wait, with Close all and +N more</h3>
	<div class="flex flex-wrap items-center gap-2">
		<Button variant="outline" onclick={archiveFive}>Archive 5 orders</Button>
		<p class="text-sm text-muted-foreground">{archived}</p>
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">A failure with no Undo</h3>
	<div class="flex flex-wrap items-center gap-2">
		<Button
			variant="outline"
			onclick={() =>
				plainToast('The export did not finish.', { id: 'showcase-export', kind: 'error', description: 'The service did not answer. Try again in a minute.' })}
		>
			Export the report
		</Button>
	</div>
</section>
