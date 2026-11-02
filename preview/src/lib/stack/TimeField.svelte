<script lang="ts" module>
	import type { Time } from '@internationalized/date';
	import type { HTMLAttributes } from 'svelte/elements';

	export type TimeFieldProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The root element, the field that holds the label, the box, the description and the error. */
		ref?: HTMLDivElement | null;
		/** The time, a Time of @internationalized/date. It stays undefined until each segment holds a number. */
		value?: Time;
		/** The name of the field, such as "Run at". */
		label: string;
		/** The locale of the product. It gives the hour cycle and the order of the segments. */
		locale: string;
		/** The line under the box, such as "The run starts at this time each day." */
		description?: string;
		/**
		 * The error under the box. The part writes it when the time is outside minValue and maxValue or
		 * when validate returns a message, and a new time clears it. A product binds error (bind:error)
		 * and sets it for an error of the form, such as an empty time on submit. Without the binding, a
		 * second error with the same text does not show after a new time clears it.
		 */
		error?: string;
		/** The error for a time outside minValue and maxValue. By default it names the limit, such as "Choose 22:00 or earlier." */
		limitError?: string;
		/** 'minute' by default. 'hour' shows the hour only, and 'second' adds the seconds. */
		granularity?: 'hour' | 'minute' | 'second';
		/** 12 or 24. Without it, the field follows the locale. */
		hourCycle?: 12 | 24;
		minValue?: Time;
		maxValue?: Time;
		/** A rule of the product: a message when the time breaks it, else nothing. */
		validate?: (time: Time) => string | string[] | void;
		disabled?: boolean;
		/** The segments stay in the tab order and take no change. */
		readonly?: boolean;
		/** The hidden input of a form needs a time. */
		required?: boolean;
		/** The name of the hidden input, which posts the time in a form. Without it, the field has no hidden input. */
		name?: string;
		onValueChange?: (value: Time | undefined) => void;
	};
</script>

<script lang="ts">
	import { TimeField } from 'bits-ui';
	import * as Field from '#lib/components/ui/field/index.js';
	import { cn } from '#lib/utils.js';

	// The time field of DESIGN.md (### time-field): Bits UI TimeField in a field, because shadcn-svelte
	// has no time field. Each part of the time is a segment with the keys of a spin button, in the hour
	// cycle of the locale, so 3 alone fills the hour and leaves the minutes empty. The part keeps the
	// error: Bits UI reports a time outside the limits or a message of validate, and a new time clears
	// it. Each segment reads the description and the error after its name.
	let {
		value = $bindable(),
		label,
		locale,
		description,
		error = $bindable(),
		limitError,
		granularity = 'minute',
		hourCycle,
		minValue,
		maxValue,
		validate,
		disabled = false,
		readonly = false,
		required = false,
		name,
		onValueChange,
		ref = $bindable(null),
		class: className,
		...rest
	}: TimeFieldProps = $props();

	const uid = $props.id();
	const descriptionId = `${uid}-description`;
	const errorId = `${uid}-error`;
	const describedBy = $derived([description && descriptionId, error && errorId].filter(Boolean).join(' ') || undefined);

	/** A limit as the box shows it, such as 22:00 or 10:00 PM. */
	const clock = $derived(
		new Intl.DateTimeFormat(locale, {
			hour: '2-digit',
			minute: '2-digit',
			second: granularity === 'second' ? '2-digit' : undefined,
			hour12: hourCycle === undefined ? undefined : hourCycle === 12,
			timeZone: 'UTC'
		})
	);
	const said = (t: Time) => clock.format(new Date(Date.UTC(2000, 0, 1, t.hour, t.minute, t.second)));
	const outside = $derived(
		limitError ??
			(minValue && maxValue
				? `Choose a time from ${said(minValue)} to ${said(maxValue)}.`
				: maxValue
					? `Choose ${said(maxValue)} or earlier.`
					: minValue
						? `Choose ${said(minValue)} or later.`
						: '')
	);

	// Bits UI types its optional props with no undefined, and the strict check of the parts sets
	// exactOptionalPropertyTypes. So each limit goes to Bits UI only when the product gives it.
	const limits = $derived({
		...(hourCycle === undefined ? {} : { hourCycle }),
		...(minValue === undefined ? {} : { minValue }),
		...(maxValue === undefined ? {} : { maxValue }),
		...(validate === undefined ? {} : { validate })
	});

	// Bits UI calls onInvalid after onValueChange when the new time is invalid too, so the error stays.
	function changed(next: Time | undefined) {
		error = undefined;
		onValueChange?.(next);
	}
	function invalid(reason: 'min' | 'max' | 'custom', message?: string | string[]) {
		error = reason === 'custom' ? [message ?? []].flat().join(' ') : outside;
	}

	const BOX =
		'flex h-8 w-full min-w-0 items-center rounded-lg border border-input bg-transparent px-2.5 py-1 text-base tabular-nums transition-colors outline-none select-none md:text-sm dark:bg-input/30 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:bg-input/50 data-disabled:opacity-50 dark:data-disabled:bg-input/80 max-md:h-11 max-md:px-0';
	// The segment is the target, 24 by 24 px from 768 px and 44 by 44 px below it. The span in it
	// draws the value and the focus ground at the size of the digits.
	const SEGMENT =
		'group/segment inline-flex min-h-6 min-w-6 items-center justify-center outline-none focus-visible:text-accent-foreground aria-[valuetext=Empty]:text-muted-foreground max-md:min-h-11 max-md:min-w-11';
	const MARK = 'rounded-sm px-0.5 group-focus-visible/segment:bg-accent';

	// A click on the box outside a segment, or on a separator, focuses the first segment, as a click in an input does.
	function focusFirst(e: MouseEvent) {
		if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).querySelector<HTMLElement>('[role=spinbutton]')?.focus();
	}
</script>

<Field.Field bind:ref data-slot="time-field" data-invalid={!!error} class={cn(className)} {...rest}>
	<!-- An empty field holds no time, and Bits UI reads undefined so. Its type of value has no undefined, so the getter casts it. -->
	<TimeField.Root
		bind:value={() => value as Time, (next) => (value = next)}
		{...limits}
		{locale}
		{granularity}
		{disabled}
		{readonly}
		{required}
		onValueChange={changed}
		onInvalid={invalid}
	>
		<TimeField.Label>
			{#snippet child({ props })}
				<Field.Label {...props}>{label}</Field.Label>
			{/snippet}
		</TimeField.Label>
		<TimeField.Input {...name === undefined ? {} : { name }} class={BOX} aria-invalid={!!error} onclick={focusFirst}>
			{#snippet children({ segments })}
				{#each segments as { part, value: text }, i (i)}
					{#if part === 'literal'}
						<TimeField.Segment {part} class="pointer-events-none">{text}</TimeField.Segment>
					{:else}
						<TimeField.Segment {part} class={SEGMENT} aria-describedby={describedBy}>
							<span class={MARK}>{text}</span>
						</TimeField.Segment>
					{/if}
				{/each}
			{/snippet}
		</TimeField.Input>
	</TimeField.Root>
	{#if description}<Field.Description id={descriptionId}>{description}</Field.Description>{/if}
	{#if error}<Field.Error id={errorId}>{error}</Field.Error>{/if}
</Field.Field>
