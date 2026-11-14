<script lang="ts">
	import { mode } from "mode-watcher";
	import { onMount, untrack } from "svelte";
	import { on } from "svelte/events";
	import { Toaster as Sonner, toast, type ToasterProps as SonnerProps } from "svelte-sonner";
	import { Button } from "#lib/components/ui/button/index.js";
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import OctagonXIcon from '@lucide/svelte/icons/octagon-x';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	// The Toaster of the registry, as STACK changed it ("### sonner" in DESIGN.md). sonner.svelte renders it.
	// Every toast that waits stays until its own end. The stack shows visibleToasts of them, the newest in
	// front. From two toasts, a bar under the stack holds Close all. While more toasts wait than the stack
	// shows, the bar also holds "+N more", which opens the list of every toast. The list scrolls when it is
	// taller than the window, and Esc or a second press closes it. sonner.svelte gives the words of the bar,
	// closeAllLabel and moreLabel, and the bar takes the name of the toasts, containerAriaLabel.
	let {
		id,
		position = "bottom-right",
		offset,
		mobileOffset,
		visibleToasts = 3,
		expand = false,
		containerAriaLabel = "Notifications",
		swipeDirections,
		onpointercancel,
		closeAllLabel,
		moreLabel,
		...restProps
	}: SonnerProps & { closeAllLabel: string; moreLabel: (n: number) => string } = $props();

	/** The toasts of this Toaster that have not ended, the newest first. */
	const waiting = $derived(toast.getActiveToasts().filter((t) => (id ? t.toasterId === id : !t.toasterId)));
	/** The count of the toasts that the stack hides. */
	const hidden = $derived(Math.max(0, waiting.length - visibleToasts));
	const hasBar = $derived(waiting.length >= 2);
	const [y, x] = $derived(position.split("-") as [string, string]);
	/** In the list a drag up or down scrolls, so a toast there swipes out only to its side. */
	const listSwipe = $derived(
		(swipeDirections ?? [y, x]).filter((d): d is "left" | "right" => d === "left" || d === "right")
	);

	let listOpen = $state(false);
	let barHeight = $state(0);
	let bar = $state<HTMLElement | null>(null);
	let more = $state<HTMLElement | null>(null);
	let closeAll = $state<HTMLElement | null>(null);
	/** The element outside the toasts that had the focus before the bar, so that the focus can go back. */
	let returnTo: HTMLElement | null = null;

	const inToasts = (e: Element | null) => !!e?.closest("[data-sonner-toaster], [data-slot=toaster-bar]");

	/** The gap of one side, as svelte-sonner reads offset and mobileOffset. */
	function side(o: SonnerProps["offset"], key: "top" | "right" | "bottom" | "left", fallback: string): string {
		const v = typeof o === "object" ? o[key] : o;
		return v === undefined ? fallback : typeof v === "number" ? `${v}px` : v;
	}
	/** The gaps of the stack: the gap of the side of the bar grows by the bar and 8 px. */
	function lifted(o: SonnerProps["offset"], fallback: string) {
		const s = (key: "top" | "right" | "bottom" | "left") => {
			const v = side(o, key, fallback);
			return hasBar && key === y ? `calc(${v} + ${barHeight + 8}px)` : v;
		};
		return { top: s("top"), right: s("right"), bottom: s("bottom"), left: s("left") };
	}
	const barStyle = $derived(
		(["top", "right", "bottom", "left"] as const)
			.map((k) => `--bar-${k}: ${side(offset, k, "24px")}; --bar-mobile-${k}: ${side(mobileOffset, k, "16px")};`)
			.join(" ")
	);

	function closeList() {
		listOpen = false;
		// A toast past visibleToasts hides with the list, so the focus in the list goes to "+N more".
		if (document.activeElement?.closest("[data-sonner-toaster]")) more?.focus();
	}

	// Close all ends each toast as its close button does, so each toast with Undo runs its onend. A toast
	// that loads, or that the product made not dismissible, has no close button and stays.
	function endAll() {
		if (bar?.contains(document.activeElement) && returnTo?.isConnected) returnTo.focus();
		for (const t of waiting) if (t.type !== "loading" && t.dismissible !== false) toast.dismiss(t.id);
	}

	// A drag up or down in the list scrolls it, and the browser then ends the pointer with pointercancel in
	// place of pointerup. svelte-sonner has no handler for pointercancel, so the toast would keep the state
	// of a swipe, and the Toaster would pause every timer until the next pointerup in it. So the toast gets
	// a pointerup with no swipe amount, which ends no toast, and the pointerup reaches the Toaster too.
	function endCancelledDrag(e: PointerEvent & { currentTarget: EventTarget & HTMLOListElement }) {
		onpointercancel?.(e);
		const t = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-sonner-toast]") : null;
		if (!t) return;
		t.style.setProperty("--swipe-amount-x", "0px");
		t.style.setProperty("--swipe-amount-y", "0px");
		t.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: e.pointerId, pointerType: e.pointerType }));
	}

	// The list closes when the stack shows every toast again.
	$effect(() => {
		if (hidden === 0) untrack(() => (listOpen = false));
	});

	// A button that goes takes the focus with it, so the focus moves before the button goes: from
	// "+N more" to Close all, and from the bar back to where it came from.
	$effect.pre(() => {
		const keepBar = hasBar;
		const keepMore = hidden > 0;
		untrack(() => {
			const at = document.activeElement;
			if (!keepBar && at instanceof HTMLElement && bar?.contains(at)) {
				if (returnTo?.isConnected) returnTo.focus();
				else at.blur();
			} else if (!keepMore && at === more) closeAll?.focus();
		});
	});

	// Esc closes the list first, while the focus is in the toasts, in the bar or nowhere. It then calls
	// preventDefault, so that the keys of the page skip it, as a layer of Bits UI does.
	onMount(() =>
		on(document, "keydown", (e) => {
			if (e.key !== "Escape" || !listOpen || e.defaultPrevented) return;
			const at = document.activeElement;
			if (at && at !== document.body && !inToasts(at)) return;
			e.preventDefault();
			closeList();
		})
	);
</script>

<Sonner
	theme={mode.current}
	class="toaster group"
	style="--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border);"
	toastOptions={{
		classes: {
			toast: "cn-toast",
		},
	}}
	{...restProps}
	{id}
	{position}
	{containerAriaLabel}
	swipeDirections={listOpen ? listSwipe : swipeDirections}
	onpointercancel={endCancelledDrag}
	offset={lifted(offset, "24px")}
	mobileOffset={lifted(mobileOffset, "16px")}
	visibleToasts={listOpen ? Number.POSITIVE_INFINITY : visibleToasts}
	expand={listOpen || expand}
	data-list-open={listOpen ? "" : undefined}
>
	{#snippet loadingIcon()}
		<Loader2Icon class="size-4 animate-spin" />
	{/snippet}
	{#snippet successIcon()}
		<CircleCheckIcon class="size-4" />
	{/snippet}
	{#snippet errorIcon()}
		<OctagonXIcon class="size-4" />
	{/snippet}
	{#snippet infoIcon()}
		<InfoIcon class="size-4" />
	{/snippet}
	{#snippet warningIcon()}
		<TriangleAlertIcon class="size-4" />
	{/snippet}
</Sonner>

{#if hasBar}
	<div
		bind:this={bar}
		bind:offsetHeight={barHeight}
		data-slot="toaster-bar"
		data-y={y}
		data-x={x}
		role="group"
		aria-label={containerAriaLabel}
		style={barStyle}
		class="flex items-center justify-end gap-2 data-[x=center]:justify-center data-[x=left]:justify-start print:hidden"
		onfocusin={(e) => {
			if (e.relatedTarget instanceof HTMLElement && !inToasts(e.relatedTarget)) returnTo = e.relatedTarget;
		}}
		onfocusout={(e) => {
			if (!inToasts(e.relatedTarget as Element | null)) returnTo = null;
		}}
	>
		{#if hidden > 0}
			<Button
				bind:ref={more}
				variant="outline"
				size="xs"
				aria-expanded={listOpen}
				onclick={() => (listOpen ? closeList() : (listOpen = true))}
			>
				{moreLabel(hidden)}
			</Button>
		{/if}
		<Button bind:ref={closeAll} variant="outline" size="xs" onclick={endAll}>{closeAllLabel}</Button>
	</div>
{/if}

<style>
	/* A toast past visibleToasts is hidden, so the keyboard does not reach its buttons either. A toast
	   with the focus stays, because a hidden element loses the focus to the page: when the list closes by
	   itself, the toast that ends still counts for 200 ms and pushes the oldest past visibleToasts. */
	:global([data-sonner-toast][data-visible="false"]:not(:focus-within)) {
		visibility: hidden;
	}

	/* The bar sits where the stack sat, at the gap of svelte-sonner. The stack moves up by the bar and 8 px. */
	[data-slot="toaster-bar"] {
		position: fixed;
		z-index: 999999999;
		width: 356px;
	}
	[data-y="bottom"] {
		bottom: var(--bar-bottom);
	}
	[data-y="top"] {
		top: var(--bar-top);
	}
	[data-x="right"] {
		right: var(--bar-right);
	}
	[data-x="left"] {
		left: var(--bar-left);
	}
	[data-x="center"] {
		left: 50%;
		transform: translateX(-50%);
	}

	/*
	 * The list of every toast. The toasts leave the stack and stand in one column, the newest next to the
	 * bar, and the column scrolls when it is taller than the window. Its 12 px padding keeps the close
	 * button and the shadow of a toast inside the scroll box, so the box reaches 12 px past the toasts.
	 */
	:global([data-sonner-toaster][data-list-open]) {
		display: flex;
		flex-direction: column-reverse;
		gap: var(--gap);
		box-sizing: border-box;
		width: calc(var(--width) + 24px);
		max-height: calc(100dvh - var(--offset-top) - var(--offset-bottom) + 24px);
		padding: 12px;
		overflow-y: auto;
		overscroll-behavior: contain;
	}
	:global([data-sonner-toaster][data-list-open][data-y-position="top"]) {
		flex-direction: column;
		top: calc(var(--offset-top) - 12px);
	}
	:global([data-sonner-toaster][data-list-open][data-y-position="bottom"]) {
		bottom: calc(var(--offset-bottom) - 12px);
	}
	:global([data-sonner-toaster][data-list-open][data-x-position="right"]) {
		right: calc(var(--offset-right) - 12px);
	}
	:global([data-sonner-toaster][data-list-open][data-x-position="left"]) {
		left: calc(var(--offset-left) - 12px);
	}
	/* svelte-sonner gives each toast touch-action: none for its swipe, so a drag up or down would scroll
	   nothing. In the list it scrolls, and the swipe goes to the side only. */
	:global([data-sonner-toaster][data-list-open] [data-sonner-toast]) {
		position: relative;
		flex-shrink: 0;
		transform: none;
		touch-action: pan-y;
	}
	/* svelte-sonner bridges the gap between two open toasts for the pointer. The gaps of the list are in
	   the list, so it needs no bridge, and the bridge of the first toast would make the list scroll. */
	:global([data-sonner-toaster][data-list-open] [data-sonner-toast]::after) {
		content: none;
	}

	/* svelte-sonner takes mobileOffset and the width of the screen at 600 px and below. */
	@media (max-width: 600px) {
		[data-slot="toaster-bar"] {
			right: var(--bar-mobile-right);
			left: var(--bar-mobile-left);
			width: auto;
			transform: none;
		}
		[data-y="bottom"] {
			bottom: var(--bar-mobile-bottom);
		}
		[data-y="top"] {
			top: var(--bar-mobile-top);
		}
		:global([data-sonner-toaster][data-list-open][data-x-position]) {
			right: calc(var(--mobile-offset-right) - 12px);
			left: calc(var(--mobile-offset-left) - 12px);
			width: auto;
			max-height: calc(100dvh - var(--mobile-offset-top) - var(--mobile-offset-bottom) + 24px);
		}
		:global([data-sonner-toaster][data-list-open][data-y-position="top"]) {
			top: calc(var(--mobile-offset-top) - 12px);
		}
		:global([data-sonner-toaster][data-list-open][data-y-position="bottom"]) {
			bottom: calc(var(--mobile-offset-bottom) - 12px);
		}
		:global([data-sonner-toaster][data-list-open] [data-sonner-toast]) {
			width: 100%;
		}
	}
</style>
