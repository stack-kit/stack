<!--
	A menu of the toolbar of the rich text field (### rich-text-field in DESIGN.md): the trigger of a group
	whose kind is menu, such as Text style, or More with the groups that folded, each under its heading.
	Tools.svelte renders the trigger face and loads this part in a chunk of its own (parts.ts) when the bar
	first shows a menu, so the simple preset loads no menu until its groups fold into More.

	- The trigger keeps the one tab stop of the bar (tabindex) and data-tool, so the arrow order of the bar
	  finds it. It takes aria-disabled while the text is locked or loads, never disabled.
	- A tool that cannot act is a ReasonMenuItem: it stays in the arrow order, and its second line gives the
	  reason. A tool with no reason to give, such as Undo with no step, is disabled.
	- When the menu closes, onCloseAutoFocus of the bar gives the focus back to the text, unless a form or
	  another menu opened.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { ToolId } from '../tools/commands.js';
	import type { Group } from '../tools/presets.js';

	/** What a menu and the drawer of More read from the toolbar for each tool. */
	export type MenuTools = {
		on: (id: ToolId) => boolean;
		off: (id: ToolId) => boolean;
		/** Why the tool cannot act, or undefined while it can or has no reason to give. */
		why: (id: ToolId) => string | undefined;
		/** Runs a tool of the group `g`. `from` is more for a tool in More, so that a form opens at More. */
		pick: (g: Group, id: ToolId, from: 'more' | null) => void;
		/** The close of a layer: the focus goes back to the text, unless a form or another menu opened. */
		closeFocus: (e: Event) => void;
	};

	export type MenuProps = {
		/** The data-tool of the trigger: the id of the group, or more. */
		id: string;
		/** The groups of the menu. More gives each group a heading. */
		groups: readonly Group[];
		from: 'more' | null;
		open?: boolean;
		label: string;
		tabindex: number;
		/** True while the text is locked or loads: the trigger takes aria-disabled. */
		off: boolean;
		triggerClass: string;
		contentClass: string;
		align: 'start' | 'end';
		tools: MenuTools;
		/** The face of the trigger. */
		children: Snippet;
	};
</script>

<script lang="ts">
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import ReasonMenuItem from '#lib/stack/ReasonMenuItem.svelte';
	import { getField } from '../context.js';
	import { tool } from '../tools/commands.js';
	import { keyLabel } from '../tools/keys.js';
	import { TOOL_ICONS } from './icons.js';

	let { id, groups, from, open = $bindable(false), label, tabindex, off, triggerClass, contentClass, align, tools, children }: MenuProps = $props();
	/** The field gives the keys of each tool that are on; an item shows the first one. */
	const field = getField();
</script>

<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger data-tool={id} {tabindex} class={triggerClass} aria-label={label} aria-disabled={off ? 'true' : undefined}>
		{@render children()}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content {align} class={contentClass} onCloseAutoFocus={tools.closeFocus}>
		{#if from === 'more'}
			{#each groups as g, i (g.id)}
				{#if i > 0}<DropdownMenu.Separator />{/if}
				<DropdownMenu.Group>
					<DropdownMenu.GroupHeading>{g.label}</DropdownMenu.GroupHeading>
					{@render items(g)}
				</DropdownMenu.Group>
			{/each}
		{:else}
			{#each groups as g (g.id)}{@render items(g)}{/each}
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>

{#snippet items(g: Group)}
	{#each g.tools as id (id)}
		{@const t = tool(id)}
		{@const why = tools.why(id)}
		{#if why}
			<!-- A tool that cannot act gives its reason and stays in the arrow order ("Disabled with a reason" in ### dropdown-menu). pl-7 keeps its label in line with the labels after an icon. -->
			<ReasonMenuItem class="pl-7" label={t.label} reason={why} onSelect={() => tools.pick(g, id, from)} />
		{:else if t.kind === 'toggle' || t.kind === 'choice'}
			<DropdownMenu.CheckboxItem closeOnSelect disabled={tools.off(id)} bind:checked={() => tools.on(id), () => tools.pick(g, id, from)}>
				{@render itemBody(id)}
			</DropdownMenu.CheckboxItem>
		{:else}
			<DropdownMenu.Item disabled={tools.off(id)} onSelect={() => tools.pick(g, id, from)}>
				{@render itemBody(id)}
			</DropdownMenu.Item>
		{/if}
	{/each}
{/snippet}

{#snippet itemBody(id: ToolId)}
	{@const t = tool(id)}
	{@const Icon = TOOL_ICONS[id]}
	{@const key = field.keysOf(id)[0]}
	<Icon aria-hidden="true" />
	<span>{t.label}{t.kind === 'form' || t.kind === 'color' || t.kind === 'file' ? '…' : ''}</span>
	{#if key}<DropdownMenu.Shortcut>{keyLabel(key)}</DropdownMenu.Shortcut>{/if}
{/snippet}
