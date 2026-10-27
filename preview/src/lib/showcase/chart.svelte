<script lang="ts">
	import * as Chart from '#lib/components/ui/chart/index.js';
	import { registerChart } from '#lib/print/chart-width.js';
	import { AreaChart, BarChart, type ChartState } from 'layerchart';

	// Fixed sample data. This showcase shows the vendored container, the theme colors and the
	// tooltip indicators. The pattern fills, the pattern legend and the data table are on /charts.
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
	const data = months.map((month, i) => ({
		month,
		date: new Date(2026, i, 1),
		desktop: [186, 305, 237, 73, 209, 214][i],
		mobile: [80, 200, 120, 190, 130, 140][i]
	}));
	const config = {
		desktop: { label: 'Desktop', color: 'var(--chart-1)' },
		mobile: { label: 'Mobile', color: 'var(--chart-2)' }
	} satisfies Chart.ChartConfig;
	const series = [
		{ key: 'desktop', label: 'Desktop', color: config.desktop.color },
		{ key: 'mobile', label: 'Mobile', color: config.mobile.color }
	];
	const indicators = ['dot', 'line', 'dashed'] as const;

	let contexts = $state<(ChartState | undefined)[]>([]);
	$effect(() => { const offs = contexts.filter((c) => c !== undefined).map(registerChart); return () => offs.forEach((off) => off()); });
</script>

<section id="showcase-chart" data-showcase="chart" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">chart</h2>
	<div class="grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">bars, grouped, with a legend</h3>
			<Chart.Container {config} class="h-60 w-full">
				<BarChart bind:context={contexts[0]} {data} x="month" {series} seriesLayout="group" legend>
					{#snippet tooltip()}<Chart.Tooltip />{/snippet}
				</BarChart>
			</Chart.Container>
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">areas, stacked</h3>
			<Chart.Container {config} class="h-60 w-full">
				<AreaChart bind:context={contexts[1]} {data} x="date" {series} seriesLayout="stack">
					{#snippet tooltip()}<Chart.Tooltip indicator="line" />{/snippet}
				</AreaChart>
			</Chart.Container>
		</div>
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">tooltip indicators: {indicators.join(', ')}</h3>
	<div class="grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
		{#each indicators as indicator, i (indicator)}
			<Chart.Container {config} class="h-40 w-full">
				<BarChart bind:context={contexts[2 + i]} {data} x="month" {series} seriesLayout="stack">
					{#snippet tooltip()}<Chart.Tooltip {indicator} />{/snippet}
				</BarChart>
			</Chart.Container>
		{/each}
	</div>
</section>
