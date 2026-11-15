<!--
	The frame of the toolbar of the rich text field (### rich-text-field in DESIGN.md), in the block-start
	row of its input group: a toolbar with a name and aria-controls on the text, the groups of tools
	(children: Tools.svelte, which the field loads in a chunk of its own) and the controls of the page at
	its end. The frame renders with the page, so the controls of the page show from the first render.

	- The bar sticks to the top of the column that scrolls, at --rich-text-toolbar-top (0 by default), so a
	  page with a sticky bar of its own sets the height of that bar. While it is stuck its top corners are
	  square. An IntersectionObserver finds that it is stuck, so the bar adds no listener to the window.
	- The controls of the page stay outside the arrow order of the tools, and stay on while the text is
	  read-only.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type ToolbarProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		ref?: HTMLDivElement | null;
		class?: string | undefined;
		/** The name of the bar. */
		label?: string | undefined;
		/** The id of the text, which the bar controls. */
		controls: string;
		/** The groups of tools. */
		children?: Snippet | undefined;
		/** The controls of the page at the end of the bar, such as a tool that asks a service for proposed changes. */
		end?: Snippet | undefined;
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '#lib/utils.js';

	let { label = 'Formatting', controls, children, end, class: className, ref = $bindable(null), ...rest }: ToolbarProps = $props();

	// ---- Stuck at the top of the column that scrolls. The observer watches the bar in the column that
	// scrolls, with its top edge 1 px under the offset of the bar: a stuck bar stands across that edge.
	let stuck = $state(false);
	let watcher: { observer: IntersectionObserver; top: number } | null = null;

	/** The nearest element above that scrolls, or null for the window. */
	function scroller(el: HTMLElement): HTMLElement | null {
		for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
			if (/(auto|scroll|overlay)/.test(getComputedStyle(p).overflowY)) return p;
		}
		return null;
	}

	function watch() {
		if (!ref) return;
		const top = parseFloat(getComputedStyle(ref).top) || 0;
		if (watcher?.top === top) return;
		watcher?.observer.disconnect();
		const observer = new IntersectionObserver(
			(entries) => {
				const e = entries.at(-1);
				if (!e?.rootBounds) return;
				stuck = e.intersectionRatio < 1 && e.boundingClientRect.top < e.rootBounds.top;
			},
			{ root: scroller(ref), rootMargin: `${-(top + 1)}px 0px 0px 0px`, threshold: [1] }
		);
		observer.observe(ref);
		watcher = { observer, top };
	}

	onMount(() => {
		watch();
		// The page can change the offset of the bar, such as when its own sticky bar changes its height.
		const resize = new ResizeObserver(() => watch());
		if (ref) resize.observe(ref);
		return () => {
			resize.disconnect();
			watcher?.observer.disconnect();
			watcher = null;
		};
	});
</script>

<div
	bind:this={ref}
	data-slot="rich-text-toolbar"
	data-stuck={stuck ? '' : undefined}
	role="toolbar"
	aria-label={label}
	aria-controls={controls}
	aria-orientation="horizontal"
	class={cn(
		'sticky top-[var(--rich-text-toolbar-top,0px)] z-10 flex w-full min-w-0 items-center gap-2 rounded-t-[calc(var(--radius-lg)-1px)] border-b border-border bg-background p-1 data-stuck:rounded-t-none',
		className
	)}
	{...rest}
>
	{@render children?.()}
	{#if end}
		<div class="flex shrink-0 items-center gap-1">{@render end()}</div>
	{/if}
</div>
