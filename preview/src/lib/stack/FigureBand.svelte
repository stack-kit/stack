<!--
	A band of key figures at the top of a summary page (DESIGN.md, `### figure-band`). The band reads
	the width of its own box with a container query, and not the window, because it also stands in
	the item column and in a pane. Below a box of 672 px two figures stand in a row; from 672 px
	(@2xl) every figure of the band stands in one row. A third figure alone in its row takes the whole
	row, so that the line under the row crosses the band. A band of one figure has one column at each
	width: the figure stands at the start, as wide as its parts, and the line under it crosses the
	band. On paper every figure stands in one row, as the key figures of a printed document do,
	although the column of A4 is 657 px. Each figure holds its label, its value in the figure step and
	its note: the change against a period in words, or the next fact. The three parts of the figures
	of one row stand on shared rows of the grid (subgrid), so that a label of two lines keeps the
	values of the row on one line. A figure with an address is one link over the whole figure, with
	the hover ground and the focus ring of a row. While the band loads, it keeps its labels and shows
	a still skeleton in place of each value and each note.
-->
<script lang="ts" module>
	export type Figure = {
		/** The name of the figure, such as "Open cases". */
		label: string;
		/** The value, formatted with Intl for the locale, such as "12" or "€12,480". */
		value: string;
		/** The change against a period in words, or the next fact, such as "3 more than yesterday". */
		note: string;
		/** The address of the list that the figure counts. A figure with no list is plain text. */
		href?: string;
		/** The values of the period, oldest first, and the accessible name of the sparkline. */
		trend?: { values: number[]; label: string };
	};
</script>

<script lang="ts">
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
	import { cn } from '#lib/utils.js';
	import Sparkline from './Sparkline.svelte';
	import type { ChartStyle } from './patterns.js';

	let {
		figures,
		label,
		loading = false,
		inset = 'page',
		style = 'pattern',
		class: className
	}: {
		/** One to four figures, in the order that the product sets. */
		figures: Figure[];
		/** The accessible name of the list, such as "Figures of today". */
		label: string;
		/** True until the values arrive. The labels show, and the values and the notes are a skeleton. */
		loading?: boolean;
		/** The side padding of the region that holds the band: a page, or a pane and the item column. */
		inset?: 'page' | 'pane';
		style?: ChartStyle;
		/** A class for the box, such as border-t when the band does not stand under an edge. */
		class?: string;
	} = $props();

	// Tailwind finds a class only as a whole word in the source, so each count names its class.
	const columns: Record<number, string> = {
		1: 'grid-cols-1',
		2: '',
		3: '@2xl:grid-cols-3 print:grid-cols-3',
		4: '@2xl:grid-cols-4 print:grid-cols-4'
	};
	// The figure of a band of one is as wide as its parts. Its item fills the row, so the line crosses the band.
	const one = $derived(figures.length === 1 && 'justify-self-start');
	const pad = $derived(inset === 'page' ? 'px-4 md:px-6' : 'px-4');
</script>

{#snippet parts(f: Figure)}
	<span data-slot="figure-band-label" class="text-xs text-muted-foreground">{f.label}</span>
	<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
		{#if loading}
			<div data-slot="figure-band-value" class="text-3xl font-semibold"><Skeleton class="inline-block h-7 w-20 align-middle" /></div>
			{#if f.trend}<Skeleton class="h-6 w-20" />{/if}
		{:else}
			<span data-slot="figure-band-value" class="text-3xl font-semibold whitespace-nowrap text-strong-foreground tabular-nums">{f.value}</span>
			{#if f.trend}<Sparkline values={f.trend.values} label={f.trend.label} {style} />{/if}
		{/if}
	</div>
	<div data-slot="figure-band-note" class="text-xs text-muted-foreground tabular-nums">
		{#if loading}<Skeleton class="inline-block h-3 w-28 align-middle" />{:else}{f.note}{/if}
	</div>
{/snippet}

<div data-slot="figure-band" class={cn('@container print:break-inside-avoid', className)} aria-busy={loading ? 'true' : undefined}>
	<ul role="list" aria-label={label} class={cn('grid grid-cols-2', columns[figures.length])}>
		{#each figures as f, i (f.label)}
			<li
				data-slot="figure-band-item"
				class={cn(
					'row-span-3 grid min-w-0 grid-rows-subgrid border-b border-border',
					figures.length === 3 && i === 2 && 'col-span-2 @2xl:col-span-1 print:col-span-1'
				)}
			>
				{#if f.href && !loading}
					<a
						href={f.href}
						class={cn(
							'row-span-3 grid cursor-pointer grid-rows-subgrid gap-y-1 py-3 outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset',
							pad,
							one
						)}
					>
						{@render parts(f)}
					</a>
				{:else}
					<div class={cn('row-span-3 grid grid-rows-subgrid gap-y-1 py-3', pad, one)}>{@render parts(f)}</div>
				{/if}
			</li>
		{/each}
	</ul>
</div>
