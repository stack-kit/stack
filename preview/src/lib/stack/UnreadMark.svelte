<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type UnreadMarkProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'class'> & {
		ref?: HTMLSpanElement | null;
		/** The class of the place, such as "absolute -top-0.5 -right-0.5 ring-2 ring-background" on an icon. */
		class?: string;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	// The unread mark (### unread-mark in DESIGN.md): a dot of 8 px in foreground that shows that
	// the person has not read an item yet. It draws the dot as an edge of 4 px on each side and no
	// ground, because print drops every ground, and an edge prints. A screen reader does not read
	// the dot, so the name of the control that opens the item holds the word "unread". On an icon,
	// the class of the place adds absolute and a ring of 2 px in the ground, such as
	// "absolute -top-0.5 -right-0.5 ring-2 ring-background".
	let { class: className, ref = $bindable(null), ...rest }: UnreadMarkProps = $props();
</script>

<span bind:this={ref} data-slot="unread-mark" aria-hidden="true" class={cn('size-2 shrink-0 rounded-full border-4 border-foreground', className)} {...rest}></span>
