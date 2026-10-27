<script lang="ts">
	import type { Component } from 'svelte';
	import ComponentMenu from '#lib/stack/ComponentMenu.svelte';
	import { MENU_NAMES } from '#lib/stack/component-menu.js';

	// One file per component in src/lib/showcase/, named after the registry item. The page shows
	// them in the order of the component menu, so the current link of the menu moves down as the
	// page scrolls.
	const files = new Map(
		Object.entries(
			import.meta.glob<Component>('../lib/showcase/*.svelte', { eager: true, import: 'default' })
		).map(([path, component]) => [path.slice(path.lastIndexOf('/') + 1, -'.svelte'.length), component])
	);
	const unlisted = [...files.keys()].filter((name) => !MENU_NAMES.includes(name));
	const missing = MENU_NAMES.filter((name) => !files.has(name));
	if (unlisted.length || missing.length) {
		throw new Error(
			`The component menu (src/lib/stack/component-menu.ts) and src/lib/showcase/ disagree. ` +
				`Showcases not in the menu: ${unlisted.join(', ') || 'none'}. ` +
				`Menu names with no showcase: ${missing.join(', ') || 'none'}.`
		);
	}
	const showcases = MENU_NAMES.map((name) => ({ name, component: files.get(name)! }));
</script>

<svelte:head>
	<title>Components</title>
</svelte:head>

<div class="menu-row flex print:[&>[data-slot=sidebar]]:hidden">
	<ComponentMenu />
	<div class="showcases min-w-0 flex-1">
		<h1 class="mb-1 text-xl font-semibold">Components</h1>
		<p class="mb-6 text-sm text-muted-foreground">
			{showcases.length} components, each in every variant and size, and in each state that a prop
			can force. An overlay opens with its trigger, or with <code class="font-mono">?open=</code> and
			the <code class="font-mono">data-open-id</code> of the trigger.
		</p>

		{#each showcases as { name, component: Showcase } (name)}
			<Showcase />
		{/each}
	</div>
</div>

<style>
	/* The top bar sticks to the top of the window, so a jump to a showcase stops under it. The last
	   showcase is at least one screen tall, so that a jump to it stops there too. */
	.showcases :global([data-showcase]) {
		scroll-margin-top: var(--top-bar-height);
	}
	.showcases > :global([data-showcase]:last-child) {
		min-height: calc(100svh - var(--top-bar-height));
	}
	/* Some showcases change height after a jump, such as an accordion that opens on mount. The
	   browser then keeps one box in view at the same place, its scroll anchor. From 768 px, the
	   box of the menu is as tall as the page and its top never moves. When the browser anchors to
	   that box, the showcase of the jump moves away from the top bar, so the menu is never the
	   anchor. */
	.menu-row > :global([data-slot='sidebar']) {
		overflow-anchor: none;
	}
</style>
