<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type StateLineProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		ref?: HTMLDivElement | null;
		/** wait: small text in muted-foreground. cancel: body text with an info icon in muted-foreground. fail: body text with an icon in destructive. None: the line is empty. */
		kind?: 'wait' | 'cancel' | 'fail' | undefined;
		/** The text of the line. */
		text?: string | undefined;
		/** The text of the line, when it holds more than plain text, such as a request id. It replaces text. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import InfoIcon from '@lucide/svelte/icons/info';
	import { cn } from '#lib/utils.js';

	// The state line under the buttons of a page outside the shell (### Page outside the shell in
	// DESIGN.md, Action and Accessibility). A wait and a cancel speak in a role="status" region, and a
	// failure in a role="alert" region. Both regions are in the page from the first render, so a
	// screen reader reads each new text. The line keeps 8 px under the buttons. An empty line leaves
	// the flow (sr-only), so it takes no room and no gap of a flex column.
	let { kind, text = '', children, class: className, ref = $bindable(null), ...rest }: StateLineProps = $props();
</script>

{#snippet line()}{#if children}{@render children()}{:else}{text}{/if}{/snippet}

<div bind:this={ref} data-slot="state-line" class={cn('flex flex-col not-has-[p]:sr-only', className)} {...rest}>
	<div role="status">
		{#if kind === 'wait'}
			<p class="mt-2 text-xs text-muted-foreground">{@render line()}</p>
		{:else if kind === 'cancel'}
			<p class="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
				<InfoIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
				<span>{@render line()}</span>
			</p>
		{/if}
	</div>
	<div role="alert">
		{#if kind === 'fail'}
			<p class="mt-2 flex items-start gap-2 text-sm text-destructive">
				<CircleXIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
				<span>{@render line()}</span>
			</p>
		{/if}
	</div>
</div>
