<script lang="ts">
	import './layout.css';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { EXAMPLE_LINKS } from '#lib/examples/index.js';
	import { THEMES, view } from '#lib/preview/view.svelte.js';

	let { children }: LayoutProps = $props();

	// The top bar sticks to the top of the window. Its height, the top inset included, goes into
	// --top-bar-height: the component menu starts under it, and a jump to a showcase stops under it.
	let barHeight = $state(0);
	// Only the component page has a side menu, so only it shows the menu button.
	const hasMenu = $derived(page.url.pathname === '/');
	// Inside an iframe, such as a frame of the phone gallery, the page fills the frame: no top bar
	// and no padding around the page column. The preview renders on the client only, so the
	// window is there on the first render.
	const framed = window.self !== window.top;
	// A page outside the shell (/outside/view) fills the window by itself and draws its own head
	// line and <main>, so the layout draws no top bar and no <main> around it.
	const outside = $derived(page.route.id === '/outside/view');
	const bare = $derived(framed || outside);
	// The print page draws the document as its own <main>, so the layout draws no <main> around it.
	const ownMain = $derived(outside || page.route.id === '/print');

	const links = [
		['/', 'Components'],
		['/tokens', 'Tokens'],
		['/themes/compare', 'Generated theme'],
		['/charts', 'Charts'],
		['/outside', 'Outside the shell'],
		['/email', 'Email'],
		['/scripts', 'Scripts and direction'],
		['/print', 'Print'],
		...EXAMPLE_LINKS
	];
</script>

<!-- The provider keeps the open state of the component menu, so that the button in the top bar
     and the menu on the page share it. The sidebar showcase holds an inset sidebar, and nova paints
     the provider in the sidebar ground when one is inside it, so the provider keeps no ground. -->
<Sidebar.Provider
	class="flex-col has-data-[variant=inset]:bg-transparent"
	style="--sidebar-width: 15rem; --top-bar-height: {barHeight}px"
>
	{#if !bare}
		<header
			bind:offsetHeight={barHeight}
			class="safe-header sticky top-0 z-40 flex flex-wrap items-center gap-4 border-b border-border bg-background text-sm print:hidden"
		>
			{#if hasMenu}
				<Sidebar.Trigger aria-label="Component menu" />
			{/if}
			<nav class="flex min-w-0 grow basis-60 flex-wrap gap-3">
				{#each links as [href, label] (href)}
					<a {href} class="text-muted-foreground hover:text-foreground">{label}</a>
				{/each}
			</nav>
			<div class="ml-auto flex items-center gap-3">
				<label class="flex items-center gap-2">
					Theme
					<select
						id="theme-select"
						class="rounded-md border border-input bg-background px-2 py-1"
						value={view.theme}
						onchange={(e) => view.setTheme(e.currentTarget.value)}
					>
						{#each THEMES as name (name)}
							<option value={name}>{name}</option>
						{/each}
					</select>
				</label>
				<button
					id="mode-toggle"
					type="button"
					class="rounded-md border border-input px-2 py-1"
					aria-pressed={view.dark}
					onclick={() => view.setDark(!view.dark)}>Dark mode</button
				>
			</div>
		</header>
	{/if}

	<svelte:element this={ownMain ? 'div' : 'main'} class:safe-column={!bare}>
		{@render children()}
	</svelte:element>
</Sidebar.Provider>

<style>
	/* The preview reaches every edge of the screen (viewport-fit=cover in app.html), so the header
	   and the page column keep the safe area of each edge that they touch. No Tailwind class
	   writes env(), so the padding is written here: the Tailwind step (--spacing, 4 px) times 2
	   or 4, plus the inset. With no inset, nothing moves. */
	.safe-header {
		padding: calc(var(--spacing) * 2 + env(safe-area-inset-top)) calc(var(--spacing) * 4 + env(safe-area-inset-right))
			calc(var(--spacing) * 2) calc(var(--spacing) * 4 + env(safe-area-inset-left));
	}
	.safe-column {
		padding: calc(var(--spacing) * 4) calc(var(--spacing) * 4 + env(safe-area-inset-right))
			calc(var(--spacing) * 4 + env(safe-area-inset-bottom)) calc(var(--spacing) * 4 + env(safe-area-inset-left));
	}
	/* In print the margins of the paper replace the padding of the page column, and the top bar does
	   not print (print:hidden), as "### A screen page in print" in ## Print of DESIGN.md says. */
	@media print {
		.safe-column {
			padding: 0;
		}
	}
</style>
