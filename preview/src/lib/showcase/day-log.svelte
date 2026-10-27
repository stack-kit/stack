<script lang="ts">
	import DayLog, { type DayLogSpan, type DayLogTime } from '#lib/stack/DayLog.svelte';
	import CirclePlayIcon from '@lucide/svelte/icons/circle-play';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import RocketIcon from '@lucide/svelte/icons/rocket';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import type { Component } from 'svelte';

	// Two logs by day in Europe/Belgrade, with now fixed at 2026-11-18 14:20:05. The time log holds
	// entries with a start and an end, one that still runs, one with a duration alone, a day with
	// no entry and an entry that ends after midnight. The event log holds events at one time each,
	// and a maintenance window that holds over three of them. Every task and client is invented.
	const ZONE = 'Europe/Belgrade';
	const now = new Date('2026-11-18T13:20:05Z');
	/** A time in Belgrade in November, which is UTC+1. */
	const at = (s: string) => new Date(`${s}+01:00`);

	type Work = { id: string; task: string; time: DayLogTime };
	const work = (id: string, task: string, time: DayLogTime): Work => ({ id, task, time });
	// One list: the log groups the entries by the day of their start and orders them itself. The
	// entry with a duration alone stays after the entry before it, and 2026-11-16 keeps its head
	// with no entry.
	const workEntries = [
		work('w1', 'Review the quote for Harbour Studio', { start: at('2026-11-18T13:05:00'), end: null }),
		work('w2', 'Call with Atlas Engineering', { start: at('2026-11-18T10:30:00'), end: at('2026-11-18T12:15:00') }),
		work('w3', 'Write the October report', { start: at('2026-11-18T09:00:00'), end: at('2026-11-18T10:20:30') }),
		work('w4', 'Fix the export of the invoice list', { start: at('2026-11-17T15:00:00'), end: at('2026-11-17T17:45:00') }),
		work('w5', 'Travel to the client in Riverton', { seconds: 5400 }),
		work('w6', 'Plan the release of December', { start: at('2026-11-17T09:10:00'), end: at('2026-11-17T12:40:12') }),
		work('w7', 'Restore the backup of the shop', { start: at('2026-11-13T23:10:00'), end: at('2026-11-14T00:20:00') })
	];
	const emptyDays = ['2026-11-16'];

	type Event = { id: string; text: string; icon: Component; at: Date };
	const event = (id: string, text: string, icon: Component, time: string): Event => ({ id, text, icon, at: at(time) });
	const eventEntries = [
		event('e1', 'Deploy of 4.2.0 finished', RocketIcon, '2026-11-18T14:02:11'),
		event('e2', 'Maintenance ended', WrenchIcon, '2026-11-18T13:40:00'),
		event('e3', 'Database migrated to version 58', DatabaseIcon, '2026-11-18T13:10:45'),
		event('e4', 'Maintenance started', WrenchIcon, '2026-11-18T12:30:00'),
		event('e5', 'Backup of the night finished', DatabaseIcon, '2026-11-18T09:15:20'),
		event('e6', 'Deploy of 4.1.3 finished', RocketIcon, '2026-11-17T16:48:02'),
		event('e7', 'Job of the night started', CirclePlayIcon, '2026-11-17T02:00:00')
	];
	const spans: DayLogSpan[] = [{ from: at('2026-11-18T12:30:00'), to: at('2026-11-18T13:40:00'), label: 'Maintenance window · 12:30 to 13:40 · 1 hr, 10 min' }];
</script>

<section id="showcase-day-log" data-showcase="day-log" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">day-log</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		A time log and an event log by day. Each box scrolls, and the head of each day sticks to its top. The head and the line give the exact time
		together. A span that holds over several events draws a bar beside them.
	</p>
	<div class="flex flex-wrap items-start gap-6">
		<div class="h-96 w-full max-w-2xl overflow-y-auto rounded-lg border border-border">
			<DayLog entries={workEntries} days={emptyDays} timeZone={ZONE} locale="en-GB" {now} time={(w) => w.time} count={(n) => `${n} ${n === 1 ? 'task' : 'tasks'}`}>
				{#snippet entry(w)}<span class="font-medium">{w.task}</span>{/snippet}
				{#snippet empty()}No time booked on this day.{/snippet}
			</DayLog>
		</div>
		<div class="h-96 w-full max-w-2xl overflow-y-auto rounded-lg border border-border">
			<DayLog entries={eventEntries} timeZone={ZONE} locale="en-GB" {now} time={(e) => ({ start: e.at })} {spans} count={(n) => `${n} ${n === 1 ? 'event' : 'events'}`}>
				{#snippet entry(e)}
					{@const Icon = e.icon}
					<span class="flex min-w-0 items-start gap-2"><Icon class="mt-0.5 size-3.5 shrink-0 text-muted-foreground" /><span>{e.text}</span></span>
				{/snippet}
			</DayLog>
		</div>
	</div>
</section>
