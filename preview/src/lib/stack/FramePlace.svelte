<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { PlaceName } from '#lib/stack/behaviour/place.js';

	/** @behaviour place:top-bar,phone-header live-region */
	export type FramePlaceProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		ref?: HTMLDivElement | null;
		/** 'top-bar' for the top bar, from 768 px, and 'phone-header' for the 52 px header of a phone. */
		name: PlaceName;
		/** The content of the frame, such as the breadcrumbs and the controls of the top bar. */
		children: Snippet;
	};
</script>

<script lang="ts">
	import { holdPlace, placeOf } from '#lib/stack/place-state.js';
	import { cn } from '#lib/utils.js';

	// A place of the frame of a product ("Top bar" in ## Layout of DESIGN.md). The frame wraps the
	// content of its top bar in <FramePlace name="top-bar">, and the content of its phone header in
	// <FramePlace name="phone-header">. While a part claims the place, such as SelectionBar while one or
	// more rows are selected, the place shows the claim in the place of its content. The place takes no
	// box of its own, so the content keeps the layout of the frame, and [data-claimed] marks a claim.
	// Its polite live region is in the page before the first claim, so a screen reader says each text
	// that the part announces, such as "2 selected".
	let { name, children, class: className, ref = $bindable(null), ...rest }: FramePlaceProps = $props();

	const place = $derived(placeOf(name));
	$effect(() => holdPlace(name));
</script>

<div bind:this={ref} data-slot="frame-place" data-claimed={place.content ? '' : undefined} class={cn('contents', className)} {...rest}>
	{#if place.content}
		{@render place.content()}
	{:else}
		{@render children()}
	{/if}
	<p role="status" class="sr-only">{place.said}</p>
</div>
