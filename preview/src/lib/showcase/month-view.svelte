<script lang="ts">
	import { CalendarDate } from '@internationalized/date';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import MonthView from '#lib/stack/MonthView.svelte';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';

	// The invoices of November 2026 on the day that each falls due, with today fixed at 18
	// November so that every render and every measurement shows the same month. 18 November holds
	// six invoices, so it shows three and "3 more". The locale switch shows the first day of the
	// week of each locale. Every client and amount is invented.
	type Invoice = { id: string; key: string; client: string; paid: boolean };
	const due: [string, string, boolean][] = [
		['2026-11-02', 'Northwind Trading', true],
		['2026-11-03', 'Harbour Studio', true],
		['2026-11-03', 'Linden Bakery', true],
		['2026-11-09', 'Atlas Engineering', true],
		['2026-11-12', 'Quarry Lane Dental', false],
		['2026-11-16', 'Meridian Freight', false],
		['2026-11-18', 'Copperleaf Books', false],
		['2026-11-18', 'Silver Birch Hotel', false],
		['2026-11-18', 'Lakeside Rowing Club', false],
		['2026-11-18', 'Old Mill Pottery', false],
		['2026-11-18', 'Riverside Pharmacy', false],
		['2026-11-18', 'Tram Depot Café', false],
		['2026-11-20', 'Hillcrest Kennels', false],
		['2026-11-24', 'North Pier Ferries', false],
		['2026-11-24', 'Saltworks Gallery', false],
		['2026-11-30', 'Orchard Lane Florist', false]
	];
	const days = new Map<string, Invoice[]>();
	due.forEach(([day, client, paid], i) => {
		const inv = { id: `inv-${i}`, key: `INV-${String(81 + i).padStart(4, '0')}`, client, paid };
		days.set(day, [...(days.get(day) ?? []), inv]);
	});
	const today = new CalendarDate(2026, 11, 18);
	let month = $state(today);
	let locale = $state('en-GB');
</script>

<section id="showcase-month-view" data-showcase="month-view" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">month-view</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		Invoices by their due date. Tab into the grid, then move with the arrow keys, Home, End, Page Up and Page Down, and press Enter on a day.
		18 November holds six invoices, so it shows three and "3 more". Below 768 px the month is a list by day.
	</p>
	<ToggleGroup.Root type="single" size="sm" spacing={0.5} class="w-fit bg-muted p-0.5" aria-label="Locale" bind:value={() => locale, (v) => v && (locale = v)}>
		{#each ['en-GB', 'en-US', 'sr-Latn-RS'] as l (l)}
			<ToggleGroup.Item value={l} class="data-[state=on]:bg-background data-[state=on]:inset-ring data-[state=on]:inset-ring-border-strong max-md:min-w-11">{l}</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>
	<div class="flex h-180 max-w-5xl flex-col max-md:h-auto">
		<MonthView bind:month {today} {locale} {days} count={(n) => `${n} ${n === 1 ? 'invoice' : 'invoices'}`}>
			{#snippet record(inv, tabindex)}
				<a
					href="#showcase-month-view"
					{tabindex}
					aria-label="{inv.key}, {inv.client}, {inv.paid ? 'paid' : 'open'}"
					class="flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 text-xs outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 max-md:text-sm"
				>
					{#if inv.paid}<CircleCheckIcon class="size-3.5 shrink-0 text-muted-foreground" />{:else}<CircleIcon class="size-3.5 shrink-0 text-muted-foreground" />{/if}
					<span class={['truncate', inv.paid && 'text-muted-foreground']}>{inv.client}</span>
				</a>
			{/snippet}
			{#snippet empty()}No invoice falls due in this month.{/snippet}
		</MonthView>
	</div>
</section>
