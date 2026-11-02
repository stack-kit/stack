<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	/** @behaviour close-sheet:navigate */
	export type CloseSheetOnNavigateProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		ref?: HTMLDivElement | null;
		/** Content to render, such as the sidebar. The part needs none. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { useSidebar } from '#lib/components/ui/sidebar/index.js';
	import { cn } from '#lib/utils.js';

	// Below 768 px the nova sidebar is a sheet ("Phone" in ### sidebar of DESIGN.md). A link in the sheet
	// opens a page, and the sheet closes. Put the part once inside Sidebar.Provider. It takes no box of
	// its own, and it renders its children, if it has any.
	let { children, class: className, ref = $bindable(null), ...rest }: CloseSheetOnNavigateProps = $props();

	const sidebar = useSidebar();
	afterNavigate(() => sidebar.setOpenMobile(false));
</script>

<div bind:this={ref} data-slot="close-sheet-on-navigate" class={cn('contents', className)} {...rest}>
	{@render children?.()}
</div>
