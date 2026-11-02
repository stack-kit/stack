<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	/** The product that the head line names: its name, and its mark as a snippet or as a short text. */
	export type OutsideProduct = { name: string; mark: Snippet | string };
	/** The props that each page outside the shell takes: the attributes of its root element, its ref and the product. */
	export type OutsideRoot = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> & {
		ref?: HTMLDivElement | null;
		/** The product of the head line. Each page gives it, also a page that the product writes itself. */
		product: OutsideProduct;
	};
	/** A step that the server refused: the state that the page shows, and until, an ISO 8601 time where a pause ends. */
	export type Refused<S extends string> = { ok: false; state: S; until?: string };
	/** The function of the product that runs when the person is in: the product goes on, such as to the address that the person asked for. */
	export type Done = () => void | Promise<void>;
	/** A passkey step: the browser shows its sheet, and the server checks or saves the passkey. */
	export type Passkey = () => Promise<{ ok: true } | Refused<'cancelled' | 'failed'>>;

	export type OutsidePageProps = OutsideRoot & {
		/** The title of the page. The <title> of the window names it, then the product. */
		title: string;
		/** The <title> of the window, when it differs from the title, such as "Sign in". */
		tab?: string;
		/**
		 * The text under the title. With text, the page draws the title as the one h1 and the text under
		 * it. With no text, the content draws its own title, such as a title that keeps an identifier on one line.
		 */
		text?: string | Snippet;
		/** The line that shows with no script, in the place of each element that has the attribute data-needs-js. */
		noscript?: string | undefined;
		/** The h1 that the page draws with text, for the focus after a step that removes the button. */
		titleRef?: HTMLHeadingElement | null;
		children: Snippet;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	// A page outside the shell, as "### Page outside the shell" in DESIGN.md draws it: the head
	// line with the mark and the name of the product, then one column at the left edge of the
	// mark, at most the reading width, with no card and no edge. The column is never centered.
	// The <title> names the state first, then the product; tab gives a shorter name, such as
	// "Sign in", where the title of the page already names the product.
	//
	// With no script, a style rule in a <noscript> block of the head hides each element with the
	// attribute data-needs-js, and the noscript line shows under the title. Svelte renders the body of
	// a <noscript> element only on the server, so the client never draws the line.
	let {
		product,
		title,
		tab = title,
		text,
		noscript,
		titleRef = $bindable(null),
		children,
		class: className,
		ref = $bindable(null),
		...rest
	}: OutsidePageProps = $props();
</script>

<svelte:head>
	<title>{tab} · {product.name}</title>
	{#if noscript}
		<noscript>{@html '<style>[data-needs-js] { display: none !important; }</style>'}</noscript>
	{/if}
</svelte:head>

<div bind:this={ref} data-slot="outside-page" class={cn('flex min-h-svh flex-col bg-background text-foreground', className)} {...rest}>
	<!-- The head line holds no control, so the page has no skip link. The style block adds the top
	     inset to its 44 px, so the bar under the inset stays 44 px high with its edge. -->
	<header class="head-line flex h-11 shrink-0 items-center gap-2 border-b border-border">
		{#if typeof product.mark === 'string'}
			<span
				class="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground"
				aria-hidden="true">{product.mark}</span
			>
		{:else}
			<span class="flex h-6 shrink-0 items-center" aria-hidden="true">{@render product.mark()}</span>
		{/if}
		<span class="text-sm font-semibold">{product.name}</span>
	</header>
	<main class="column flex-1">
		<div class="flex max-w-180 flex-col gap-6">
			{#if text !== undefined}
				<div class="flex flex-col gap-2">
					<h1 bind:this={titleRef} tabindex="-1" data-slot="outside-page-title" class="text-xl font-semibold outline-none">{title}</h1>
					{#if typeof text === 'string'}
						<p class="text-sm text-muted-foreground">{text}</p>
					{:else}
						<div class="flex flex-col gap-2 text-sm text-muted-foreground">{@render text()}</div>
					{/if}
				</div>
			{/if}
			{#if noscript}
				<noscript><p class="text-sm">{noscript}</p></noscript>
			{/if}
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
