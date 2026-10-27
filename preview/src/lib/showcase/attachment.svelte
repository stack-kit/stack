<script lang="ts">
	import * as Attachment from '#lib/components/ui/attachment/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import XIcon from '@lucide/svelte/icons/x';

	const states = ['idle', 'uploading', 'processing', 'error', 'done'] as const;
	const sizes = ['default', 'sm', 'xs'] as const;
	const photo =
		'data:image/svg+xml,' +
		encodeURIComponent(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#8a8f98"/><circle cx="14" cy="14" r="5" fill="#d9dce1"/><path d="M0 34 L14 22 L24 30 L32 24 L40 30 V40 H0 Z" fill="#d9dce1"/></svg>'
		);
</script>

<section id="showcase-attachment" data-showcase="attachment" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">attachment</h2>
	<h3 class="text-xs font-medium text-muted-foreground">states, horizontal</h3>
	<div class="flex flex-wrap gap-3">
		{#each states as state (state)}
			<Attachment.Root {state}>
				<Attachment.Media>
					{#if state === 'uploading' || state === 'processing'}<Spinner />{:else}<FileTextIcon />{/if}
				</Attachment.Media>
				<Attachment.Content>
					<Attachment.Title>report.pdf</Attachment.Title>
					<Attachment.Description>{state === 'error' ? 'The upload failed' : `State ${state}`}</Attachment.Description>
				</Attachment.Content>
				<Attachment.Actions>
					<Attachment.Action aria-label="Remove"><XIcon /></Attachment.Action>
				</Attachment.Actions>
			</Attachment.Root>
		{/each}
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">sizes, and media variant image</h3>
	<div class="flex flex-wrap items-start gap-3">
		{#each sizes as size (size)}
			<Attachment.Root {size}>
				<Attachment.Media variant="image"><img src={photo} alt="" /></Attachment.Media>
				<Attachment.Content>
					<Attachment.Title>photo.png</Attachment.Title>
					<Attachment.Description>Size {size}</Attachment.Description>
				</Attachment.Content>
			</Attachment.Root>
		{/each}
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">orientation vertical, in a group, with a trigger</h3>
	<Attachment.Group class="max-w-lg">
		{#each sizes as size (size)}
			<Attachment.Root orientation="vertical" {size}>
				<Attachment.Trigger aria-label="Open photo.png" />
				<Attachment.Media variant="image"><img src={photo} alt="" /></Attachment.Media>
				<Attachment.Content>
					<Attachment.Title>photo.png</Attachment.Title>
					<Attachment.Description>Size {size}</Attachment.Description>
				</Attachment.Content>
				<Attachment.Actions>
					<Attachment.Action aria-label="Remove"><XIcon /></Attachment.Action>
				</Attachment.Actions>
			</Attachment.Root>
		{/each}
	</Attachment.Group>
</section>
