<script lang="ts">
	import TimeZoneField from '#lib/stack/TimeZoneField.svelte';
	import { forcedOpen } from '#lib/preview/view.svelte.js';

	// The states of the time-zone-field definition in DESIGN.md, each through the part
	// TimeZoneField. A fixed reference date, so that every render and every measurement shows the
	// same offsets.
	const locale = 'en-GB';
	const reference = new Date('2026-10-23T12:00:00Z');
	const workspace = 'Europe/Belgrade';

	type State = { label: string; value?: string; open: boolean; disabled?: boolean; error?: string; openId?: string };
	const states: State[] = $state([
		{ label: 'the zone of the workspace', value: workspace, open: false },
		{ label: 'open, with a chosen zone', value: 'America/New_York', open: forcedOpen('time-zone-field'), openId: 'time-zone-field' },
		// The part shows and writes the current name, Asia/Kolkata.
		{ label: 'a stored old name, Asia/Calcutta', value: 'Asia/Calcutta', open: false },
		{ label: 'empty', open: false },
		{ label: 'disabled', value: workspace, open: false, disabled: true },
		{ label: 'invalid', open: false, error: 'Choose the time zone of the schedule.' }
	]);
</script>

<section id="showcase-time-zone-field" data-showcase="time-zone-field" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">time-zone-field</h2>
	<div class="grid max-w-3xl gap-6 sm:grid-cols-2">
		{#each states as s (s.label)}
			<TimeZoneField
				bind:value={s.value}
				bind:open={s.open}
				{locale}
				{workspace}
				date={reference}
				description={s.label}
				disabled={s.disabled}
				error={s.error}
				data-open-id={s.openId}
			/>
		{/each}
	</div>
</section>
