<script lang="ts">
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { forcedOpen } from '#lib/preview/view.svelte.js';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	const instances = [
		{ id: 'alert-dialog', size: 'default', media: false },
		{ id: 'alert-dialog-media', size: 'default', media: true },
		{ id: 'alert-dialog-sm', size: 'sm', media: true }
	] as const;
	let open = $state(Object.fromEntries(instances.map((i) => [i.id, forcedOpen(i.id)])));
</script>

<section id="showcase-alert-dialog" data-showcase="alert-dialog" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">alert-dialog</h2>
	<div class="flex flex-wrap gap-3">
		{#each instances as i (i.id)}
			<AlertDialog.Root bind:open={open[i.id]}>
				<AlertDialog.Trigger class={buttonVariants({ variant: 'outline' })} data-open-id={i.id}>
					Size {i.size}{i.media ? ', with media' : ''}
				</AlertDialog.Trigger>
				<AlertDialog.Content size={i.size}>
					<AlertDialog.Header>
						{#if i.media}
							<AlertDialog.Media><TrashIcon /></AlertDialog.Media>
						{/if}
						<AlertDialog.Title>Delete the project?</AlertDialog.Title>
						<AlertDialog.Description>This deletes the project and its files. It cannot be undone.</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action variant="destructive">Delete</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		{/each}
	</div>
</section>
