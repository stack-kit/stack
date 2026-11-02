<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	/** The time of an entry: a start, a start and an end, or a duration alone. An end of null runs now. */
	export type DayLogTime = { start?: Date; end?: Date | null; seconds?: number };
	/** A stretch of time that holds over several entries, such as a mode or a maintenance window. */
	export type DayLogSpan = { from: Date; to: Date | null; label: string };

	export type DayLogProps<T extends { id: string }> = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The root element, which holds the caption and the days. */
		ref?: HTMLDivElement | null;
		/**
		 * The entries in one list. The log groups them by the date of their start and orders them by
		 * the start, newest first. An entry with no start, such as a duration alone, stays right after
		 * the entry before it in this list, or right before the entry after it at the head of the list.
		 */
		entries: readonly T[];
		/** Days that keep their head with no entry, as YYYY-MM-DD, such as the days that a filter emptied. */
		days?: readonly string[];
		/** The time zone that the product names for the log. The caption names it once. */
		timeZone: string;
		/** The locale of the names of the days and of the durations. */
		locale: string;
		/** Now, for an entry or a span that still runs, and for Today and Yesterday. */
		now: Date;
		/** The time of an entry. */
		time: (item: T) => DayLogTime;
		spans?: readonly DayLogSpan[];
		/** The count of a day in words, for its head. */
		count?: (n: number) => string;
		/** The content of an entry after its time: the icon and the sentence. */
		entry: Snippet<[T]>;
		/** The line of a day with no entry. */
		empty?: Snippet<[string]>;
	};

	/**
	 * The exact time of a log, in the time zone that the product names for it: the date as
	 * YYYY-MM-DD and the time as HH:mm:ss, from the parts of one fixed locale, as "Formats" in
	 * architecture/web-app.md says.
	 */
	export function exact(at: Date, timeZone: string): { date: string; time: string } {
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hourCycle: 'h23'
		}).formatToParts(at);
		const p = (type: Intl.DateTimeFormatPartTypes) => parts.find((x) => x.type === type)?.value ?? '';
		return { date: `${p('year')}-${p('month')}-${p('day')}`, time: `${p('hour')}:${p('minute')}:${p('second')}` };
	}

	type Duration = { hours?: number; minutes?: number; seconds?: number };
	/**
	 * The short words of a duration, such as "1 hr, 30 min": Intl.DurationFormat, or, where the runtime
	 * has none, such as Node 22 on the server of a product, the words from Intl.NumberFormat and
	 * Intl.ListFormat. DurationFormat leaves out a unit whose value is 0, such as "2 hr" for 2 hours and
	 * 0 minutes, so the other words leave it out too. Only then are the words the same (measured in
	 * Chromium for en-GB, en-US, sr-Latn-RS and de-DE), and the text does not change at hydration.
	 */
	function durationWords(locale: string): { format: (d: Duration) => string } {
		if (typeof Intl.DurationFormat === 'function') return new Intl.DurationFormat(locale, { style: 'short' });
		const list = new Intl.ListFormat(locale, { type: 'unit', style: 'short' });
		const unit = (u: 'hour' | 'minute' | 'second', n: number) => new Intl.NumberFormat(locale, { style: 'unit', unit: u, unitDisplay: 'short' }).format(n);
		return {
			format: (d) => {
				const units: ['hour' | 'minute' | 'second', number | undefined][] = [
					['hour', d.hours],
					['minute', d.minutes],
					['second', d.seconds]
				];
				return list.format(units.flatMap(([u, n]) => (n !== undefined && n !== 0 ? [unit(u, n)] : [])));
			}
		};
	}
</script>

<script lang="ts" generics="T extends { id: string }">
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';

	// A log grouped by day: the newest day first, and in each day the newest entry first. The log
	// groups the entries itself, by the date of their start in the time zone of the log, so that a
	// head and its entries always agree. The head of each day is the group header of a list, sticky
	// at the top of its scroll box, with the name of the day, its date as YYYY-MM-DD, the count, and
	// on the right the total of the times of the day. Each entry shows its exact time as HH:mm:ss,
	// so that the head and the line give the exact time together. An entry with a start and an end
	// shows both, and its duration on the right. A span that holds over several entries draws a 4 px
	// bar in the gutter beside them, with its label above the newest of them.
	let {
		entries,
		days = [],
		timeZone,
		locale,
		now,
		time,
		spans = [],
		count = (n: number) => `${n} ${n === 1 ? 'entry' : 'entries'}`,
		entry,
		empty,
		ref = $bindable(null),
		class: className,
		...rest
	}: DayLogProps<T> = $props();

	const uid = $props.id();
	const headId = (day: string) => `${uid}-day-${day}`;
	const names = $derived({
		weekday: new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }),
		relative: new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
		full: new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'full', timeZone }),
		duration: durationWords(locale)
	});
	const today = $derived(exact(now, timeZone).date);
	const DAY = 86_400_000;
	/** The name of a day: Today or Yesterday in the words of the locale, otherwise the weekday. */
	function dayName(day: string) {
		const away = Math.round((Date.parse(day) - Date.parse(today)) / DAY);
		if (away === 0 || away === -1) {
			const word = names.relative.format(away, 'day');
			return word.charAt(0).toLocaleUpperCase(locale) + word.slice(1);
		}
		return names.weekday.format(new Date(`${day}T12:00:00Z`));
	}
	/** The seconds of an entry: its duration, or the time from its start to its end or to now. */
	function seconds(t: DayLogTime): number | null {
		if (t.seconds !== undefined) return t.seconds;
		if (t.start && t.end !== undefined) return Math.max(0, Math.round(((t.end ?? now).getTime() - t.start.getTime()) / 1000));
		return null;
	}
	function duration(s: number) {
		const hours = Math.floor(s / 3600);
		const minutes = Math.floor((s % 3600) / 60);
		return names.duration.format(hours > 0 ? { hours, minutes } : minutes > 0 ? { minutes } : { seconds: s });
	}
	const total = (entries: readonly T[]) => {
		const all = entries.map((e) => seconds(time(e))).filter((s) => s !== null);
		return all.length ? duration(all.reduce((a, b) => a + b, 0)) : null;
	};
	/** True when some entry of the log has an end: the time column then holds two times. */
	const ranged = $derived(entries.some((e) => time(e).end !== undefined));

	/** The days, newest first, each with its entries, newest first. */
	const grouped = $derived.by(() => {
		const starts = entries.map((e) => time(e).start?.getTime());
		// An entry with no start takes the start of the nearest entry before it in the list, else after it.
		const keyed = entries.map((e, i) => {
			let at = starts[i];
			for (let j = i - 1; at === undefined && j >= 0; j--) at = starts[j];
			for (let j = i + 1; at === undefined && j < starts.length; j++) at = starts[j];
			return { e, at: at ?? now.getTime() };
		});
		// The sort is stable, so entries with the same start keep the order of the list.
		keyed.sort((a, b) => b.at - a.at);
		const byDay = new Map<string, T[]>(days.map((d) => [d, []]));
		for (const { e, at } of keyed) {
			const day = exact(new Date(at), timeZone).date;
			byDay.set(day, [...(byDay.get(day) ?? []), e]);
		}
		// YYYY-MM-DD sorts as text in the order of the days.
		return [...byDay].sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0)).map(([day, list]) => ({ day, entries: list }));
	});

	/** The span that holds an entry, by the start of the entry. */
	const spanOf = (t: DayLogTime) => (t.start ? spans.find((s) => s.from <= t.start! && t.start! <= (s.to ?? now)) : undefined);
	/** The entries in the order of the page, so that the bar knows the newest and the oldest entry of each span. */
	const order = $derived(grouped.flatMap((d) => d.entries));
	const ends = $derived.by(() => {
		const out = new Map<T, { top: boolean; bottom: boolean; span: DayLogSpan }>();
		for (const s of spans) {
			const inside = order.filter((e) => spanOf(time(e)) === s);
			inside.forEach((e, i) => out.set(e, { top: i === 0, bottom: i === inside.length - 1, span: s }));
		}
		return out;
	});
</script>

<!-- The time is no tab stop, so its tooltip opens on hover only: the head already gives the date, and the caption the time zone. -->
{#snippet clock(at: Date)}<Tooltip.Root
		><Tooltip.Trigger
			>{#snippet child({ props })}<time {...props} tabindex="-1" datetime={at.toISOString()}>{exact(at, timeZone).time}</time>{/snippet}</Tooltip.Trigger
		><Tooltip.Content>{names.full.format(at)}</Tooltip.Content></Tooltip.Root
	>{/snippet}

<Tooltip.Provider>
	<div bind:this={ref} data-slot="day-log" class={cn('flex flex-col bg-background text-sm', className)} {...rest}>
		<p data-slot="day-log-caption" class="px-3 py-2 text-xs text-muted-foreground">Times in {timeZone}</p>
		{#each grouped as d (d.day)}
			{@const sum = total(d.entries)}
			<section aria-labelledby={headId(d.day)}>
				<!-- The head takes the focus when a product adds an older day, such as after Load older. -->
				<h3
					id={headId(d.day)}
					tabindex="-1"
					data-day={d.day}
					data-slot="day-log-head"
					class="sticky top-0 z-10 flex h-8 items-center gap-2 border-b border-border bg-muted pr-4 pl-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
				>
					<span class="flex min-w-0 items-baseline gap-2 truncate">
						<span class="font-semibold">{dayName(d.day)}</span>
						<span class="truncate text-muted-foreground"
							><time datetime={d.day} data-slot="day-log-head-date" class="tabular-nums">{d.day}</time><span class="max-md:hidden"
								>{' · '}<span class="tabular-nums">{count(d.entries.length)}</span></span
							></span
						>
					</span>
					{#if sum}<span data-slot="day-log-head-total" class="ml-auto shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">{sum}</span>{/if}
				</h3>
				{#if d.entries.length > 0}
					<ol aria-labelledby={headId(d.day)}>
						{#each d.entries as e (e.id)}
							{@const t = time(e)}
							{@const s = seconds(t)}
							{@const bar = ends.get(e)}
							{@const later = t.start && t.end ? exact(t.end, timeZone).date !== exact(t.start, timeZone).date : false}
							<!-- isolate keeps the layers of the entry inside it, so that the sticky head stays over the time. -->
							<li data-slot="day-log-entry" class="relative isolate flex gap-3 border-b border-border-faint pr-4 pl-1 has-[a:hover]:bg-muted/50">
								<span data-slot="day-log-span" aria-hidden="true" class={['w-1 shrink-0', bar && 'bg-input', bar?.top && 'mt-1 rounded-t-full', bar?.bottom && 'mb-1 rounded-b-full']}></span>
								<div class="flex min-w-0 flex-1 flex-col py-1.5">
									{#if bar?.top}<p class="pb-1 text-xs font-medium text-muted-foreground">{bar.span.label}</p>{/if}
									<!-- Below 768 px a log with ends puts the times and the duration on a line above the content. -->
									<div class={['flex min-w-0 items-start gap-3', ranged && 'max-md:flex-wrap max-md:gap-x-2 max-md:gap-y-0.5']}>
										<!-- The time stands over a link that covers the entry, so that its tooltip opens. -->
										<span data-slot="day-log-time" class={['relative z-10 shrink-0 text-muted-foreground tabular-nums', ranged ? 'w-32 max-md:w-auto' : 'w-16 max-md:w-17', later && 'whitespace-normal']}>
											{#if t.start}{@render clock(t.start)}{#if t.end !== undefined}–{#if t.end === null}now{:else if later}{exact(t.end, timeZone).date} {@render clock(t.end)}{:else}{@render clock(t.end)}{/if}{/if}{/if}
										</span>
										<div class={['min-w-0 flex-1', ranged && 'max-md:order-last max-md:basis-full']}>{@render entry(e)}</div>
										{#if s !== null}
											<span data-slot="day-log-duration" class="shrink-0 text-muted-foreground tabular-nums max-md:ml-auto">{duration(s)}{#if t.end === null}{' so far'}{/if}</span>
										{/if}
									</div>
								</div>
							</li>
						{/each}
					</ol>
				{:else}
					<p class="border-b border-border-faint py-1.5 pr-4 pl-5 text-xs text-faint-foreground">{#if empty}{@render empty(d.day)}{:else}Nothing on this day.{/if}</p>
				{/if}
			</section>
		{/each}
	</div>
</Tooltip.Provider>
