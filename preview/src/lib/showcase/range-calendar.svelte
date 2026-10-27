<script lang="ts">
	import { RangeCalendar } from '#lib/components/ui/range-calendar/index.js';
	import { CalendarDate } from '@internationalized/date';

	// A fixed range, so that every render and every measurement shows the same month.
	const start = new CalendarDate(2026, 10, 8);
	const end = new CalendarDate(2026, 10, 17);
</script>

<section id="showcase-range-calendar" data-showcase="range-calendar" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">range-calendar</h2>
	<div class="flex flex-wrap items-start gap-6">
		<RangeCalendar value={{ start, end }} placeholder={start} class="rounded-lg border border-border" />
		<RangeCalendar value={{ start, end }} placeholder={start} numberOfMonths={2} captionLayout="dropdown" class="rounded-lg border border-border" />
	</div>
</section>
