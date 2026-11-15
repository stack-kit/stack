<!--
	The groups of tools of the rich text field (### rich-text-field in DESIGN.md), inside the toolbar frame
	(Toolbar.svelte). The groups come in the order of tools/presets.ts, each a role="group" with a name and
	a vertical separator between two groups. A tool is a toggle, an icon button or a dropdown-menu trigger,
	with a tooltip that gives its name and its key. It reads the field through the context (context.ts),
	and each tool runs through exec() of the field. The field loads this part in the chunk of the toolbar
	(index.ts).

	- One tab stop: the arrow keys, Home and End move in the bar, in the direction of the text, the key of
	  the command toolbar in the text, Alt+F10 by default, comes here (focusBar), and Esc goes back to the
	  text. These keys inside the bar are fixed. A tooltip and aria-keyshortcuts give the keys of each tool
	  that are on (keysOf of the field). A press on a button keeps the focus and
	  the selection in the text.
	- A tool with nothing to act on takes aria-disabled, never disabled, so the input group does not dim and
	  the tool stays in the arrow order. In a menu, a tool with a reason is a ReasonMenuItem. While the text
	  is read-only or loads, each tool is unavailable.
	- When the bar is too narrow, whole groups move into More, the lowest fold first. Below 768 px More
	  opens a drawer. A change of the width of the controls of the page folds the groups again, because the
	  box of the groups takes the rest of the bar.
	- The tools share one tooltip, which mounts with its provider when a person first uses the field. A
	  menu mounts its items only while it is open, and the forms mount when one first opens (Forms.svelte).
	- The menus (Menu.svelte), the drawer of More (MoreDrawer.svelte) and the forms load in chunks of their
	  own when the bar first needs them (parts.ts), so the simple preset loads none of them at its mount.
	  Until a part loads, a button of the same size and face holds its place, with aria-disabled. The field
	  loads the menus with the bar for the full preset, whose menus show at the mount.
-->
<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import { onMount, type Snippet } from 'svelte';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Kbd from '#lib/components/ui/kbd/index.js';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import { toggleVariants } from '#lib/components/ui/toggle/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';
	import { bands } from '#lib/stack/behaviour/width.js';
	import { getField, isForm } from '../context.js';
	import { tool, type ToolId } from '../tools/commands.js';
	import { ariaKey, keyParts } from '../tools/keys.js';
	import { groupsOf, type Group } from '../tools/presets.js';
	import { GROUP_ICONS, TOOL_ICONS } from './icons.js';
	import type { MenuTools } from './Menu.svelte';
	import { drawer, forms, menu } from './parts.js';

	const field = getField();
	const groups = $derived(groupsOf(new Set(field.tools)));
	const editorState = $derived(field.state);
	/** One tooltip for every tool of the bar: each trigger gives the id of its tool. */
	const tips = TooltipPrimitive.createTether<ToolId>();

	// ---- The fold. A separator and its two gaps take 13 px, and More with its gap 36 px (the classes below).
	// The box of the groups has 4 px of padding, so that it does not clip the focus ring of a tool.
	const SEPARATOR = 13;
	const MORE = 36;
	let box = $state<HTMLDivElement | null>(null);
	let folded = $state<ReadonlySet<string>>(new Set());
	const widths = new Map<string, number>();
	const shown = $derived(groups.filter((g) => !folded.has(g.id)));
	const hidden = $derived(groups.filter((g) => folded.has(g.id)));

	function fit() {
		if (!box) return;
		for (const el of box.querySelectorAll<HTMLElement>('[data-group]')) widths.set(el.dataset.group ?? '', el.getBoundingClientRect().width);
		const style = getComputedStyle(box);
		const available = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
		const next = new Set<string>();
		const need = () => {
			const rest = groups.filter((g) => !next.has(g.id));
			return rest.reduce((sum, g) => sum + (widths.get(g.id) ?? 0), 0) + Math.max(0, rest.length - 1) * SEPARATOR + (next.size > 0 ? MORE : 0);
		};
		for (const g of [...groups].sort((a, b) => a.fold - b.fold)) {
			if (need() <= available) break;
			next.add(g.id);
		}
		if ([...next].join() !== [...folded].join()) folded = next;
	}

	onMount(() => {
		fit();
		// The box takes the rest of the bar, so a change of the width of the bar or of the controls of the page changes its width.
		const observer = new ResizeObserver(() => fit());
		if (box) observer.observe(box);
		// The keys of the arrow order. The box is no control, so the handler is set here and not as an attribute.
		box?.addEventListener('keydown', onkeydown);
		return () => {
			observer.disconnect();
			box?.removeEventListener('keydown', onkeydown);
		};
	});

	// ---- One tab stop: the control with tabindex 0, by its data-tool.
	let active = $state<string | null>(null);
	/** The key of each control in the bar, in its order: a tool of a group of buttons, a menu, or More. */
	const keys = $derived([...shown.flatMap((g) => (g.kind === 'buttons' ? [...g.tools] : [g.id])), ...(hidden.length > 0 ? ['more'] : [])]);
	// The control that held the tab stop can fold into More, and then the first control takes it.
	const current = $derived(active !== null && keys.includes(active) ? active : (keys[0] ?? null));
	const stop = (key: string) => (current === key ? 0 : -1);

	function items(): HTMLElement[] {
		return box ? [...box.querySelectorAll<HTMLElement>('[data-tool]')] : [];
	}

	/** Moves the focus to the toolbar, at the control that holds its tab stop (Alt+F10 in the text). */
	export function focusBar() {
		const all = items();
		(all.find((el) => el.tabIndex === 0) ?? all[0])?.focus();
	}

	function onkeydown(e: KeyboardEvent) {
		if (!(e.target instanceof HTMLElement) || !box?.contains(e.target)) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			field.back();
			return;
		}
		const all = items();
		const i = all.indexOf(e.target);
		if (i < 0) return;
		// The arrows follow the direction of the text: in a right-to-left text, Left moves to the next tool.
		const step = getComputedStyle(box).direction === 'rtl' ? -1 : 1;
		const to = { ArrowRight: i + step, ArrowLeft: i - step, Home: 0, End: all.length - 1 }[e.key];
		if (to === undefined) return;
		e.preventDefault();
		const next = all[(to + all.length) % all.length];
		next?.focus();
	}

	function onfocusin(e: FocusEvent) {
		const key = e.target instanceof HTMLElement ? e.target.closest<HTMLElement>('[data-tool]')?.dataset.tool : undefined;
		if (key) active = key;
	}

	// ---- The tools.
	/** The keys of the tool for aria-keyshortcuts, or undefined when its key is off. */
	const aria = (id: ToolId) => field.keysOf(id).map(ariaKey).join(' ') || undefined;
	const on = (id: ToolId) => !!editorState && (tool(id).on?.(editorState) ?? false);
	const off = (id: ToolId) => !editorState || !(tool(id).enabled?.(editorState) ?? true);

	function press(id: ToolId, anchor: HTMLElement | null) {
		if (off(id)) return;
		field.exec(id, anchor);
	}

	const triggerClass = (extra: string) =>
		cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-8 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 max-md:h-11', extra);
	const toolClass = cn(toggleVariants(), 'size-8 min-w-8 px-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 max-md:size-11');

	let openMenu = $state<string | null>(null);
	/** A menu opens only while the tools are available. */
	const menuOpen = (id: string) => ({
		get: () => openMenu === id,
		set: (v: boolean) => {
			openMenu = v && editorState ? id : openMenu === id ? null : openMenu;
		}
	});

	/** The control that a form of a menu opens at: the trigger of the menu, or More. */
	function anchorOf(g: Group, from: 'more' | null): HTMLElement | null {
		return box?.querySelector<HTMLElement>(`[data-tool="${from ?? g.id}"]`) ?? null;
	}

	function choiceOf(g: Group): ToolId | null {
		return g.tools.find((id) => on(id)) ?? null;
	}

	/**
	 * After a pick in a menu or the drawer, the focus goes back to the text, unless a form or another menu
	 * opened. Bits UI also calls this while a layer opens, and then the form or the menu is open.
	 */
	function closeFocus(e: Event) {
		e.preventDefault();
		if (field.form === null && openMenu === null) field.back();
	}

	/** What a menu and the drawer read for each tool. */
	const menuTools: MenuTools = {
		on,
		off,
		why: (id) => (editorState && off(id) ? tool(id).reason : undefined),
		pick: (g, id, from) => press(id, anchorOf(g, from)),
		closeFocus
	};

	// ---- The parts that load when the bar first needs them.
	let MenuPart = $state.raw(menu.now);
	let DrawerPart = $state.raw(drawer.now);
	let FormsPart = $state.raw(forms.now);
	$effect(() => {
		if (!MenuPart && (shown.some((g) => g.kind === 'menu') || (hidden.length > 0 && bands.md.current))) menu.load().then((m) => (MenuPart = m), field.loadFailed);
	});
	$effect(() => {
		if (!DrawerPart && hidden.length > 0 && !bands.md.current) drawer.load().then((m) => (DrawerPart = m), field.loadFailed);
	});
	/** The forms mount when one first opens, and stay, so that the popover can close with its animation. */
	let formsOn = $state(false);
	$effect(() => {
		if (field.form === null) return;
		formsOn = true;
		if (!FormsPart) forms.load().then((m) => (FormsPart = m), field.loadFailed);
	});
</script>

<div bind:this={box} class="-m-1 flex min-w-0 flex-1 items-center gap-1 overflow-hidden p-1" {onfocusin}>
	{#each shown as g, i (g.id)}
		{#if i > 0}<Separator orientation="vertical" class="mx-0.5 h-5 self-center" />{/if}
		<div role="group" aria-label={g.label} data-group={g.id} class="flex shrink-0 items-center gap-0.5">
			{#if g.kind === 'buttons'}
				{#each g.tools as id (id)}
					{@const t = tool(id)}
					{@const Icon = TOOL_ICONS[id]}
					<Tooltip.Trigger
						tether={tips}
						payload={id}
						type="button"
						data-tool={id}
						tabindex={stop(id)}
						class={toolClass}
						aria-label={t.label}
						aria-pressed={t.kind === 'toggle' ? on(id) : undefined}
						aria-haspopup={isForm(id) ? 'dialog' : undefined}
						aria-expanded={isForm(id) ? field.form === id : undefined}
						aria-disabled={off(id) ? 'true' : undefined}
						aria-keyshortcuts={aria(id)}
						onmousedown={(e: MouseEvent) => e.preventDefault()}
						onclick={(e: MouseEvent) => press(id, e.currentTarget as HTMLElement)}
					>
						<Icon />
					</Tooltip.Trigger>
				{/each}
			{:else}
				{@const choice = choiceOf(g)}
				{@const ChoiceIcon = choice && g.id !== 'block' ? TOOL_ICONS[choice] : GROUP_ICONS[g.id]}
				{@const open = menuOpen(g.id)}
				{@const label = choice ? `${g.label}: ${tool(choice).label}` : g.label}
				{@const face = triggerClass(g.id === 'block' ? 'w-32 justify-between' : 'gap-0.5 px-1.5')}
				{#snippet groupFace()}
					{#if g.id === 'block'}
						<span class="truncate">{choice ? tool(choice).label : 'Normal'}</span>
					{:else if ChoiceIcon}
						<ChoiceIcon aria-hidden="true" />
					{/if}
					<ChevronDownIcon class="size-3.5 text-muted-foreground" aria-hidden="true" />
				{/snippet}
				{#if MenuPart}
					<MenuPart id={g.id} groups={[g]} from={null} bind:open={open.get, open.set} {label} tabindex={stop(g.id)} off={!editorState} triggerClass={face} contentClass="w-56" align="start" tools={menuTools}>
						{@render groupFace()}
					</MenuPart>
				{:else}
					{@render waiting(g.id, label, face, groupFace)}
				{/if}
			{/if}
		</div>
	{/each}
	{#if hidden.length > 0}
		{@const open = menuOpen('more')}
		{@const face = triggerClass('w-8 px-0 max-md:w-11')}
		{#snippet moreFace()}<EllipsisIcon aria-hidden="true" />{/snippet}
		{#if bands.md.current && MenuPart}
			<MenuPart id="more" groups={hidden} from="more" bind:open={open.get, open.set} label="More tools" tabindex={stop('more')} off={!editorState} triggerClass={face} contentClass="w-60" align="end" tools={menuTools}>
				{@render moreFace()}
			</MenuPart>
		{:else if !bands.md.current && DrawerPart}
			<!-- Below 768 px a menu opens as a drawer (### dropdown-menu), with the tools as ghost button rows. -->
			<DrawerPart groups={hidden} bind:open={open.get, open.set} tabindex={stop('more')} off={!editorState} triggerClass={face} tools={menuTools}>
				{@render moreFace()}
			</DrawerPart>
		{:else}
			{@render waiting('more', 'More tools', face, moreFace)}
		{/if}
	{/if}
</div>

{#if field.armed}
	<Tooltip.Provider>
		<Tooltip.Root tether={tips}>
			{#snippet children({ payload })}
				{#if payload}
					{@const t = tool(payload)}
					{@const why = editorState && off(payload) ? t.reason : undefined}
					{@const key = field.keysOf(payload)[0]}
					<Tooltip.Content>
						{why ?? t.label}
						{#if key && !why}
							<Kbd.Group>{#each keyParts(key) as part (part)}<Kbd.Root>{part}</Kbd.Root>{/each}</Kbd.Group>
						{/if}
					</Tooltip.Content>
				{/if}
			{/snippet}
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}
{#if formsOn && FormsPart}<FormsPart menuOpen={openMenu !== null} />{/if}

<!-- The place of a menu or of More while its part loads: a button of the same size and face, which cannot act yet. -->
{#snippet waiting(id: string, label: string, face: string, children: Snippet)}
	<button type="button" data-tool={id} tabindex={stop(id)} class={face} aria-label={label} aria-disabled="true">{@render children()}</button>
{/snippet}
