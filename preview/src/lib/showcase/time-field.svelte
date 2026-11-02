<script lang="ts">
	import { Time } from '@internationalized/date';
	import * as Field from '#lib/components/ui/field/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import TimeField from '#lib/stack/TimeField.svelte';

	// The states of the time-field definition in DESIGN.md, each through the part TimeField.
	type State = {
		label: string;
		locale: string;
		value?: Time;
		granularity?: 'hour' | 'minute' | 'second';
		maxValue?: Time;
		disabled?: boolean;
		readonly?: boolean;
		// An error of the form, which Bits UI does not know.
		error?: string;
	};
	const states: State[] = [
		{ label: 'empty, a 24-hour locale', locale: 'sr-Latn-RS' },
		{ label: 'a value, a 24-hour locale', locale: 'sr-Latn-RS', value: new Time(3, 0) },
		{ label: 'a value, a 12-hour locale', locale: 'en-US', value: new Time(15, 30) },
		{ label: 'granularity second', locale: 'sr-Latn-RS', value: new Time(3, 0, 15), granularity: 'second' },
		// The part writes the error "Choose 22:00 or earlier." from maxValue.
		{ label: 'invalid, after the latest time 22:00', locale: 'sr-Latn-RS', value: new Time(23, 30), maxValue: new Time(22, 0) },
		{ label: 'invalid, an error of the form', locale: 'sr-Latn-RS', error: 'Choose the time of the run.' },
		{ label: 'disabled', locale: 'sr-Latn-RS', value: new Time(3, 0), disabled: true },
		{ label: 'read only', locale: 'sr-Latn-RS', value: new Time(3, 0), readonly: true }
	];
</script>

<section id="showcase-time-field" data-showcase="time-field" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">time-field</h2>
	<div class="grid max-w-3xl gap-6 sm:grid-cols-2">
		{#each states as s (s.label)}
			<TimeField
				label="Run at"
				description={s.label}
				locale={s.locale}
				value={s.value}
				granularity={s.granularity}
				maxValue={s.maxValue}
				disabled={s.disabled}
				readonly={s.readonly}
				error={s.error}
			/>
		{/each}
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">next to an input, the same height and edge</h3>
	<div class="grid max-w-3xl items-end gap-3 sm:grid-cols-2">
		<TimeField label="Run at" description="time field" locale="sr-Latn-RS" value={new Time(9, 15)} />
		<Field.Field>
			<Field.Label for="showcase-time-field-input">Note</Field.Label>
			<Input id="showcase-time-field-input" value="Every working day" />
			<Field.Description>input</Field.Description>
		</Field.Field>
	</div>
</section>
