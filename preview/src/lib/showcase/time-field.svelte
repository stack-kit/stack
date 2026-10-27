<script lang="ts">
	import { TimeField } from 'bits-ui';
	import { Time } from '@internationalized/date';
	import * as Field from '#lib/components/ui/field/index.js';
	import { Input } from '#lib/components/ui/input/index.js';

	// The classes of the time-field definition in DESIGN.md. The field is Bits UI TimeField,
	// because shadcn-svelte 1.7.0 has no time field.
	const input =
		'flex h-8 w-full min-w-0 items-center rounded-lg border border-input bg-transparent px-2.5 py-1 text-base tabular-nums transition-colors outline-none select-none md:text-sm dark:bg-input/30 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:bg-input/50 data-disabled:opacity-50 dark:data-disabled:bg-input/80 max-md:h-11 max-md:px-0';
	// The segment is the target, 24 by 24 px from 768 px and 44 by 44 px below it. The span in it
	// draws the value and the focus ground at the size of the digits.
	const segment =
		'group/segment inline-flex min-h-6 min-w-6 items-center justify-center outline-none focus-visible:text-accent-foreground aria-[valuetext=Empty]:text-muted-foreground max-md:min-h-11 max-md:min-w-11';
	const mark = 'rounded-sm px-0.5 group-focus-visible/segment:bg-accent';

	// A click on the box outside a segment, or on a separator, focuses the first segment, as a click in an input does.
	function focusFirst(e: MouseEvent) {
		if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[role=spinbutton]')?.focus();
	}

	type State = {
		label: string;
		locale: string;
		value?: Time;
		granularity?: 'hour' | 'minute' | 'second';
		maxValue?: Time;
		disabled?: boolean;
		readonly?: boolean;
		// The text that onInvalid sets when Bits UI finds the time outside maxValue.
		invalid?: string;
		// An error of the form, which Bits UI does not know.
		error?: string;
	};
	const states: State[] = [
		{ label: 'empty, a 24-hour locale', locale: 'sr-Latn-RS' },
		{ label: 'a value, a 24-hour locale', locale: 'sr-Latn-RS', value: new Time(3, 0) },
		{ label: 'a value, a 12-hour locale', locale: 'en-US', value: new Time(15, 30) },
		{ label: 'granularity second', locale: 'sr-Latn-RS', value: new Time(3, 0, 15), granularity: 'second' },
		{
			label: 'invalid, after the latest time 22:00',
			locale: 'sr-Latn-RS',
			value: new Time(23, 30),
			maxValue: new Time(22, 0),
			invalid: 'Choose 22:00 or earlier.'
		},
		{ label: 'invalid, an error of the form', locale: 'sr-Latn-RS', error: 'Choose the time of the run.' },
		{ label: 'disabled', locale: 'sr-Latn-RS', value: new Time(3, 0), disabled: true },
		{ label: 'read only', locale: 'sr-Latn-RS', value: new Time(3, 0), readonly: true }
	];
	const nextToInput: State = { label: 'time field', locale: 'sr-Latn-RS', value: new Time(9, 15) };

	// The error of each field, from onInvalid or from the form. A new value clears it, and
	// Bits UI calls onInvalid after onValueChange when the new value is invalid too.
	const errors: Record<string, string> = $state(Object.fromEntries(states.map((s) => [s.label, s.error ?? ''])));
</script>

{#snippet timeField(s: State, key: string)}
	{@const error = errors[s.label]}
	<TimeField.Root
		locale={s.locale}
		value={s.value}
		granularity={s.granularity}
		maxValue={s.maxValue}
		disabled={s.disabled}
		readonly={s.readonly}
		onValueChange={() => (errors[s.label] = '')}
		onInvalid={() => (errors[s.label] = s.invalid ?? '')}
	>
		<Field.Field data-invalid={!!error}>
			<TimeField.Label>
				{#snippet child({ props })}
					<Field.Label {...props}>Run at</Field.Label>
				{/snippet}
			</TimeField.Label>
			<TimeField.Input class={input} aria-invalid={!!error} onclick={focusFirst}>
				{#snippet children({ segments })}
					{#each segments as { part, value }, j (j)}
						{#if part === 'literal'}
							<TimeField.Segment {part} class="pointer-events-none">{value}</TimeField.Segment>
						{:else}
							<TimeField.Segment
								{part}
								class={segment}
								aria-describedby={error ? `showcase-time-field-description-${key} showcase-time-field-error-${key}` : `showcase-time-field-description-${key}`}
							>
								<span class={mark}>{value}</span>
							</TimeField.Segment>
						{/if}
					{/each}
				{/snippet}
			</TimeField.Input>
			<Field.Description id="showcase-time-field-description-{key}">{s.label}</Field.Description>
			{#if error}<Field.Error id="showcase-time-field-error-{key}">{error}</Field.Error>{/if}
		</Field.Field>
	</TimeField.Root>
{/snippet}

<section id="showcase-time-field" data-showcase="time-field" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">time-field</h2>
	<div class="grid max-w-3xl gap-6 sm:grid-cols-2">
		{#each states as s, i (s.label)}
			{@render timeField(s, `${i}`)}
		{/each}
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">next to an input, the same height and edge</h3>
	<div class="grid max-w-3xl items-end gap-3 sm:grid-cols-2">
		{@render timeField(nextToInput, 'next-to-input')}
		<Field.Field>
			<Field.Label for="showcase-time-field-input">Note</Field.Label>
			<Input id="showcase-time-field-input" value="Every working day" />
			<Field.Description>input</Field.Description>
		</Field.Field>
	</div>
</section>
