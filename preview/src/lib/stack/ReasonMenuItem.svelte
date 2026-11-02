<script lang="ts" module>
	import type { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	/** @behaviour reason:line stopped-select */
	export type ReasonMenuItemProps = Omit<DropdownMenuPrimitive.ItemProps, 'child' | 'children' | 'onSelect' | 'ref'> & {
		ref?: HTMLDivElement | null;
		/** The label of the item, a verb that names the result. */
		label: string;
		/** Why a rule blocks the item, as a sentence. Leave it undefined while the item may run. */
		reason?: string;
		/** Runs when the person chooses the item, and never while a reason shows. */
		onSelect: () => void;
	};
</script>

<script lang="ts">
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { cn } from '#lib/utils.js';

	// A menu item that a rule can block ("Disabled with a reason" in ### dropdown-menu of DESIGN.md).
	// With no reason it is an item that runs onSelect. With a reason it stays reachable with the arrow
	// keys and runs nothing: Enter and a click keep the menu open, the label draws at 50% and a second
	// line gives the reason. Its name is the label, and its description the reason. Bits UI writes
	// aria-disabled="false" over a prop, so the child snippet sets the three attributes after the props.
	// The root keeps the slot of the item, so the touch target of the item holds on a phone.
	let { label, reason, onSelect, class: className, ref = $bindable(null), ...rest }: ReasonMenuItemProps = $props();

	const id = $props.id();
</script>

{#if reason}
	<DropdownMenu.Item bind:ref data-slot="dropdown-menu-item" class={cn(className)} {...rest} onSelect={(e) => e.preventDefault()}>
		{#snippet child({ props })}
			<div {...props} aria-disabled="true" aria-labelledby="{id}-label" aria-describedby="{id}-reason">
				<span class="flex flex-col">
					<span id="{id}-label" class="opacity-50">{label}</span>
					<span id="{id}-reason" data-slot="reason-menu-item-reason" class="text-xs text-muted-foreground">{reason}</span>
				</span>
			</div>
		{/snippet}
	</DropdownMenu.Item>
{:else}
	<DropdownMenu.Item bind:ref data-slot="dropdown-menu-item" class={cn(className)} {...rest} {onSelect}>{label}</DropdownMenu.Item>
{/if}
