<!--
	The look of rich text content (### rich-text-field and ### rich-text-view in DESIGN.md), in one place:
	the headings, the lists, the quote, code, a link, the divider and a picture. The text of the field and
	the read view both render this part, so a stored text looks as it looked while a person wrote it.

	- The text of the field gives no html: the part renders an empty element, and the engine fills it. The
	  view gives the html that the load list cleaned, and the part shows it.
	- paper: the content stands on rich-text-paper, as the text of a field with a color tool does. A link
	  takes rich-text-link in both modes. In dark mode the paper stays light, so the colors of the theme
	  for a dark ground do not read on it, and the content takes them from rich-text-ink: a quote at 70%,
	  the ground of code at 6% and an edge at 20%. npm run contrast checks each text of them on
	  rich-text-paper. The edge is decorative.
	- fromInk: the page gave a paper, so the content takes these colors from its ink in both modes, and a
	  quote and code read the paper of the part and not the theme. In development the part checks them
	  (paper.ts).
	- The rules read the custom properties --rich-text-ink and --rich-text-link where the content stands,
	  so the paper prop of a field or a view, which sets them on the root of the part, reaches them. The
	  --color- form of a role takes its value at the root of the page, so it serves only as the fallback.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type ContentProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		ref?: HTMLDivElement | null;
		class?: string | undefined;
		/** The HTML to show, cleaned by the load list; none for the text of the field, which the engine fills. */
		html?: string | undefined;
		/** The content stands on rich-text-paper. */
		paper?: boolean | undefined;
		/** The page gave a paper: a quote, code and an edge take their colors from the ink in both modes. */
		fromInk?: boolean | undefined;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	let { html, paper = false, fromInk = false, class: className, ref = $bindable(null), ...rest }: ContentProps = $props();
</script>

<!-- Two branches, so that no block of Svelte stands inside the element that the engine fills. -->
{#if html === undefined}
	<div bind:this={ref} class={cn('content', paper && 'paper', fromInk && 'from-ink', className)} {...rest}></div>
{:else}
	<div bind:this={ref} class={cn('content', paper && 'paper', fromInk && 'from-ink', className)} {...rest}>{@html html}</div>
{/if}

<style>
	:global(.dark) .paper,
	.from-ink {
		--content-muted: color-mix(in oklab, var(--rich-text-ink, var(--color-rich-text-ink)) 70%, transparent);
		--content-ground: color-mix(in oklab, var(--rich-text-ink, var(--color-rich-text-ink)) 6%, transparent);
		--content-edge: color-mix(in oklab, var(--rich-text-ink, var(--color-rich-text-ink)) 20%, transparent);
	}
	/* The content takes no class from the HTML, so these rules give it its look. */
	.content :global(h1) {
		margin: 0.5em 0 0.25em;
		font-size: var(--text-xl);
		line-height: var(--text-xl--line-height);
		font-weight: 600;
	}
	.content :global(h2) {
		margin: 0.5em 0 0.25em;
		font-size: var(--text-base);
		line-height: var(--text-base--line-height);
		font-weight: 600;
	}
	.content :global(h3) {
		margin: 0.5em 0 0.25em;
		font-weight: 600;
	}
	/* The start of the line, so that a list and a quote from right to left keep their markers and their edge on the right. */
	.content :global(ul) {
		list-style: disc;
		padding-inline-start: 1.5em;
	}
	.content :global(ol) {
		list-style: decimal;
		padding-inline-start: 1.5em;
	}
	.content :global(blockquote) {
		margin: 0.25em 0;
		border-inline-start: 2px solid var(--content-edge, var(--color-border));
		padding-inline-start: 0.75em;
		color: var(--content-muted, var(--color-muted-foreground));
	}
	.content :global(pre) {
		border-radius: var(--radius-md);
		background-color: var(--content-ground, var(--color-muted));
		padding: 0.5em 0.75em;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		line-height: var(--text-xs--line-height);
		white-space: pre-wrap;
	}
	.content :global(code) {
		border-radius: var(--radius-sm);
		background-color: var(--content-ground, var(--color-muted));
		padding: 0 0.25em;
		font-family: var(--font-mono);
		font-size: 0.9em;
	}
	.content :global(pre code) {
		background-color: transparent;
		padding: 0;
	}
	.content :global(a) {
		color: var(--color-link);
		text-decoration: underline;
	}
	.paper :global(a) {
		color: var(--rich-text-link, var(--color-rich-text-link));
	}
	.content :global(hr) {
		margin: 0.75em 0;
		border: 0;
		border-top: 1px solid var(--content-edge, var(--color-border));
	}
	.content :global(img) {
		max-width: 100%;
		height: auto;
	}
</style>
