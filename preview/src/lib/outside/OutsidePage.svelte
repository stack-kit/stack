<script lang="ts">
	import type { Snippet } from 'svelte';
	import { PRODUCT } from './data.js';

	// A page outside the shell, as "### Page outside the shell" in DESIGN.md draws it: the head
	// line with the mark and the name of the product, then one column at the left edge of the
	// mark, at most the reading width, with no card and no edge. The column is never centered.
	// The <title> names the state first, then the product; tab gives a shorter name, such as
	// "Sign in", where the title of the page already names the product.
	let { title, tab = title, children }: { title: string; tab?: string; children: Snippet } = $props();
</script>

<svelte:head>
	<title>{tab} · {PRODUCT.name}</title>
</svelte:head>

<div class="flex min-h-svh flex-col bg-background text-foreground">
	<!-- The head line holds no control, so the page has no skip link. The style block adds the top
	     inset to its 44 px, so the bar under the inset stays 44 px high with its edge. -->
	<header class="head-line flex h-11 shrink-0 items-center gap-2 border-b border-border">
		<span
			class="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground"
			aria-hidden="true">{PRODUCT.mark}</span
		>
		<span class="text-sm font-semibold">{PRODUCT.name}</span>
	</header>
	<main class="column flex-1">
		<div class="flex max-w-180 flex-col gap-6">
			{@render children()}
		</div>
	</main>
</div>

<style>
	/* The page touches all four edges of the screen, so the head line keeps the top, the left and
	   the right inset, and the column the left, the right and the bottom inset. No Tailwind class
	   writes env(), so the padding is written here: the Tailwind step (--spacing, 4 px) times 6 from
	   768 px and times 4 below, plus the inset. With no inset, nothing moves. */
	.head-line {
		height: calc(var(--spacing) * 11 + env(safe-area-inset-top));
		padding: env(safe-area-inset-top) calc(var(--spacing) * 6 + env(safe-area-inset-right)) 0
			calc(var(--spacing) * 6 + env(safe-area-inset-left));
	}
	.column {
		padding: calc(var(--spacing) * 8) calc(var(--spacing) * 6 + env(safe-area-inset-right))
			calc(var(--spacing) * 12 + env(safe-area-inset-bottom)) calc(var(--spacing) * 6 + env(safe-area-inset-left));
	}
	@media (width < 48rem) {
		.head-line {
			padding-left: calc(var(--spacing) * 4 + env(safe-area-inset-left));
			padding-right: calc(var(--spacing) * 4 + env(safe-area-inset-right));
		}
		.column {
			padding-left: calc(var(--spacing) * 4 + env(safe-area-inset-left));
			padding-right: calc(var(--spacing) * 4 + env(safe-area-inset-right));
		}
	}
</style>
