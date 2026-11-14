<script lang="ts">
	import { tick } from 'svelte';
	import ItemColumns from '#lib/stack/ItemColumns.svelte';
	import ItemPage from '#lib/stack/ItemPage.svelte';
	import ListSplit from '#lib/stack/ListSplit.svelte';
	import SplitRow from '#lib/stack/SplitRow.svelte';

	// A list of refund requests that a person reviews in order, in the page form: a click or Enter on a
	// row opens the request as a page in place of the list. The bar holds Back, the path and the
	// position with its steps. Billing is a level with no page of its own, so its crumb has no link,
	// and the request, the last crumb, is the current page. J and K step, and Esc and Back show the list
	// again, at its scroll position, with the focus on the row of the request. The properties stay in
	// view while the request scrolls. The showcase keeps the request itself, so it gives the item page
	// key, onstep and onback, and writes no address. The page has no FramePlace, so the bar stands over
	// the request; in a product it takes the place of the content of the top bar. Every request,
	// client and amount is invented.
	type Request = { key: string; title: string; client: string; amount: string; received: string; datetime: string; status: string; text: string[] };
	const said = [
		'The client returned the goods within the time of the terms, and the parcel arrived with every item in its box.',
		'The order was paid with a card, so the refund goes back to the same card. The bank shows it within five working days.',
		'The cost of the return label stays with the client, as the terms of the order say.',
		'Check the photos of the goods before the refund. A damaged item gets a part of the amount only.'
	];
	const requests: Request[] = [
		['REF-0311', 'Refund for order 8841', 'Harbour Studio', '1,240.00', '18 Nov 13:52', '2026-11-18T13:52', 'Open'],
		['REF-0310', 'Two chairs returned unopened', 'Northwind Bakery', '312.00', '18 Nov 11:05', '2026-11-18T11:05', 'Open'],
		['REF-0309', 'Wrong size of the desk lamps', 'Pine Street Dental', '86.50', '17 Nov 16:40', '2026-11-17T16:40', 'Waiting'],
		['REF-0308', 'Parcel damaged on arrival, with photos of the box', 'Blue Fern Garden', '2,075.25', '17 Nov 09:12', '2026-11-17T09:12', 'Open'],
		['REF-0307', 'Second charge for one order', 'Copper Kettle Cafe', '145.90', '16 Nov 15:30', '2026-11-16T15:30', 'Open'],
		['REF-0306', 'Late delivery of the printer paper', 'Silver Birch Hotel', '58.00', '16 Nov 10:48', '2026-11-16T10:48', 'Waiting'],
		['REF-0305', 'Return of a gift card', 'Linden Books', '50.00', '15 Nov 17:20', '2026-11-15T17:20', 'Open'],
		['REF-0304', 'Missing part of a shelf', 'Quarry Lane Dental', '74.30', '15 Nov 08:55', '2026-11-15T08:55', 'Open'],
		['REF-0303', 'Cancelled order of office chairs', 'Meridian Freight', '980.00', '14 Nov 14:05', '2026-11-14T14:05', 'Waiting'],
		['REF-0302', 'Price changed after the order', 'Atlas Engineering', '42.10', '14 Nov 09:40', '2026-11-14T09:40', 'Open'],
		['REF-0301', 'Coffee machine sent twice', 'Harbour Studio', '415.00', '13 Nov 16:15', '2026-11-13T16:15', 'Open'],
		['REF-0300', 'Return of unused paint', 'Northwind Bakery', '67.80', '13 Nov 11:30', '2026-11-13T11:30', 'Waiting'],
		['REF-0299', 'Wrong colour of the curtains', 'Pine Street Dental', '129.00', '12 Nov 15:50', '2026-11-12T15:50', 'Open'],
		['REF-0298', 'Discount missing on the invoice', 'Blue Fern Garden', '35.00', '12 Nov 10:20', '2026-11-12T10:20', 'Open']
	].map(([key, title, client, amount, received, datetime, status]) => ({ key, title, client, amount, received, datetime, status, text: [...said, ...said, ...said] }));

	const uid = $props.id();
	const rowId = (key: string) => `${uid}-row-${key}`;
	/** The request of the page, or null while the list shows. */
	let opened = $state<string | null>(null);
	/** The root of the list split, and the scroll position of its list when a request opened. */
	let split = $state<HTMLDivElement | null>(null);
	let scroll = 0;
	const request = $derived(requests.find((r) => r.key === opened));
	const position = $derived(request ? requests.indexOf(request) + 1 : 0);

	function open(key: string) {
		scroll = split?.querySelector('[data-slot=list-split-list]')?.scrollTop ?? 0;
		opened = key;
	}
	function step(by: 1 | -1) {
		const next = requests[position - 1 + by];
		if (next) opened = next.key;
	}
	async function back() {
		const key = opened;
		opened = null;
		await tick();
		const list = split?.querySelector('[data-slot=list-split-list]');
		if (list) list.scrollTop = scroll;
		if (key) document.getElementById(rowId(key))?.focus();
	}
</script>

<section id="showcase-item-page" data-showcase="item-page" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">item-page</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		A list in the page form: a click or Enter on a row opens the request as a page in place of the list. The bar holds Back, the path and the
		position with its steps. J and K step, and Esc and Back show the list again, at its scroll position, with the focus on the row. The
		properties stay in view while the request scrolls. In a product the bar takes the place of the content of the top bar.
	</p>

	<div data-probe="item-page-frame" class="flex h-96 max-w-full flex-col overflow-hidden rounded-lg border border-border">
		{#if request}
			{@const r = request}
			<ItemPage
				key={r.key}
				label="Request {r.key}"
				crumbs={[{ label: 'Billing' }, { label: 'Refunds', href: '#showcase-item-page' }, { label: r.key }]}
				{position}
				count={requests.length}
				onstep={step}
				onback={back}
			>
				<ItemColumns class="p-0" sideLabel="Properties" stickyProperties>
					{#snippet header()}
						<div class="flex flex-col gap-1">
							<span class="text-base font-semibold tabular-nums">{r.key}</span>
							<h3 class="text-xl font-semibold text-strong-foreground">{r.title}</h3>
						</div>
					{/snippet}
					{#snippet content()}
						{#each r.text as line, i (i)}<p class="text-md">{line}</p>{/each}
					{/snippet}
					{#snippet properties()}
						<dl class="flex flex-col text-xs">
							{#each [['Status', r.status], ['Client', r.client], ['Amount', r.amount], ['Received', r.received]] as [label, value] (label)}
								<div class="flex min-h-7.5 items-center">
									<dt class="w-28 shrink-0 text-muted-foreground">{label}</dt>
									<dd class="min-w-0 tabular-nums">{value}</dd>
								</div>
							{/each}
						</dl>
					{/snippet}
				</ItemColumns>
			</ItemPage>
		{:else}
			<ListSplit bind:ref={split} open={false} listLabel="Refund requests" itemLabel="Request">
				{#snippet list()}
					<ul>
						{#each requests as r (r.key)}
							<SplitRow id={rowId(r.key)} oneLine onopen={() => open(r.key)}>
								{#snippet line1()}<span class="mr-1.5 font-medium tabular-nums">{r.key}</span>{r.title}{/snippet}
								{#snippet end1()}<time datetime={r.datetime}>{r.received}</time>{/snippet}
								{#snippet line2()}{r.status} · {r.client} · {r.amount}{/snippet}
							</SplitRow>
						{/each}
					</ul>
				{/snippet}
			</ListSplit>
		{/if}
	</div>
</section>
