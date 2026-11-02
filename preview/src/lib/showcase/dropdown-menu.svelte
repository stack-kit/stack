<script lang="ts">
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import ReasonMenuItem from '#lib/stack/ReasonMenuItem.svelte';
	import { forcedOpen } from '#lib/preview/view.svelte.js';
	import UserIcon from '@lucide/svelte/icons/user';

	let open = $state(forcedOpen('dropdown-menu'));
	let showStatus = $state(true);
	let showPanel = $state(false);
	let position = $state('bottom');
</script>

<section id="showcase-dropdown-menu" data-showcase="dropdown-menu" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">dropdown-menu</h2>
	<DropdownMenu.Root bind:open>
		<DropdownMenu.Trigger class="{buttonVariants({ variant: 'outline' })} w-fit" data-open-id="dropdown-menu">Open the menu</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-56">
			<DropdownMenu.Group>
				<DropdownMenu.Label>My account</DropdownMenu.Label>
				<DropdownMenu.Item><UserIcon />Profile<DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut></DropdownMenu.Item>
				<DropdownMenu.Item inset>Inset item</DropdownMenu.Item>
				<DropdownMenu.Item disabled>Disabled item</DropdownMenu.Item>
				<!-- A rule blocks the item: it stays reachable with the arrow keys, does nothing, and gives its reason. -->
				<ReasonMenuItem label="Blocked item" reason="Close the 3 open tasks first." onSelect={() => {}} />
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger>Invite users</DropdownMenu.SubTrigger>
					<DropdownMenu.SubContent>
						<DropdownMenu.Item>Email</DropdownMenu.Item>
						<DropdownMenu.Item>Message</DropdownMenu.Item>
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.GroupHeading>Appearance</DropdownMenu.GroupHeading>
				<DropdownMenu.CheckboxItem bind:checked={showStatus}>Status bar</DropdownMenu.CheckboxItem>
				<DropdownMenu.CheckboxItem bind:checked={showPanel}>Activity panel</DropdownMenu.CheckboxItem>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.RadioGroup bind:value={position}>
				<DropdownMenu.Label inset>Panel position</DropdownMenu.Label>
				<DropdownMenu.RadioItem value="top">Top</DropdownMenu.RadioItem>
				<DropdownMenu.RadioItem value="bottom">Bottom</DropdownMenu.RadioItem>
			</DropdownMenu.RadioGroup>
			<DropdownMenu.Separator />
			<DropdownMenu.Item variant="destructive">Delete, variant destructive</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</section>
