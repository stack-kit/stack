<script lang="ts">
	import type { Snippet } from 'svelte';

	// The item in the item column of the work form ("Properties beside the content" in ### Detail
	// pane of DESIGN.md). The column is 444 to 800 px wide from 1024 to 1440 px, so the item places
	// its properties panel by the width of its own box, with a container query, and not by the
	// window. The box is the column less its 16 px side padding: @container sits on the padded part,
	// and a container query reads the content box. The header spans the box. From a box of 672 px
	// (@2xl) the properties panel stands at the right of the content, in a column of 288 px (w-72)
	// with a border edge on its left; from a box of 1,152 px (@6xl) that column is 420 px (w-105).
	// The content keeps at most 720 px (max-w-180) and starts at the start edge of its box. Below
	// 672 px the properties panel follows the content, with a border edge on top. A page that shows
	// the properties in another form, such as the row of values of band 2, passes no properties.
	let {
		header,
		content,
		properties
	}: {
		/** The header of the item: the identifier, the state, the position and Close. */
		header?: Snippet;
		content: Snippet;
		properties?: Snippet;
	} = $props();
</script>

<div class="flex flex-col gap-4 p-4 @container">
	{#if header}{@render header()}{/if}
	<div class="flex flex-col gap-4 @2xl:flex-row @2xl:items-start @2xl:gap-0">
		<div class="min-w-0 flex-1 @2xl:pr-4">
			<div class="flex max-w-180 flex-col gap-4">{@render content()}</div>
		</div>
		{#if properties}
			<div class="border-t border-border pt-4 @2xl:w-72 @2xl:shrink-0 @2xl:self-stretch @2xl:border-t-0 @2xl:border-l @2xl:pt-0 @2xl:pl-4 @6xl:w-105">
				{@render properties()}
			</div>
		{/if}
	</div>
</div>
