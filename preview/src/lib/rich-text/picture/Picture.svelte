<!--
	A selected picture in the rich text field (### rich-text-field in DESIGN.md, "Anatomy"). A
	click on a picture selects it, and so does a selection that holds the picture alone, such as Shift and
	an arrow key over it. The picture takes no frame and no square handles. One grip, a pill of 6 px on the
	popover ground with the ring and the shadow of the bar, stands on the middle of its right edge, with a
	target of 26 by 40 px, and 46 by 48 px below 768 px. A drag of the grip changes the width, and one drag
	is one undo step and one change, at its end. The bar is a floating layer at level 3 above the picture,
	or under it where the window has no room above: the size in px, the widths 25, 50, 75 and 100 % of the
	line as a segmented toggle group, Original, and Remove as the last icon button. The bar stays inside
	the field, and it wraps where the field is narrower than the bar.

	The grip and the bar live in this overlay beside the text, never inside it, so they never enter the HTML
	of the content or its undo history. Tab from a selected picture reaches the bar, Esc hides the bar and
	gives the caret back to the text after the picture, and any other key hides the bar and reaches the
	text. A press on the overlay keeps the focus in the text. A click outside the picture, and a focus that
	leaves both the bar and the text, end the selection. The lock of the field (context.ts) ends it too.
	The part listens to the selection of the document only while the text has the focus, and to a scroll
	or a resize of the window only while a picture is selected. The field mounts it when a person first
	uses the field.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Engine } from '../engine/types.js';

	export type PictureProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		ref?: HTMLDivElement | null;
		class?: string | undefined;
		engine: Engine;
		/** The text that holds the pictures. */
		text: HTMLElement;
		/** The element around the text, with position: relative, where the overlay draws. */
		host: HTMLElement;
	};
</script>

<script lang="ts">
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { onMount, tick, untrack } from 'svelte';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';
	import { getField } from '../context.js';

	let { engine, text, host, class: className, ref = $bindable(null), ...rest }: PictureProps = $props();

	const field = getField();
	/** While the text is locked, no picture is selected. */
	const readonly = $derived(field.locked);
	const onselected = (selected: boolean) => field.selectPicture(selected);

	/** The least width of a picture in px. */
	const MIN_WIDTH = 32;
	const PARTS = [
		{ id: '25', part: 0.25, label: 'Small' },
		{ id: '50', part: 0.5, label: 'Medium' },
		{ id: '75', part: 0.75, label: 'Large' },
		{ id: '100', part: 1, label: 'Full width' }
	] as const;

	let img = $state<HTMLImageElement | null>(null);
	/** The picture in the host, the place of the bar (left) and the width of the host (room), in px. */
	let at = $state<{ x: number; y: number; w: number; h: number; above: boolean; left: number; room: number } | null>(null);
	let limit = $state(0);
	let bar = $state<HTMLDivElement | null>(null);
	/** Bumps at each change of a size, so the values below read the attributes again. */
	let version = $state(0);

	const size = $derived.by(() => {
		void version;
		if (!img) return { width: 0, height: 0, natural: 0 };
		const r = img.getBoundingClientRect();
		// During a drag the attributes keep the width of its start, and the picture shows the new width.
		const width = (!drag && Number(img.getAttribute('width'))) || Math.round(r.width);
		const height = (!drag && Number(img.getAttribute('height'))) || Math.round(r.height);
		return { width, height, natural: Math.min(img.naturalWidth || width, limit) };
	});
	const width = $derived(size.width);
	const height = $derived(size.height);
	const natural = $derived(size.natural);
	const partWidth = (part: number) => Math.max(MIN_WIDTH, Math.round(part * limit));
	const current = $derived(PARTS.find((p) => partWidth(p.part) === width)?.id ?? '');

	/** The width of the line, which a picture never passes. */
	function lineWidth(): number {
		const style = getComputedStyle(text);
		return Math.max(MIN_WIDTH, text.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
	}

	function place() {
		if (!img || !img.isConnected || !text.contains(img) || readonly) {
			if (img) onselected(false);
			img = null;
			at = null;
			return;
		}
		limit = lineWidth();
		const r = img.getBoundingClientRect();
		const box = host.getBoundingClientRect();
		const barHeight = bar?.offsetHeight ?? 40;
		const barWidth = bar?.offsetWidth ?? 0;
		const x = r.left - box.left;
		// The bar starts at the picture, and moves left where the field has no room for it.
		const left = Math.max(0, Math.min(x, box.width - barWidth));
		at = { x, y: r.top - box.top, w: r.width, h: r.height, above: r.top - barHeight - 8 >= 0, left, room: box.width };
		version++;
		// The first show has no bar to measure, so the bar places itself again once it shows.
		if (!bar) void tick().then(place);
	}

	function select(next: HTMLImageElement | null) {
		if (img !== next) onselected(next !== null);
		img = next;
		void tick().then(place);
	}

	function resize(w: number) {
		if (!img) return;
		engine.setPictureWidth(img, Math.min(limit, Math.max(MIN_WIDTH, w)));
		place();
	}

	/** A preset width, Original or Remove: each is one undo step. */
	function setWidth(w: number) {
		engine.saveUndo();
		resize(w);
	}

	function remove() {
		const target = img;
		select(null);
		if (target) engine.removePicture(target);
		engine.focus();
	}

	// The drag of the grip. The picture follows the pointer through an animation, which changes no attribute
	// of the content, so the text hears one change when the drag ends, and one drag is one undo step.
	let drag: { x: number; w: number; width: number; motion: Animation } | null = null;
	const frames = (w: number) => [{ width: `${w}px` }, { width: `${w}px` }];
	function gripDown(e: PointerEvent) {
		if (!img || !at) return;
		e.preventDefault();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		const motion = img.animate(frames(at.w), { duration: 1, fill: 'both' });
		motion.pause();
		drag = { x: e.clientX, w: at.w, width: at.w, motion };
	}
	function gripMove(e: PointerEvent) {
		if (!drag) return;
		drag.width = Math.min(limit, Math.max(MIN_WIDTH, drag.w + e.clientX - drag.x));
		(drag.motion.effect as KeyframeEffect).setKeyframes(frames(drag.width));
		place();
	}
	function gripUp() {
		if (!drag) return;
		const { w, width, motion } = drag;
		drag = null;
		motion.cancel();
		if (Math.round(width) !== Math.round(w)) setWidth(width);
		else place();
	}

	/** The picture that the selection in the text holds alone, such as after Shift and an arrow key over it. */
	function pictureOfSelection(): HTMLImageElement | null {
		const s = document.getSelection();
		if (!s?.rangeCount || s.isCollapsed) return null;
		const range = s.getRangeAt(0);
		if (!text.contains(range.commonAncestorContainer) || range.toString().replace(/[\s\u200B]/g, '') !== '') return null;
		const inside = [...text.querySelectorAll('img')].filter((i) => range.intersectsNode(i));
		return inside.length === 1 ? (inside[0] ?? null) : null;
	}

	onMount(() => {
		const onclick = (e: MouseEvent) => {
			const target = e.target;
			select(target instanceof HTMLImageElement && text.contains(target) && !readonly ? target : null);
		};
		// The key path to a picture: a selection that holds the picture alone selects it, and Tab then reaches the bar.
		const onselection = () => {
			if (readonly || document.activeElement !== text) return;
			const next = pictureOfSelection();
			if (next && next !== img) select(next);
		};
		const keys = engine.onKey((e) => {
			if (!img) return false;
			if (e.key === 'Tab' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
				// Tab reaches the bar, at the control that holds the tab stop of its group.
				const first = bar?.querySelector<HTMLElement>('[data-state="on"], button');
				first?.focus();
				return true;
			}
			if (e.key === 'Escape') {
				const range = document.createRange();
				range.setStartAfter(img);
				select(null);
				const selection = document.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);
				return true;
			}
			if (!['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) select(null);
			return false;
		});
		const change = engine.on('change', place);
		const out = (e: FocusEvent) => {
			document.removeEventListener('selectionchange', onselection);
			const next = e.relatedTarget;
			if (next instanceof Node && (text.contains(next) || ref?.contains(next))) return;
			select(null);
		};
		const into = () => document.addEventListener('selectionchange', onselection);
		if (document.activeElement === text) into();
		text.addEventListener('click', onclick);
		text.addEventListener('focusout', out);
		text.addEventListener('focusin', into);
		return () => {
			keys();
			change();
			text.removeEventListener('click', onclick);
			text.removeEventListener('focusout', out);
			text.removeEventListener('focusin', into);
			document.removeEventListener('selectionchange', onselection);
		};
	});

	/** True while a picture is selected; the bar over selected text hides then (selectPicture of the field). */
	const selected = $derived(img !== null);
	$effect(() => {
		if (!selected) return;
		addEventListener('scroll', place, true);
		addEventListener('resize', place);
		return () => {
			removeEventListener('scroll', place, true);
			removeEventListener('resize', place);
		};
	});

	$effect(() => {
		if (readonly) untrack(() => select(null));
	});

	/** Esc in the bar gives the caret back to the text, after the picture. */
	function barKey(e: KeyboardEvent) {
		if (e.key !== 'Escape' || !img) return;
		e.preventDefault();
		e.stopPropagation();
		const target = img;
		select(null);
		engine.focus();
		const range = document.createRange();
		range.setStartAfter(target);
		const selection = document.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	}

	const tip = (p: (typeof PARTS)[number]) => `${p.label}: ${partWidth(p.part)} px, ${Math.round(p.part * 100)}% of the line`;
</script>

<!-- A press in the overlay keeps the focus and the caret in the text. -->
<div
	bind:this={ref}
	data-slot="rich-text-picture"
	class={cn('pointer-events-none absolute top-0 left-0 z-10 size-0', className)}
	hidden={at === null}
	onfocusout={(e) => {
		const next = e.relatedTarget;
		if (!(next instanceof Node && (text.contains(next) || ref?.contains(next)))) select(null);
	}}
	{...rest}
>
	{#if at}
		<div
			data-slot="rich-text-picture-grip"
			role="presentation"
			class="pointer-events-auto absolute w-1.5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none rounded-full bg-popover shadow-md ring-1 ring-foreground/10 after:absolute after:-inset-x-2.5 after:-inset-y-1 max-md:after:-inset-x-5 max-md:after:-inset-y-2"
			style:left="{at.x + at.w}px"
			style:top="{at.y + at.h / 2}px"
			style:height="{Math.min(32, Math.max(12, at.h / 3))}px"
			onpointerdown={gripDown}
			onpointermove={gripMove}
			onpointerup={gripUp}
			onpointercancel={gripUp}
		></div>
		<Tooltip.Provider>
			<div
				bind:this={bar}
				data-slot="rich-text-picture-bar"
				role="toolbar"
				tabindex="-1"
				aria-label="Picture"
				class="pointer-events-auto absolute flex w-max flex-wrap items-center gap-1 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
				style:left="{at.left}px"
				style:max-width="{at.room}px"
				style:top={at.above ? `${at.y - 8}px` : `${at.y + at.h + 8}px`}
				style:transform={at.above ? 'translateY(-100%)' : undefined}
				onmousedown={(e) => {
					if (!(e.target instanceof HTMLElement && e.target.closest('button'))) e.preventDefault();
				}}
				onkeydown={barKey}
			>
				<span class="px-1.5 text-xs whitespace-nowrap text-muted-foreground tabular-nums">{width} × {height} px</span>
				<Separator orientation="vertical" class="h-5 self-center" />
				<ToggleGroup.Root
					type="single"
					size="sm"
					variant="outline"
					aria-label="Width"
					bind:value={() => current, (v: string) => {
						const p = PARTS.find((x) => x.id === v);
						if (p) setWidth(partWidth(p.part));
					}}
				>
					{#each PARTS as p (p.id)}
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<ToggleGroup.Item {...props} value={p.id} aria-label={tip(p)} class="tabular-nums max-md:min-w-11">{p.id}%</ToggleGroup.Item>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>{tip(p)}</Tooltip.Content>
						</Tooltip.Root>
					{/each}
				</ToggleGroup.Root>
				<Tooltip.Root>
					<Tooltip.Trigger
						type="button"
						class={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'aria-disabled:cursor-not-allowed aria-disabled:opacity-50')}
						aria-disabled={natural === width ? 'true' : undefined}
						onclick={() => natural !== width && setWidth(natural)}
					>
						Original
					</Tooltip.Trigger>
					<Tooltip.Content>{natural === width ? 'The picture has its original size.' : `Original: ${natural} px`}</Tooltip.Content>
				</Tooltip.Root>
				<Tooltip.Root>
					<Tooltip.Trigger type="button" class={buttonVariants({ variant: 'ghost', size: 'icon-sm' })} aria-label="Remove the picture" onclick={remove}>
						<Trash2Icon />
					</Tooltip.Trigger>
					<Tooltip.Content>Remove the picture</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	{/if}
</div>
