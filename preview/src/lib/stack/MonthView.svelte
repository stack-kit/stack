<script lang="ts" module>
	import { CalendarDate, endOfMonth, startOfMonth, startOfWeek } from '@internationalized/date';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type MonthViewProps<T extends { id: string }> = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The root element, which holds the head line, the grid and the popover of a day. */
		ref?: HTMLDivElement | null;
		/** A day of the month that shows. Previous, Today, Next and the keys write it. */
		month: CalendarDate;
		/** Today, in the time zone that counts a calendar day for the product. */
		today: CalendarDate;
		/** The locale: the first day of the week, the names of the days and of the month. */
		locale: string;
		/** The records of each day, keyed by the day as "2026-11-18", in the order that they show. */
		days: ReadonlyMap<string, readonly T[]>;
		/** The lines that a day holds, "3 more" included. */
		lines?: number;
		/** The count of a day in words, for its name and its popover. */
		count?: (n: number) => string;
		loading?: boolean;
		/** The line of a month with no record. */
		empty?: Snippet;
		/** One record as a link. The number is its tabindex: -1 in the grid, which is one tab stop, and 0 elsewhere. */
		record: Snippet<[T, number]>;
	};

	/** The weeks of the grid of a month, each a row of seven days, from the first day of the week of the locale. */
	export function weeksOf(month: CalendarDate, locale: string): CalendarDate[][] {
		const first = startOfWeek(startOfMonth(month), locale);
		const last = endOfMonth(month);
		const weeks: CalendarDate[][] = [];
		for (let start = first; start.compare(last) <= 0; start = start.add({ weeks: 1 })) {
			weeks.push(Array.from({ length: 7 }, (_, i) => start.add({ days: i })));
		}
		return weeks;
	}
</script>

<script lang="ts" generics="T extends { id: string }">
	import { tick } from 'svelte';
	import { bands } from '#lib/stack/behaviour/width.js';
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
	import { cn } from '#lib/utils.js';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	// The records of one month on its grid, such as the tickets by their due date. Each day shows
	// its records as lines of 20 px, and a day with more records than lines shows "3 more", which
	// opens the day in a popover with every record. The first day of the week and the names of the
	// days follow the locale. The grid is one tab stop: the arrow keys move the focus by a day or
	// a week, Home and End go to the start and the end of the week, Page Up and Page Down show the
	// month before or after, and Enter or Space opens the day. Below 768 px (bands.md) the month is
	// a list by day: a head for each day with records, and the records under it.
	let {
		month = $bindable(),
		today,
		locale,
		days,
		lines = 4,
		count = (n: number) => `${n} ${n === 1 ? 'record' : 'records'}`,
		loading = false,
		empty,
		record,
		ref = $bindable(null),
		class: className,
		...rest
	}: MonthViewProps<T> = $props();

	const uid = $props.id();
	const headingId = `${uid}-month`;
	const dayId = (d: CalendarDate) => `${uid}-day-${d.toString()}`;
	const wide = bands.md;
	const UTC = 'UTC';
	const names = $derived({
		month: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: UTC }),
		short: new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: UTC }),
		long: new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: UTC }),
		day: new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: UTC }),
		number: new Intl.NumberFormat(locale)
	});
	const at = (d: CalendarDate) => d.toDate(UTC);

	const weeks = $derived(weeksOf(month, locale));
	const inMonth = (d: CalendarDate) => d.month === month.month && d.year === month.year;
	const recordsOf = (d: CalendarDate) => days.get(d.toString()) ?? [];
	const dayName = (d: CalendarDate) => {
		const n = recordsOf(d).length;
		const day = `${names.day.format(at(d))}${d.compare(today) === 0 ? ', today' : ''}`;
		return loading ? day : `${day}, ${n === 0 ? 'nothing' : count(n)}`;
	};

	/** The day that is in the tab order: the last day with the focus, today, or the first day of the month. */
	let focused = $state<CalendarDate | null>(null);
	const current = $derived(focused && inMonth(focused) ? focused : inMonth(today) ? today : startOfMonth(month));

	/** The day that the popover shows, and the element that it opens from. */
	let openDay = $state<CalendarDate | null>(null);
	let anchor = $state<HTMLElement | null>(null);
	let open = $state(false);
	function show(d: CalendarDate, from: HTMLElement) {
		openDay = d;
		anchor = from;
		open = true;
	}
	/** The popover gives the focus back to the day, which is no trigger of it. */
	function back(e: Event) {
		e.preventDefault();
		if (openDay) document.getElementById(dayId(openDay))?.focus();
	}

	async function go(d: CalendarDate) {
		focused = d;
		if (!inMonth(d)) month = startOfMonth(d);
		await tick();
		document.getElementById(dayId(d))?.focus();
	}
	function onkeydown(e: KeyboardEvent, d: CalendarDate) {
		// A key with a modifier, such as Cmd+Left, is not a key of the grid, so the product or the browser takes it.
		if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
		const week = startOfWeek(d, locale);
		const to: Record<string, () => CalendarDate> = {
			ArrowLeft: () => d.subtract({ days: 1 }),
			ArrowRight: () => d.add({ days: 1 }),
			ArrowUp: () => d.subtract({ weeks: 1 }),
			ArrowDown: () => d.add({ weeks: 1 }),
			// Home and End stay in the month: a day of another month is no stop.
			Home: () => (week.compare(startOfMonth(d)) < 0 ? startOfMonth(d) : week),
			End: () => (week.add({ days: 6 }).compare(endOfMonth(d)) > 0 ? endOfMonth(d) : week.add({ days: 6 })),
			PageUp: () => d.subtract({ months: 1 }),
			PageDown: () => d.add({ months: 1 })
		};
		const opens = e.key === 'Enter' || e.key === ' ';
		if (!(e.key in to) && !opens) return;
		e.preventDefault();
		// The grid takes these keys, so a key handler of the list does not move the focus or open a record too.
		e.stopPropagation();
		if (opens) {
			if (recordsOf(d).length > 0) show(d, e.currentTarget as HTMLElement);
		} else go(to[e.key]!());
	}

	const shift = (months: number) => {
		focused = null;
		month = startOfMonth(month).add({ months });
	};
	const thisMonth = () => {
		focused = null;
		month = startOfMonth(today);
	};
	/** Bars of a loading day, by its number, so that a column of the grid does not repeat one count. */
	const BARS = [0, 2, 1, 0, 3];
	const anyRecord = $derived([...days.keys()].some((k) => k.startsWith(startOfMonth(month).toString().slice(0, 7))));
</script>

{#snippet line(it: T, tabindex: number)}
	<li data-slot="month-view-record" class="flex h-5 min-w-0 shrink-0">{@render record(it, tabindex)}</li>
{/snippet}

<!-- Below 768 px the list by day keeps its height, so that a box that scrolls around it scrolls the whole list. -->
<div bind:this={ref} data-slot="month-view" class={cn('flex min-h-0 flex-1 flex-col gap-3 bg-background max-md:flex-none', className)} {...rest}>
	<div class="flex flex-wrap items-center gap-2">
		<h2 id={headingId} class="text-base font-semibold" aria-live="polite">{names.month.format(at(month))}</h2>
		<div class="ml-auto flex items-center gap-1 print:hidden">
			<Button variant="ghost" size="icon-sm" aria-label="Previous month" onclick={() => shift(-1)}><ChevronLeftIcon /></Button>
			<Button variant="outline" size="sm" onclick={thisMonth}>Today</Button>
			<Button variant="ghost" size="icon-sm" aria-label="Next month" onclick={() => shift(1)}><ChevronRightIcon /></Button>
		</div>
	</div>

	{#if !loading && !anyRecord && empty}
		<p role="status" class="text-sm text-muted-foreground">{@render empty()}</p>
	{/if}

	{#if wide.current}
		<div role="grid" aria-labelledby={headingId} aria-busy={loading || undefined} class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
			<div role="row" class="grid shrink-0 grid-cols-7 border-b border-border">
				{#each weeks[0] as d (d.toString())}
					<span role="columnheader" aria-label={names.long.format(at(d))} data-slot="month-view-head-cell" class="flex h-7 items-center px-2 text-2xs font-medium text-muted-foreground">
						{names.short.format(at(d))}
					</span>
				{/each}
			</div>
			{#each weeks as week (week[0]!.toString())}
				<div role="row" class="grid min-h-30 flex-1 grid-cols-7 border-b border-border last:border-b-0">
					{#each week as d (d.toString())}
						{@const own = inMonth(d)}
						{@const list = own ? recordsOf(d) : []}
						{@const cut = list.length > lines ? lines - 1 : list.length}
						{@const isToday = d.compare(today) === 0}
						{#if own}
							<div
								id={dayId(d)}
								role="gridcell"
								tabindex={d.compare(current) === 0 ? 0 : -1}
								aria-label={dayName(d)}
								aria-current={isToday ? 'date' : undefined}
								data-slot="month-view-day"
								data-today={isToday || undefined}
								class="flex min-w-0 flex-col gap-1 border-r border-border p-1 outline-none last:border-r-0 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
								onkeydown={(e) => onkeydown(e, d)}
								onfocus={() => (focused = d)}
							>
								<span
									data-slot="month-view-day-number"
									data-today={isToday || undefined}
									aria-hidden="true"
									class={['flex size-5 shrink-0 items-center justify-center rounded-full text-2xs font-medium tabular-nums', isToday ? 'bg-foreground text-background' : 'text-muted-foreground']}
									>{names.number.format(d.day)}</span
								>
								{#if loading}
									{#each { length: BARS[d.day % BARS.length]! } as _, i (i)}<Skeleton class="h-5 w-full" />{/each}
								{:else if list.length > 0}
									<ul class="flex min-w-0 flex-col gap-1">
										{#each list.slice(0, cut) as it (it.id)}{@render line(it, -1)}{/each}
										{#if cut < list.length}
											<li class="flex h-5 shrink-0">
												<button
													type="button"
													tabindex="-1"
													data-slot="month-view-more"
													class={cn(buttonVariants({ variant: 'ghost', size: 'xs' }), 'h-5 w-full justify-start px-1.5 text-xs font-normal text-muted-foreground tabular-nums')}
													onclick={(e) => show(d, e.currentTarget.closest('[role=gridcell]') as HTMLElement)}
												>
													{names.number.format(list.length - cut)} more
												</button>
											</li>
										{/if}
									</ul>
								{/if}
							</div>
						{:else}
							<!-- A day of another month stays in the grid, so that each day keeps its column header. It is disabled, and it takes no focus. -->
							<div role="gridcell" aria-disabled="true" aria-label={names.day.format(at(d))} data-slot="month-view-day" data-outside-month class="flex min-w-0 flex-col border-r border-border bg-muted/50 p-1 last:border-r-0">
								<span data-slot="month-view-day-number" aria-hidden="true" class="flex size-5 items-center justify-center text-2xs font-medium text-muted-foreground tabular-nums"
									>{names.number.format(d.day)}</span
								>
							</div>
						{/if}
					{/each}
				</div>
			{/each}
		</div>
	{:else}
		<!-- Below 768 px: a list by day, with a head for each day that holds a record. -->
		<div class="flex flex-col">
			{#each weeks.flat().filter((d) => inMonth(d) && recordsOf(d).length > 0) as d (d.toString())}
				{@const list = recordsOf(d)}
				<section aria-labelledby={dayId(d)}>
					<h3
						id={dayId(d)}
						data-slot="month-view-phone-head"
						class="sticky top-0 z-10 flex h-8 items-center gap-2 border-b border-border bg-muted px-3 text-sm"
						aria-label={dayName(d)}
					>
						<span class="font-semibold">{names.day.format(at(d))}</span>
						{#if d.compare(today) === 0}<span class="text-muted-foreground">Today</span>{/if}
						<span class="ml-auto text-xs text-muted-foreground tabular-nums">{names.number.format(list.length)}</span>
					</h3>
					<ul class="flex flex-col">
						{#each list as it (it.id)}
							<!-- The divider sits outside the 44 px of the row, so the link keeps the whole target. -->
							<li data-slot="month-view-record" class="box-content flex border-b border-border-faint px-3">{@render record(it, 0)}</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{/if}

	<!-- The popover of a day. Its content renders in a portal, so the root keeps one box. -->
	<Popover.Root bind:open>
		<Popover.Content customAnchor={anchor} align="start" class="w-64" role="dialog" aria-label={openDay ? dayName(openDay) : undefined} onCloseAutoFocus={back}>
			{#if openDay}
				{@const list = recordsOf(openDay)}
				<Popover.Header>
					<Popover.Title>{names.day.format(at(openDay))}</Popover.Title>
					<Popover.Description class="tabular-nums">{count(list.length)}</Popover.Description>
				</Popover.Header>
				<ul class="flex flex-col gap-1">
					{#each list as it (it.id)}{@render line(it, 0)}{/each}
				</ul>
			{/if}
		</Popover.Content>
	</Popover.Root>
</div>
