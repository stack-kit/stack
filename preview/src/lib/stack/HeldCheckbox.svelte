<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	/** @behaviour reason:tooltip held */
	export type HeldCheckboxProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'id' | 'aria-label' | 'aria-labelledby'> & {
		/** The root, the box that holds the check box and its hidden reason. */
		ref?: HTMLSpanElement | null;
		/** The value that the rule holds. */
		checked: boolean;
		/** Why the box does not change, as a sentence, such as "Set by Sales. Change it in the Sales row." */
		reason: string;
		/** The id of the check box, for a label with for. */
		id?: string;
		/** More ids of the description of the check box, after the reason. */
		describedby?: string;
		/** The name of the check box, when no label names it, such as in a row of a table. */
		'aria-label'?: string;
		/** The ids of the texts that name the check box, such as the name cell of its row. */
		'aria-labelledby'?: string;
	};
</script>

<script lang="ts">
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';
	import { checkboxReadonly } from '#lib/stack/checkbox-readonly.js';

	// A check box that a rule holds ("Read-only" in ### checkbox, and "Set by a parent row" in ### table
	// of DESIGN.md). readonly keeps it in the tab order, and a click or Space does not change it. It
	// takes aria-disabled="true" and its reason, as a button that is disabled with a reason: a tooltip
	// on hover and on keyboard focus, and a hidden line that aria-describedby points to. The box is the
	// trigger of the tooltip through its child snippet, which gives it data-slot="tooltip-trigger", so
	// data-slot="checkbox" comes after the props. The part gives its own tooltip provider.
	let { checked, reason, id, describedby, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, class: className, ref = $bindable(null), ...rest }: HeldCheckboxProps = $props();

	const uid = $props.id();
</script>

<span bind:this={ref} data-slot="held-checkbox" class={cn('flex w-fit', className)} {...rest}>
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Checkbox
						{...props}
						{...id === undefined ? {} : { id }}
						data-slot="checkbox"
						{checked}
						readonly
						aria-disabled="true"
						aria-label={ariaLabel}
						aria-labelledby={ariaLabelledby}
						aria-describedby={describedby ? `${uid}-reason ${describedby}` : `${uid}-reason`}
						class={checkboxReadonly}
					/>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>{reason}</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
	<span id="{uid}-reason" hidden>{reason}</span>
</span>
