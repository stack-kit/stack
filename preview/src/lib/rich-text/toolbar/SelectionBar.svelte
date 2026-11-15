<!--
	The bar over selected text of the rich text field (### rich-text-field in DESIGN.md): a floating layer
	at level 3 of ## Elevation & Depth, the popover ground with ring-1 ring-foreground/10 and shadow-md, with
	the format tools of the field. It stands above the selection, or under it where the window has no room
	above. It shows while the text has the focus and a selection that is not a caret. It hides on Esc until
	the selection changes, during a drag in the text, while the field hides it (a selected picture or a
	read-only text), and below 768 px, where the toolbar is the one bar.

	The toolbar holds the same tools, so the bar stays out of the Tab order. A press on it keeps the focus and
	the selection in the text. Each tool runs through exec() of the field (context.ts). Link and the two
	colors open their form at the button of the bar, and the bar keeps its place while the focus is outside
	the text, so that the form keeps its anchor. The tools share one tooltip. The field mounts the bar when
	a person first uses the field.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type SelectionBarProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		ref?: HTMLDivElement | null;
		class?: string | undefined;
		/** The text whose selection the bar follows. */
		text: HTMLElement;
		/** The element around the text, with position: relative, where the bar draws. */
		host: HTMLElement;
	};
</script>

<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import { onMount, untrack } from 'svelte';
	import { toggleVariants } from '#lib/components/ui/toggle/index.js';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';
	import { bands } from '#lib/stack/behaviour/width.js';
	import { getField, isForm } from '../context.js';
	import { tool, type ToolId } from '../tools/commands.js';
	import { ariaKey } from '../tools/keys.js';
	import { SELECTION_GROUPS } from '../tools/presets.js';
	import { TOOL_ICONS } from './icons.js';

	let { text, host, class: className, ref = $bindable(null), ...rest }: SelectionBarProps = $props();

	const field = getField();
	const editorState = $derived(field.state);
	/** The bar hides while the text is locked and while a picture is selected. */
	const hide = $derived(field.locked || field.pictureSelected);
	const groups = $derived(SELECTION_GROUPS.map((g) => ({ ...g, tools: g.tools.filter((id) => field.tools.includes(id)) })).filter((g) => g.tools.length > 0));
	const tips = TooltipPrimitive.createTether<ToolId>();

	let at = $state<{ x: number; y: number } | null>(null);
	let dragging = false;
	/** The selection that Esc hid the bar for; the bar shows again when the selection changes. */
	let dismissed: string | null = null;
	/** The tool whose form the bar opened. The form stands at its button, so the bar stays until the focus comes back to the text. */
	let opened = $state<ToolId | null>(null);

	function selectionKey(): string | null {
		const s = document.getSelection();
		if (!s?.rangeCount || s.isCollapsed) return null;
		const r = s.getRangeAt(0);
		if (!text.contains(r.commonAncestorContainer)) return null;
		return `${r.startOffset}:${r.endOffset}:${r.toString().length}`;
	}

	function place() {
		if (document.activeElement === text) opened = null;
		else if (opened !== null) return;
		const key = selectionKey();
		if (key !== dismissed) dismissed = null;
		const focused = document.activeElement === text;
		if (!key || !focused || dragging || dismissed !== null || hide || !bands.md.current || groups.length === 0) {
			at = null;
			return;
		}
		const rect = document.getSelection()?.getRangeAt(0).getBoundingClientRect();
		if (!rect) return void (at = null);
		const box = host.getBoundingClientRect();
		const width = ref?.offsetWidth ?? 0;
		const height = ref?.offsetHeight ?? 36;
		const above = rect.top - height - 8 >= 0;
		const x = Math.min(Math.max(0, rect.left - box.left + rect.width / 2 - width / 2), Math.max(0, box.width - width));
		const y = above ? rect.top - box.top - height - 8 : rect.bottom - box.top + 8;
		at = { x, y };
		// The first show measures a hidden bar as 0 px wide, so the bar places itself again once it shows.
		if (width === 0) requestAnimationFrame(place);
	}

	/** Esc hides the bar until the selection changes; true when it showed. */
	export function dismiss(): boolean {
		if (at === null) return false;
		dismissed = selectionKey();
		at = null;
		return true;
	}

	// The bar listens to the document and the window only while it needs them: the selection while the text
	// has the focus, the end of a drag from its start, and a scroll or a resize while the bar shows.
	onMount(() => {
		const up = () => {
			if (!dragging) return;
			dragging = false;
			requestAnimationFrame(place);
		};
		const down = () => {
			dragging = true;
			at = null;
			addEventListener('pointerup', up, { once: true });
		};
		const focusIn = () => {
			document.addEventListener('selectionchange', place);
			place();
		};
		const focusOut = () => {
			document.removeEventListener('selectionchange', place);
			place();
		};
		if (document.activeElement === text) document.addEventListener('selectionchange', place);
		text.addEventListener('pointerdown', down);
		text.addEventListener('focusout', focusOut);
		text.addEventListener('focusin', focusIn);
		return () => {
			document.removeEventListener('selectionchange', place);
			text.removeEventListener('pointerdown', down);
			removeEventListener('pointerup', up);
			text.removeEventListener('focusout', focusOut);
			text.removeEventListener('focusin', focusIn);
		};
	});

	const showing = $derived(at !== null);
	$effect(() => {
		if (!showing) return;
		addEventListener('scroll', place, true);
		addEventListener('resize', place);
		return () => {
			removeEventListener('scroll', place, true);
			removeEventListener('resize', place);
		};
	});

	// The state changes after each tool, and the hide flag with the picture.
	$effect(() => {
		void editorState;
		void hide;
		untrack(place);
	});
</script>

<!-- A press on the bar keeps the focus and the selection in the text. -->
<div
	bind:this={ref}
	data-slot="rich-text-selection-bar"
	role="toolbar"
	aria-label="Format the selected text"
	hidden={at === null}
	class={cn('absolute z-20 flex items-center gap-1 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10', className)}
	style:left="{at?.x ?? 0}px"
	style:top="{at?.y ?? 0}px"
	onmousedown={(e) => e.preventDefault()}
	{...rest}
>
	{#each groups as g, i (g.id)}
		{#if i > 0}<Separator orientation="vertical" class="h-5 self-center" />{/if}
		<div role="group" aria-label={g.label} class="flex items-center gap-0.5">
			{#each g.tools as id (id)}
				{@const t = tool(id)}
				{@const Icon = TOOL_ICONS[id]}
				{@const on = !!editorState && (t.on?.(editorState) ?? false)}
				<Tooltip.Trigger
					tether={tips}
					payload={id}
					type="button"
					tabindex={-1}
					class={cn(toggleVariants(), 'size-8 min-w-8 px-0')}
					aria-label={t.label}
					aria-pressed={t.kind === 'toggle' ? on : undefined}
					aria-haspopup={isForm(id) ? 'dialog' : undefined}
					aria-expanded={isForm(id) ? opened === id : undefined}
					aria-keyshortcuts={field.keysOf(id).map(ariaKey).join(' ') || undefined}
					onclick={(e: MouseEvent) => {
						if (isForm(id)) opened = id;
						field.exec(id, e.currentTarget as HTMLElement);
					}}
				>
					<Icon />
				</Tooltip.Trigger>
			{/each}
		</div>
	{/each}
	{#if showing}
		<Tooltip.Provider>
			<Tooltip.Root tether={tips}>
				{#snippet children({ payload })}
					{#if payload}<Tooltip.Content>{tool(payload).label}</Tooltip.Content>{/if}
				{/snippet}
			</Tooltip.Root>
		</Tooltip.Provider>
	{/if}
</div>
