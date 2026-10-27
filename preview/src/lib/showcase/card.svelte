<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import { Button } from '#lib/components/ui/button/index.js';

	const sizes = ['default', 'sm'] as const;
</script>

<section id="showcase-card" data-showcase="card" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">card</h2>
	<div class="grid max-w-4xl gap-6 lg:grid-cols-3">
		{#each sizes as size (size)}
			<Card.Root {size}>
				<Card.Header>
					<Card.Title>Size {size}</Card.Title>
					<Card.Description>A card with a header, an action, content and a footer.</Card.Description>
					<Card.Action><Button variant="link" size="sm">Action</Button></Card.Action>
				</Card.Header>
				<Card.Content>The content of the card.</Card.Content>
				<Card.Footer class="gap-2">
					<Button size="sm">Save</Button>
					<Button size="sm" variant="outline">Cancel</Button>
				</Card.Footer>
			</Card.Root>
		{/each}
		<Card.Root>
			<Card.Content>A card with content only.</Card.Content>
		</Card.Root>
	</div>
</section>
