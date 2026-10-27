<script lang="ts">
	import * as ContextMenu from '#lib/components/ui/context-menu/index.js';
	import { forcedOpen } from '#lib/stack/view.svelte.js';

	let open = $state(forcedOpen('context-menu'));
	let showBookmarks = $state(true);
	let person = $state('ana');
</script>

<section id="showcase-context-menu" data-showcase="context-menu" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">context-menu</h2>
	<ContextMenu.Root bind:open>
		<ContextMenu.Trigger
			class="flex h-32 w-72 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground"
			data-open-id="context-menu"
		>
			Right-click here
		</ContextMenu.Trigger>
		<ContextMenu.Content class="w-56">
			<ContextMenu.Item>Back<ContextMenu.Shortcut>⌘[</ContextMenu.Shortcut></ContextMenu.Item>
			<ContextMenu.Item disabled>Forward<ContextMenu.Shortcut>⌘]</ContextMenu.Shortcut></ContextMenu.Item>
			<ContextMenu.Item inset>Inset item</ContextMenu.Item>
			<ContextMenu.Sub>
				<ContextMenu.SubTrigger>More tools</ContextMenu.SubTrigger>
				<ContextMenu.SubContent>
					<ContextMenu.Item>Save the page</ContextMenu.Item>
					<ContextMenu.Item>Developer tools</ContextMenu.Item>
				</ContextMenu.SubContent>
			</ContextMenu.Sub>
			<ContextMenu.Separator />
			<ContextMenu.Group>
				<ContextMenu.GroupHeading>View</ContextMenu.GroupHeading>
				<ContextMenu.CheckboxItem bind:checked={showBookmarks}>Bookmarks bar</ContextMenu.CheckboxItem>
			</ContextMenu.Group>
			<ContextMenu.Separator />
			<ContextMenu.RadioGroup bind:value={person}>
				<ContextMenu.Label inset>People</ContextMenu.Label>
				<ContextMenu.RadioItem value="ana">Ana</ContextMenu.RadioItem>
				<ContextMenu.RadioItem value="ben">Ben</ContextMenu.RadioItem>
			</ContextMenu.RadioGroup>
			<ContextMenu.Separator />
			<ContextMenu.Item variant="destructive">Delete</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>
</section>
