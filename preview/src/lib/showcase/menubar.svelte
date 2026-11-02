<script lang="ts">
	import * as Menubar from '#lib/components/ui/menubar/index.js';
	import { forcedOpen } from '#lib/preview/view.svelte.js';

	let value = $state(forcedOpen('menubar') ? 'file' : '');
	let wrap = $state(true);
	let profile = $state('ana');
</script>

<section id="showcase-menubar" data-showcase="menubar" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">menubar</h2>
	<Menubar.Root {value} onValueChange={(v) => (value = v)} class="w-fit">
		<Menubar.Menu value="file">
			<Menubar.Trigger data-open-id="menubar">File</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.Item>New tab<Menubar.Shortcut>⌘T</Menubar.Shortcut></Menubar.Item>
				<Menubar.Item disabled>New incognito window</Menubar.Item>
				<Menubar.Item inset>Inset item</Menubar.Item>
				<Menubar.Separator />
				<Menubar.Sub>
					<Menubar.SubTrigger>Share</Menubar.SubTrigger>
					<Menubar.SubContent>
						<Menubar.Item>Email link</Menubar.Item>
						<Menubar.Item>Messages</Menubar.Item>
					</Menubar.SubContent>
				</Menubar.Sub>
				<Menubar.Separator />
				<Menubar.Item variant="destructive">Close the window</Menubar.Item>
			</Menubar.Content>
		</Menubar.Menu>
		<Menubar.Menu value="view">
			<Menubar.Trigger>View</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.Group>
					<Menubar.GroupHeading>Text</Menubar.GroupHeading>
					<Menubar.CheckboxItem bind:checked={wrap}>Word wrap</Menubar.CheckboxItem>
				</Menubar.Group>
			</Menubar.Content>
		</Menubar.Menu>
		<Menubar.Menu value="profiles">
			<Menubar.Trigger>Profiles</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.Label inset>Profiles</Menubar.Label>
				<Menubar.RadioGroup bind:value={profile}>
					<Menubar.RadioItem value="ana">Ana</Menubar.RadioItem>
					<Menubar.RadioItem value="ben">Ben</Menubar.RadioItem>
				</Menubar.RadioGroup>
			</Menubar.Content>
		</Menubar.Menu>
	</Menubar.Root>
</section>
