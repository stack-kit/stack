<script lang="ts">
	import * as Bubble from '#lib/components/ui/bubble/index.js';
	import type { BubbleVariant } from '#lib/components/ui/bubble/index.js';

	const variants: BubbleVariant[] = ['default', 'secondary', 'muted', 'tinted', 'outline', 'ghost', 'destructive'];
</script>

<section id="showcase-bubble" data-showcase="bubble" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">bubble</h2>
	<div class="grid max-w-3xl gap-x-8 gap-y-6 sm:grid-cols-2">
		{#each variants as variant (variant)}
			<Bubble.Root {variant}>
				<Bubble.Content>Variant {variant}, align start.</Bubble.Content>
			</Bubble.Root>
			<Bubble.Root {variant} align="end">
				<Bubble.Content>Variant {variant}, align end.</Bubble.Content>
			</Bubble.Root>
		{/each}
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">a group, a bubble as a button, and reactions</h3>
	<Bubble.Group class="max-w-sm">
		<Bubble.Root variant="secondary"><Bubble.Content>The first bubble of a group.</Bubble.Content></Bubble.Root>
		<Bubble.Root variant="secondary">
			<Bubble.Content>
				{#snippet child({ props })}
					<button type="button" {...props}>A bubble as a button</button>
				{/snippet}
			</Bubble.Content>
		</Bubble.Root>
		<Bubble.Root class="relative mb-4">
			<Bubble.Content>Reactions, side bottom, align end.</Bubble.Content>
			<Bubble.Reactions>👍 2</Bubble.Reactions>
		</Bubble.Root>
		<Bubble.Root variant="muted" class="relative mt-4">
			<Bubble.Content>Reactions, side top, align start.</Bubble.Content>
			<Bubble.Reactions side="top" align="start">🎉 1</Bubble.Reactions>
		</Bubble.Root>
	</Bubble.Group>
</section>
