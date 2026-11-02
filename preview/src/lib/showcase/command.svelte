<script lang="ts">
	import * as Command from '#lib/components/ui/command/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { forcedOpen } from '#lib/preview/view.svelte.js';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import UserIcon from '@lucide/svelte/icons/user';

	let open = $state(forcedOpen('command-dialog'));
</script>

{#snippet list()}
	<Command.Input placeholder="Type a command or search" />
	<Command.List>
		<Command.Empty>No results.</Command.Empty>
		<Command.Group heading="Suggestions">
			<Command.Item><CalendarIcon />Calendar</Command.Item>
			<Command.Item disabled><CalendarIcon />Disabled item</Command.Item>
		</Command.Group>
		<Command.Separator />
		<Command.Group heading="Settings">
			<Command.Item><UserIcon />Profile<Command.Shortcut>⌘P</Command.Shortcut></Command.Item>
			<Command.Item><SettingsIcon />Settings<Command.Shortcut>⌘S</Command.Shortcut></Command.Item>
		</Command.Group>
	</Command.List>
{/snippet}

<section id="showcase-command" data-showcase="command" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">command</h2>
	<h3 class="text-xs font-medium text-muted-foreground">inline</h3>
	<!-- On mount, a command selects its first item and scrolls that item into view. On this long
	     page, that scroll moves the window to this showcase on every load, so the inline command
	     does not scroll on mount. The arrow keys still scroll the list. The palette in the dialog
	     keeps the scroll. -->
	<Command.Root class="max-w-md rounded-lg border border-border" disableInitialScroll>{@render list()}</Command.Root>
	<h3 class="text-xs font-medium text-muted-foreground">dialog</h3>
	<button type="button" class="{buttonVariants({ variant: 'outline' })} w-fit" data-open-id="command-dialog" onclick={() => (open = true)}>
		Open the palette
	</button>
	<Command.Dialog bind:open>{@render list()}</Command.Dialog>
</section>
