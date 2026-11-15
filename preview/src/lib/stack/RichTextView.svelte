<!--
	The read view of a rich text (### rich-text-view in DESIGN.md): a stored text with the look that it had
	in the rich text field, such as a note in a detail pane or the first lines of a comment in a list. It
	loads no engine and no toolbar.

	- The view cleans the HTML with the load list of @stack-kit/stack/rich-text, with its preset and its
	  picture test, before it shows it, so a page gives it the stored HTML as it is. The list needs a DOM, so
	  the view shows the text after the mount, and the HTML of the server holds the empty view.
	- The full preset stands on rich-text-paper with the ink and the link of the paper, as the text of a
	  field with a color tool, because a content color keeps its value in every mode. The simple preset
	  stands on the ground of the page. A paper of the page takes the place of the three roles for this
	  view, and a view with a paper stands on it in every preset, with a quote and code in its ink in both
	  modes. In development, the view warns in the console when a text of the content reads under 4.5:1 on
	  that paper (paperContrast of @stack-kit/stack/rich-text).
	- lines clamps the text to that many lines, with an ellipsis. The whole text stays in the page, so a
	  screen reader reads it all.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { RichTextPaper, RichTextPreset } from './rich-text.js';

	export type RichTextViewProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		/** The root element of the part. */
		ref?: HTMLDivElement | null;
		class?: string | undefined;
		/** The stored HTML. The view cleans it with the load list before it shows it. */
		html: string;
		/** The preset of the field that wrote the text: `full` by default, or `simple`, which keeps lines, bold, italic and underline only. */
		preset?: RichTextPreset | undefined;
		/** True for each picture address that the view keeps. By default defaultPicture of @stack-kit/stack/rich-text. */
		picture?: ((src: string) => boolean) | undefined;
		/** The paper of this view: its ground, its ink and the color of a link, each a CSS color, as the paper of the field that wrote the text. */
		paper?: RichTextPaper | undefined;
		/** The most lines that show, with an ellipsis after the last one. Every line by default. */
		lines?: number | undefined;
	};
</script>

<script lang="ts">
	import { dev } from '$app/env';
	import { onMount, untrack } from 'svelte';
	import Content from '#lib/rich-text/Content.svelte';
	import { PROBE, paperWarning, readPaper, weakPairs } from '#lib/rich-text/paper.js';
	import { cn } from '#lib/utils.js';
	import { defaultPicture, sanitizeRichText } from './rich-text.js';

	let { html, preset = 'full', picture = defaultPicture, paper, lines, class: className, ref = $bindable(null), ...rest }: RichTextViewProps = $props();

	// The load list needs a DOM, so the text shows after the mount.
	let mounted = $state(false);
	onMount(() => (mounted = true));
	const clean = $derived(mounted ? sanitizeRichText(html, { list: 'load', preset, picture }) : '');
	const onPaper = $derived(paper !== undefined || preset === 'full');

	// A paper of the page whose ink or link reads under 4.5:1 gives a warning in development.
	let probe = $state<HTMLSpanElement | null>(null);
	$effect(() => {
		const p = paper;
		const at = probe;
		if (!dev || !p || !at) return;
		void [p.paper, p.ink, p.link];
		untrack(() => {
			const colors = readPaper(at, ref?.parentElement ?? null);
			const pairs = colors ? weakPairs(colors) : [];
			if (pairs.length > 0) console.warn(paperWarning('rich text view', pairs, p));
		});
	});
</script>

<div
	bind:this={ref}
	data-slot="rich-text-view"
	class={cn('min-w-0 text-base wrap-break-word md:text-md', onPaper ? 'rounded-lg bg-rich-text-paper px-3 py-2.5 text-rich-text-ink' : 'text-foreground', className)}
	style:--rich-text-lines={lines}
	style:--rich-text-paper={paper?.paper}
	style:--rich-text-ink={paper?.ink}
	style:--rich-text-link={paper?.link}
	{...rest}
>
	<Content html={clean} paper={onPaper} fromInk={paper !== undefined} class={lines !== undefined ? 'line-clamp-(--rich-text-lines)' : undefined} />
	{#if paper}<span bind:this={probe} aria-hidden="true" class={PROBE}></span>{/if}
</div>
