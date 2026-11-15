<!--
	More below 768 px in the toolbar of the rich text field (### rich-text-field in DESIGN.md): a drawer with
	the groups that folded, as ### dropdown-menu says for a menu on a phone, each tool a ghost button row.
	Tools.svelte renders the trigger face and loads this part in a chunk of its own (parts.ts) only when
	groups fold below 768 px.

	- The trigger keeps the one tab stop of the bar and data-tool="more", and takes aria-disabled while the
	  text is locked or loads.
	- A tool that cannot act is a ReasonButton, with its reason in a line under it. A pick closes the
	  drawer, then runs the tool, and the focus goes back to the text, unless a form opened.
-->
<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { Group } from '../tools/presets.js';
	import type { MenuTools } from './Menu.svelte';

	export type MoreDrawerProps = {
		/** The groups that folded into More. */
		groups: readonly Group[];
		open?: boolean;
		tabindex: number;
		/** True while the text is locked or loads: the trigger takes aria-disabled. */
		off: boolean;
		triggerClass: string;
		tools: MenuTools;
		/** The face of the trigger. */
		children: Snippet;
	};
</script>

<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import * as Drawer from '#lib/components/ui/drawer/index.js';
	import ReasonButton from '#lib/stack/ReasonButton.svelte';
	import { reasonOf } from '../reason.js';
	import { tool, type ToolId } from '../tools/commands.js';
	import { TOOL_ICONS } from './icons.js';

	let { groups, open = $bindable(false), tabindex, off, triggerClass, tools, children }: MoreDrawerProps = $props();

	const uid = $props.id();

	/** A pick closes the drawer, then runs the tool. */
	function pick(g: Group, id: ToolId) {
		open = false;
		tools.pick(g, id, 'more');
	}
</script>

<Drawer.Root autoFocus bind:open>
	<Drawer.Trigger data-tool="more" {tabindex} class={triggerClass} aria-label="More tools" aria-disabled={off ? 'true' : undefined}>
		{@render children()}
	</Drawer.Trigger>
	<Drawer.Content onCloseAutoFocus={tools.closeFocus}>
		<Drawer.Header>
			<Drawer.Title>More tools</Drawer.Title>
		</Drawer.Header>
		<div class="flex flex-col gap-3 overflow-y-auto px-4">
			{#each groups as g (g.id)}
				<div role="group" aria-labelledby="{uid}-drawer-{g.id}" class="flex flex-col">
					<p id="{uid}-drawer-{g.id}" class="px-2.5 pb-1 text-xs font-medium text-muted-foreground">{g.label}</p>
					{#each g.tools as id (id)}
						{@const t = tool(id)}
						{@const Icon = TOOL_ICONS[id]}
						{@const why = tools.why(id)}
						{@const pressed = t.kind === 'toggle' || t.kind === 'choice' ? tools.on(id) : undefined}
						<ReasonButton variant="ghost" class="w-full justify-start" {...reasonOf(why)} disabled={tools.off(id) && !why} aria-pressed={pressed} onclick={() => pick(g, id)}>
							<Icon aria-hidden="true" />
							<span class="flex-1 text-start">{t.label}{t.kind === 'form' || t.kind === 'color' || t.kind === 'file' ? '…' : ''}</span>
							{#if pressed}<CheckIcon aria-hidden="true" />{/if}
						</ReasonButton>
					{/each}
				</div>
			{/each}
		</div>
		<Drawer.Footer>
			<Drawer.Close class={buttonVariants({ variant: 'outline' })}>Close</Drawer.Close>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
