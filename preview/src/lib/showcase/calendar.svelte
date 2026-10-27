<script lang="ts">
	import { Calendar } from '#lib/components/ui/calendar/index.js';
	import { CalendarDate, type DateValue } from '@internationalized/date';

	// A fixed date, so that every render and every measurement shows the same month.
	const day = new CalendarDate(2026, 10, 13);
	const isDateDisabled = (d: DateValue) => d.compare(new CalendarDate(2026, 10, 20)) === 0;
</script>

<section id="showcase-calendar" data-showcase="calendar" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">calendar</h2>
	<div class="flex flex-wrap items-start gap-6">
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">caption label, a chosen day, a disabled day</h3>
			<Calendar type="single" value={day} placeholder={day} {isDateDisabled} class="rounded-lg border border-border" />
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">caption dropdown</h3>
			<Calendar type="single" placeholder={day} captionLayout="dropdown" class="rounded-lg border border-border" />
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">type multiple, two months</h3>
			<Calendar
				type="multiple"
				value={[day, new CalendarDate(2026, 10, 15)]}
				placeholder={day}
				numberOfMonths={2}
				class="rounded-lg border border-border"
			/>
		</div>
	</div>
</section>
