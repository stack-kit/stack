<script lang="ts">
	import { page } from '$app/state';
	import { view } from '#lib/preview/view.svelte.js';
	import { PAGES, addressOf, viewHref, type PageKind } from '#lib/preview/samples.js';

	// The pages outside the shell in their states. Each state has its own address. Each frame is
	// an iframe, a window of its own, so the page inside reads the width of the frame: the
	// window frame shows the layout from 768 px, and the phone frame of 390 by 844 px the layout
	// of a phone. A frame does not follow the theme switch of this page: the key makes new frames
	// after a switch, and each new frame reads the theme and the mode that the switch stored.
	const address = $derived(addressOf(page.url));
	const src = $derived(viewHref(address.kind, address.state));
	const kinds = Object.keys(PAGES) as PageKind[];
	const link = 'text-muted-foreground underline-offset-4 hover:text-foreground hover:underline';
</script>

<svelte:head>
	<title>Page outside the shell</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-1">
		<h1 class="text-base font-semibold">Page outside the shell</h1>
		<p class="text-sm text-muted-foreground">
			A page that a person opens with no session: the page of a signed link, a read-only link, the sign-in page, the
			recovery page and the page of a setup link, as "Page outside the shell" in DESIGN.md defines them. Each sign-in
			state opens after its step, with an invented answer of the server. Every name, text and date is invented.
		</p>
	</div>

	<div class="flex flex-col gap-1 text-sm">
		{#each kinds as kind (kind)}
			<nav aria-label={PAGES[kind].label} class="flex flex-wrap items-baseline gap-x-1.5">
				<span class="text-muted-foreground">{PAGES[kind].label}:</span>
				{#each PAGES[kind].states as s, i (s)}
					{@const current = kind === address.kind && s === address.state}
					{#if i > 0}<span class="text-faint-foreground" aria-hidden="true">·</span>{/if}
					<a
						href="/outside?page={kind}&state={s}"
						aria-current={current ? 'page' : undefined}
						class={current ? 'font-medium text-foreground' : link}>{s}</a
					>
				{/each}
			</nav>
		{/each}
		<a href={src} class={['self-start font-mono text-xs', link]}>{src}</a>
	</div>

	{#key `${view.theme} ${view.dark} ${src}`}
		<section class="flex flex-col gap-2">
			<h2 class="text-sm font-medium">Window</h2>
			<iframe {src} title="{PAGES[address.kind].label}, {address.state}, window" class="h-150 w-full rounded-lg border border-border"></iframe>
		</section>
		<section class="flex flex-col gap-2">
			<h2 class="text-sm font-medium">Phone, 390 by 844 px</h2>
			<!-- 392 by 846 px with the 1 px border, so the window inside is 390 by 844 px. -->
			<iframe {src} title="{PAGES[address.kind].label}, {address.state}, phone" class="h-211.5 w-98 max-w-full rounded-lg border border-border"></iframe>
		</section>
	{/key}
</div>
