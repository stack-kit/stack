<script lang="ts">
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import Board, { type BoardColumn, type BoardPlace } from '#lib/stack/Board.svelte';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleDashedIcon from '@lucide/svelte/icons/circle-dashed';
	import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
	import CircleEllipsisIcon from '@lucide/svelte/icons/circle-ellipsis';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import type { Component } from 'svelte';

	// The leads of a sales pipeline in five columns, one for each stage. Proposal has a limit of
	// 3 and holds 4 leads, Won is empty, and Lost starts folded. A handle drags a card with a
	// pointer and lifts it with Space; More holds Move up, Move down and Move to. Each saved move
	// counts in data-moves, so that a probe can read it. Below 768 px the board shows one stage at
	// a time. Every name and amount is invented.
	type Lead = { id: string; key: string; title: string; amount: number; owner: string; next: string };
	const lead = (n: number, title: string, amount: number, owner: string, next: string): Lead => ({ id: `lead-${n}`, key: `LEAD-${String(n).padStart(4, '0')}`, title, amount, owner, next });

	const ICONS: Record<string, Component> = { new: CircleDashedIcon, contacted: CircleIcon, proposal: CircleDotIcon, review: CircleEllipsisIcon, won: CircleCheckIcon, lost: CircleXIcon };
	let columns = $state<BoardColumn<Lead>[]>([
		{
			id: 'new',
			label: 'New',
			items: [lead(41, 'Coffee roastery on the river bank', 1200, 'Ana', '28 Oct'), lead(44, 'Bicycle repair shop', 480, 'Marko', '29 Oct'), lead(47, 'Language school for adults', 2600, 'Ana', '30 Oct')]
		},
		{ id: 'contacted', label: 'Contacted', items: [lead(38, 'Dental clinic in the old town', 3400, 'Jelena', '27 Oct'), lead(39, 'Print shop with two branches', 950, 'Marko', '31 Oct')] },
		{
			id: 'proposal',
			label: 'Proposal',
			limit: 3,
			items: [
				lead(31, 'Hotel by the lake', 8800, 'Jelena', '26 Oct'),
				lead(33, 'Bakery with a café', 1500, 'Ana', '27 Oct'),
				lead(35, 'Architecture studio', 4100, 'Marko', '2 Nov'),
				lead(36, 'Yoga studio on two floors', 1900, 'Jelena', '3 Nov')
			]
		},
		{ id: 'won', label: 'Won', items: [] },
		{ id: 'lost', label: 'Lost', folded: true, items: [lead(22, 'Car wash at the ring road', 700, 'Marko', '—')] }
	]);
	let moves = $state(0);
	/** Manual keeps the order of the person. Amount sorts each column by the amount, the largest first. */
	let order = $state<'manual' | 'amount'>('manual');
	const byAmount = (a: Lead, b: Lead) => b.amount - a.amount;
	const sorted = { by: 'amount', place: (l: Lead, items: readonly Lead[]) => [...items, l].sort(byAmount).indexOf(l) };
	function setOrder(v: string) {
		if (v !== 'manual' && v !== 'amount') return;
		order = v;
		if (v === 'amount') columns = columns.map((c) => ({ ...c, items: [...c.items].sort(byAmount) }));
	}
	const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
	const segment = 'data-[state=on]:bg-background data-[state=on]:inset-ring data-[state=on]:inset-ring-border-strong max-md:min-w-11';
	const fold = (id: string, folded: boolean) => (columns = columns.map((c) => (c.id === id ? { ...c, folded } : c)));
	const moved = (_: Lead, __: BoardPlace, ___: BoardPlace) => moves++;
</script>

<section id="showcase-board" data-showcase="board" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">board</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		Drag a handle to another place or another column, or press Space on it and move the card with the arrow keys. More holds Move up, Move down
		and Move to. Proposal is over its limit of 3, Won is empty, and Lost is folded. Amount sorts each column, and a move then changes the
		column only. Below 768 px the board shows one stage at a time.
	</p>
	<ToggleGroup.Root type="single" size="sm" spacing={0.5} class="w-fit bg-muted p-0.5" aria-label="Order" bind:value={() => order, setOrder}>
		<ToggleGroup.Item value="manual" class={segment}>Manual</ToggleGroup.Item>
		<ToggleGroup.Item value="amount" class={segment}>Amount</ToggleGroup.Item>
	</ToggleGroup.Root>
	<div class="flex h-120 max-w-full flex-col overflow-hidden rounded-lg border border-border" data-moves={moves}>
		<Board bind:columns sorted={order === 'amount' ? sorted : undefined} label="Board of the leads" name={(l) => l.key} field="Stage" count={(n) => `${n} ${n === 1 ? 'lead' : 'leads'}`} onmove={moved} onfold={fold}>
			{#snippet icon(c)}
				{@const Icon = ICONS[c.id]}
				<Icon class="size-4 text-muted-foreground" />
			{/snippet}
			{#snippet lead(l)}
				<span class="text-xs font-medium">{l.key}</span>
			{/snippet}
			{#snippet card(l)}
				<a href="#showcase-board" class="line-clamp-2 font-medium outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:inset-ring-3 focus-visible:after:inset-ring-ring/50">{l.title}</a>
				<div class="flex flex-wrap gap-1"><Badge variant="outline" class="tabular-nums">{money.format(l.amount)}</Badge></div>
				<p class="flex gap-1.5 text-2xs text-muted-foreground"><span>{l.owner}</span><span aria-hidden="true">·</span><span class="tabular-nums">Next step {l.next}</span></p>
			{/snippet}
			{#snippet empty(c)}No lead in {c.label} yet.{/snippet}
			{#snippet menu(l)}
				<DropdownMenu.Item>Open {l.key}</DropdownMenu.Item>
			{/snippet}
		</Board>
	</div>
</section>
