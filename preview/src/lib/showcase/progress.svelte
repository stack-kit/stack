<script lang="ts">
	import { Progress } from '#lib/components/ui/progress/index.js';
	import Meter from '#lib/stack/Meter.svelte';

	const values = [0, 33, 66, 100];
	const warning = { at: 80, name: 'Warning', text: '8 GB', role: 'warning' } as const;
	// Four named ticks of a usage window. The fill takes warning from the third and destructive from the fourth.
	const steps = [
		{ at: 25, name: 'Notice', text: '25%' },
		{ at: 45, name: 'Review', text: '45%' },
		{ at: 62, name: 'Warning', text: '62%', role: 'warning' },
		{ at: 78, name: 'Stop', text: '78%', role: 'destructive' }
	] as const;
</script>

<section id="showcase-progress" data-showcase="progress" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">progress</h2>
	<div class="flex max-w-md flex-col gap-4">
		{#each values as value (value)}
			<div class="flex items-center gap-3 text-sm">
				<span class="w-10 tabular-nums">{value}%</span>
				<Progress {value} aria-label="Progress {value} percent" />
			</div>
		{/each}
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">meter: the two safe fills</h3>
	<div class="flex max-w-md flex-col gap-4" data-meter-group="fills">
		<Meter label="Storage, primary" value={41} max={100} figure="4.1 of 10 GB" />
		<Meter label="Storage, muted-foreground" value={41} max={100} figure="4.1 of 10 GB" fill="neutral" />
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">meter: a threshold tick, and the fill past it</h3>
	<div class="flex max-w-xl flex-col gap-4" data-meter-group="ticks">
		<Meter label="Storage" value={62} figure="6.2 of 10 GB" fill="neutral" ticks={[warning]} />
		<Meter label="Storage" value={86} figure="8.6 of 10 GB" fill="neutral" ticks={[warning]} />
		<Meter label="Usage window" value={52} figure="52%" ticks={[...steps]} />
		<Meter label="Usage window" value={70} figure="70%" ticks={[...steps]} />
		<Meter label="Usage window" value={83} figure="83%" ticks={[...steps]} />
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">meter: a forecast marker and a pending segment</h3>
	<div class="flex max-w-md flex-col gap-4" data-meter-group="forecast">
		<Meter
			label="Storage"
			value={58}
			figure="5.8 of 10 GB"
			fill="neutral"
			ticks={[warning]}
			forecast={{ at: 91, text: 'Forecast 9.1 GB by 30 October' }}
			pending={{ amount: 9, text: '0.9 GB pending' }}
		/>
		<Meter
			label="Storage"
			value={58}
			figure="5.8 of 10 GB"
			ticks={[warning]}
			forecast={{ at: 91, text: 'Forecast 9.1 GB by 30 October' }}
			pending={{ amount: 9, text: '0.9 GB pending' }}
		/>
		<Meter
			label="Storage, 8 px"
			value={58}
			figure="5.8 of 10 GB"
			fill="neutral"
			ticks={[warning]}
			forecast={{ at: 91, text: 'Forecast 9.1 GB by 30 October' }}
			pending={{ amount: 9, text: '0.9 GB pending' }}
			large
		/>
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">meter: on a card</h3>
	<div class="flex max-w-md flex-col gap-4 rounded-lg border border-border bg-card p-4" data-meter-group="card">
		<Meter
			label="Storage"
			value={58}
			figure="5.8 of 10 GB"
			fill="neutral"
			ticks={[warning]}
			forecast={{ at: 91, text: 'Forecast 9.1 GB by 30 October' }}
			pending={{ amount: 9, text: '0.9 GB pending' }}
		/>
	</div>
</section>
