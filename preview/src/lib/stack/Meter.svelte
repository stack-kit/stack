<!--
	A meter of DESIGN.md (`### progress`): the outlined bar of a quota or a limit, with its label row
	above it and an optional line under it. It draws the parts of the meter over the bar, because
	`Progress` takes no children: up to four threshold ticks, a forecast marker and a pending segment.
	The fill is primary or muted-foreground while the value is safe, and it takes the role of the last
	tick that the value passed, when that tick has one. Each part states its value as text: the label
	row names the ticks and the last tick passed, and the line under the bar states the forecast and
	the pending amount. The bar takes the figure, and the last tick passed, as its value text, and the
	names of the ticks and the line under the bar as its description.
-->
<script lang="ts">
	import { Progress } from '#lib/components/ui/progress/index.js';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { PATTERNS, lineCenter, patternPrefix, styledPattern } from './patterns.js';

	/** A threshold: its value, its name, such as "Warning", its value in words, and the role that the fill takes from it. */
	type Tick = { at: number; name: string; text: string; role?: 'warning' | 'destructive' };

	let {
		label,
		value,
		max = 100,
		figure,
		fill = 'primary',
		ticks = [],
		forecast,
		pending,
		large = false
	}: {
		label: string;
		value: number;
		max?: number;
		/** The figure in words, such as "7.2 of 10 GB". */
		figure: string;
		/** The safe fill: primary, or muted-foreground when nothing needs attention while the value is safe. */
		fill?: 'primary' | 'neutral';
		/** Up to four ticks, in the order of the track. */
		ticks?: Tick[];
		/** The value that the meter will reach, and the line that states it, such as "Forecast 9.4 GB by 30 October". */
		forecast?: { at: number; text: string };
		/** An amount after the value that is not yet known, and the line that states it, such as "0.4 GB pending". */
		pending?: { amount: number; text: string };
		/** The 8 px meter of a large view, in place of the 6 px meter. */
		large?: boolean;
	} = $props();

	const id = $props.id();
	const prefix = patternPrefix(id);
	// The pending segment takes pattern 1 with the marks of the color pattern style: a 2 px line with crispEdges.
	// The pattern names its number, the style of its marks and their ink, so that the print listener of
	// the chart patterns draws the same marks as shapes (preview/src/lib/print/pattern-fills.ts).
	const hatch = styledPattern('color-pattern', PATTERNS[0]);

	const percent = (v: number) => Math.min(100, Math.max(0, (v / max) * 100));
	const passed = $derived(ticks.findLast((t) => value >= t.at));
	const role = $derived(ticks.findLast((t) => value >= t.at && t.role)?.role);
	const valueText = $derived(passed ? `${figure}, past ${passed.name.toLowerCase()}` : figure);
	const tickText = $derived(ticks.map((t, i) => `${i ? t.name.toLowerCase() : t.name} at ${t.text}`).join(', '));
	const note = $derived([forecast?.text, pending?.text].filter(Boolean).join(' · '));
	const describedBy = $derived([ticks.length && `${id}-ticks`, note && `${id}-note`].filter(Boolean).join(' ') || undefined);
	const fillClass = $derived(
		role === 'destructive'
			? '*:data-[slot=progress-indicator]:bg-destructive'
			: role === 'warning'
				? '*:data-[slot=progress-indicator]:bg-warning'
				: fill === 'neutral'
					? '*:data-[slot=progress-indicator]:bg-muted-foreground'
					: undefined
	);
</script>

<div class="flex flex-col gap-1.5" data-meter={id}>
	<div class="flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
		<span
			id="{id}-label"
			class="flex items-center gap-1"
		>
			{#if role}<TriangleAlertIcon class={['size-3.5 self-center', role === 'warning' ? 'text-warning' : 'text-destructive']} aria-hidden="true" />{/if}{label}
		</span>
		<span class="text-muted-foreground tabular-nums">
			<span class="text-foreground">{valueText}</span>{#if ticks.length}{' · '}<span id="{id}-ticks">{tickText}</span>{/if}
		</span>
	</div>
	<div class={['relative', forecast && 'mt-1.5']}>
		<Progress
			{value}
			{max}
			aria-labelledby="{id}-label"
			aria-valuetext={valueText}
			aria-describedby={describedBy}
			class={[large ? 'h-2' : 'h-1.5', 'border border-input bg-background', fillClass]}
		/>
		{#if pending}
			<div class="pointer-events-none absolute inset-px overflow-hidden rounded-full" aria-hidden="true">
				<svg class="block size-full" data-meter-part="pending">
					<defs>
						<pattern
							id="{prefix}-hatch"
							data-pattern="1"
							data-pattern-style="color-pattern"
							data-pattern-ink="var(--muted-foreground)"
							width={hatch.pitch}
							height={hatch.pitch}
							patternUnits="userSpaceOnUse"
							patternTransform="rotate({hatch.angle})"
						>
							<line
								x1={lineCenter(hatch.pitch, hatch.width)}
								y1="0"
								x2={lineCenter(hatch.pitch, hatch.width)}
								y2={hatch.pitch}
								class="stroke-muted-foreground"
								stroke-width={hatch.width}
								shape-rendering="crispEdges"
							/>
						</pattern>
					</defs>
					<rect x="{percent(value)}%" width="{percent(value + pending.amount) - percent(value)}%" height="100%" fill="url(#{prefix}-hatch)" />
				</svg>
			</div>
		{/if}
		<div class="pointer-events-none absolute inset-x-px -inset-y-0.75" aria-hidden="true">
			{#each ticks as t (t.at)}
				<svg class="absolute top-0 block h-full w-px overflow-visible" style="left: {percent(t.at)}%" data-meter-part="tick">
					<line x1="0.5" x2="0.5" y1="0" y2="100%" class="stroke-foreground" stroke-width="1" shape-rendering="crispEdges" />
				</svg>
			{/each}
			{#if forecast}
				<span class="absolute -top-1.5 bottom-0 w-2.25 -translate-x-1" style="left: {percent(forecast.at)}%" data-meter-part="forecast">
					<svg class="block size-full overflow-visible">
						<path d="M0 0H9L4.5 6Z" class="fill-foreground" />
						<line x1="4.5" y1="6" x2="4.5" y2="100%" class="stroke-foreground" stroke-dasharray="2 2" shape-rendering="crispEdges" />
					</svg>
				</span>
			{/if}
		</div>
	</div>
	{#if note}
		<p id="{id}-note" class="text-xs text-muted-foreground tabular-nums">{note}</p>
	{/if}
</div>
