<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	/** A feedback role of the tokens. Each one gives the banner its tint. */
	export type BannerRole = 'success' | 'warning' | 'info' | 'destructive';

	export type BannerProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> & {
		ref?: HTMLDivElement | null;
		/**
		 * The feedback role of the tokens that tints the banner. Leave it out for a neutral banner. The
		 * part sets the ARIA role from it: with destructive the banner has the alert role, which a screen
		 * reader says at once, and every other banner has the status role. A `role` that the page gives
		 * wins over the role from `tint`, such as `role="alert"` for a warning that must speak at once.
		 */
		tint?: BannerRole;
		/** The message in words, because the icon and the tint carry no meaning alone. */
		title: string;
		/** A 16 px icon before the title. */
		icon?: Snippet;
		/** The description under the title. A strong element in it marks the key words. */
		children?: Snippet;
		/** The action at the top right, such as an outline button of size xs. */
		action?: Snippet;
	};
</script>

<script lang="ts">
	import * as Alert from '#lib/components/ui/alert/index.js';
	import { cn } from '#lib/utils.js';

	// A banner (### alert of DESIGN.md, and "Banner" in ## Layout): an alert that spans the width under
	// the top bar, across the list and the pane, at least 36 px high, with no radius and a border edge
	// below. A feedback banner takes the tint of its role on the default variant: the role at 10% for
	// the ground and at 35% for the edge, and the text in the role. A neutral banner keeps the colors
	// of the default variant. The key words of the description are 600.
	let { tint, title, icon, children, action, class: className, ref = $bindable(null), ...rest }: BannerProps = $props();

	// Literal classes, so that Tailwind finds each one in this file.
	const TINT: Readonly<Record<BannerRole, string>> = {
		success: 'border-success/35 bg-success/10 text-success *:data-[slot=alert-description]:text-success',
		warning: 'border-warning/35 bg-warning/10 text-warning *:data-[slot=alert-description]:text-warning',
		info: 'border-info/35 bg-info/10 text-info *:data-[slot=alert-description]:text-info',
		destructive: 'border-destructive/35 bg-destructive/10 text-destructive *:data-[slot=alert-description]:text-destructive'
	};
</script>

<Alert.Root
	bind:ref
	data-slot="banner"
	class={cn('min-h-9 rounded-none border-0 border-b [&_strong]:font-semibold', tint && TINT[tint], className)}
	{...rest}
	role={rest.role ?? (tint === 'destructive' ? 'alert' : 'status')}
>
	{@render icon?.()}
	<Alert.Title>{title}</Alert.Title>
	{#if children}<Alert.Description>{@render children()}</Alert.Description>{/if}
	{#if action}<Alert.Action>{@render action()}</Alert.Action>{/if}
</Alert.Root>
