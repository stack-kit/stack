<script lang="ts">
	import FigureBand, { type Figure } from '#lib/stack/FigureBand.svelte';

	// The key figures of an invoicing back office on the morning of 2026-10-26. STACK invented every
	// figure, client and address. The links go to a list of this page, so that the showcase stays here.
	const today: Figure[] = [
		{ label: 'Open invoices', value: '41', note: 'The same as last week', href: '#showcase-figure-band' },
		{ label: 'Paid this month', value: '€12,480', note: '€1,050 less than September', href: '#showcase-figure-band' },
		{ label: 'Overdue', value: '3', note: '1 is due today', href: '#showcase-figure-band' },
		{ label: 'Failed bank imports', value: '0', note: 'None since Monday', href: '#showcase-figure-band' }
	];
	const report: Figure[] = [
		{ label: 'Documents sent', value: '128', note: '12 more than last week' },
		{ label: 'Clients who paid within the term', value: '86%', note: 'Up 4 points from September' },
		{ label: 'Average days to pay', value: '19', note: '2 fewer than September' }
	];
	const month: Figure[] = [{ label: 'Paid this month', value: '€12,480', note: '€1,050 less than September', href: '#showcase-figure-band' }];
	const views = [231, 244, 238, 262, 251, 270, 266, 281, 275, 290, 286, 279, 301, 313];
	const signups = [9, 11, 8, 12, 10, 9, 13, 12, 11, 14, 12, 15, 13, 12];
	const traffic: Figure[] = [
		{
			label: 'Page views',
			value: '3,887',
			note: 'Up 17% from 3,322 in the 14 days before',
			href: '#showcase-figure-band',
			trend: { values: views, label: 'Page views per day, 13 to 26 October: from 231 to 313' }
		},
		{
			label: 'Sign-ups',
			value: '161',
			note: 'Up 9 from 152 in the 14 days before',
			href: '#showcase-figure-band',
			trend: { values: signups, label: 'Sign-ups per day, 13 to 26 October: from 9 to 12' }
		}
	];
	const frame = 'w-full overflow-hidden rounded-lg border border-border';
	const after = 'px-4 py-3 text-xs text-muted-foreground md:px-6';
</script>

<section id="showcase-figure-band" data-showcase="figure-band" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">figure-band</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		The key figures of a summary page, in bands that read the width of their own box. Below a box of 672 px two figures stand in a row, and from
		672 px every figure stands in one row. A band of one keeps its figure at the start. Each box below stands for a region, and its top edge for
		the edge of the top bar.
	</p>

	<div class="flex flex-col gap-2">
		<h3 class="text-xs font-semibold text-muted-foreground">Four figures that open a list, in a page</h3>
		<div class={frame}>
			<FigureBand figures={today} label="Figures of today" />
			<p class={after}>The lists and the meters of the page follow, 32 px under the band.</p>
		</div>
	</div>

	<div class="flex flex-wrap items-start gap-6">
		<div class="flex w-full max-w-97.5 flex-col gap-2 print:max-w-none">
			<h3 class="text-xs font-semibold text-muted-foreground">The same in a box of 390 px</h3>
			<div class={frame}>
				<FigureBand figures={today} label="Figures of today" />
				<p class={after}>A phone, a pane or a narrow item column.</p>
			</div>
		</div>
		<div class="flex w-full max-w-130 flex-col gap-2 print:max-w-none">
			<h3 class="text-xs font-semibold text-muted-foreground">Three figures as plain text, in a box of 520 px</h3>
			<div class={frame}>
				<FigureBand figures={report} label="Figures of October" inset="pane" />
				<p class="px-4 py-3 text-xs text-muted-foreground">The third figure takes the whole row.</p>
			</div>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<h3 class="text-xs font-semibold text-muted-foreground">Two figures with a sparkline, under a heading</h3>
		<div class="{frame} pt-3">
			<h4 class="px-4 pb-3 text-base font-semibold md:px-6">Visits of the last 14 days</h4>
			<FigureBand figures={traffic} label="Visits of the last 14 days" class="border-t border-border" />
			<p class={after}>A band under text takes a line over its first row.</p>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<h3 class="text-xs font-semibold text-muted-foreground">One figure that opens a list, in a page</h3>
		<div class={frame}>
			<FigureBand figures={month} label="Figures of this month" />
			<p class={after}>The figure stands at the start, as wide as its parts, and the line under it crosses the band.</p>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<h3 class="text-xs font-semibold text-muted-foreground">Loading</h3>
		<div class={frame}>
			<FigureBand figures={today} label="Figures of today" loading />
			<p class={after}>The labels stay, and a still skeleton holds the place of each value and each note.</p>
		</div>
	</div>
</section>
