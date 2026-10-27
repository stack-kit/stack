<script lang="ts">
	import * as Empty from '#lib/components/ui/empty/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import FolderIcon from '@lucide/svelte/icons/folder-open';
	import InboxIcon from '@lucide/svelte/icons/inbox';
</script>

<section id="showcase-empty" data-showcase="empty" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">empty</h2>
	<div class="grid max-w-4xl gap-6 lg:grid-cols-2">
		<Empty.Root class="border">
			<Empty.Header>
				<Empty.Media variant="icon"><FolderIcon /></Empty.Media>
				<Empty.Title>No projects yet</Empty.Title>
				<Empty.Description>Media variant icon, with a border and two actions.</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<div class="flex gap-2">
					<Button size="sm">Create a project</Button>
					<Button size="sm" variant="outline">Import</Button>
				</div>
			</Empty.Content>
		</Empty.Root>
		<Empty.Root>
			<Empty.Header>
				<Empty.Media><InboxIcon class="size-8" /></Empty.Media>
				<Empty.Title>The inbox is empty</Empty.Title>
				<Empty.Description>Media variant default, with no border.</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	</div>
</section>
