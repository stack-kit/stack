<script lang="ts">
	import * as Item from '#lib/components/ui/item/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import ShieldIcon from '@lucide/svelte/icons/shield-check';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	const variants = ['default', 'outline', 'muted'] as const;
	const sizes = ['default', 'sm', 'xs'] as const;
	const photo =
		'data:image/svg+xml,' +
		encodeURIComponent(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#8a8f98"/><circle cx="20" cy="16" r="7" fill="#d9dce1"/></svg>'
		);
</script>

<section id="showcase-item" data-showcase="item" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">item</h2>
	<div class="grid max-w-4xl gap-6 lg:grid-cols-3">
		{#each variants as variant (variant)}
			<div class="flex flex-col gap-2">
				<h3 class="text-xs font-medium text-muted-foreground">variant {variant}</h3>
				{#each sizes as size (size)}
					<Item.Root {variant} {size}>
						<Item.Media variant="icon"><ShieldIcon /></Item.Media>
						<Item.Content>
							<Item.Title>Size {size}</Item.Title>
							<Item.Description>Media icon, content and actions.</Item.Description>
						</Item.Content>
						<Item.Actions><Button size="sm" variant="outline">Review</Button></Item.Actions>
					</Item.Root>
				{/each}
			</div>
		{/each}
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">a group with image media, a header, a footer, separators and a link item</h3>
	<Item.Group class="max-w-md">
		<Item.Root variant="outline">
			<Item.Header class="text-xs text-muted-foreground">Item header</Item.Header>
			<Item.Media variant="image"><img src={photo} alt="" /></Item.Media>
			<Item.Content>
				<Item.Title>Ana Novak</Item.Title>
				<Item.Description>Media variant image.</Item.Description>
			</Item.Content>
			<Item.Footer class="text-xs text-muted-foreground">Item footer</Item.Footer>
		</Item.Root>
		<Item.Separator />
		<Item.Root>
			{#snippet child({ props })}
				<a href="#showcase-item" {...props}>
					<Item.Media><ShieldIcon /></Item.Media>
					<Item.Content><Item.Title>An item as a link</Item.Title></Item.Content>
					<Item.Actions><ChevronRightIcon class="size-4" /></Item.Actions>
				</a>
			{/snippet}
		</Item.Root>
	</Item.Group>
</section>
