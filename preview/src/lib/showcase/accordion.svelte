<script lang="ts">
	import * as Accordion from '#lib/components/ui/accordion/index.js';

	const items = [
		['shipping', 'Shipping', 'The order ships in two working days.', false],
		['returns', 'Returns', 'A return is free for thirty days.', false],
		['gift', 'Gift wrap, disabled', 'Not offered this month.', true]
	] as const;
</script>

<section id="showcase-accordion" data-showcase="accordion" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">accordion</h2>
	<div class="grid max-w-4xl gap-8 lg:grid-cols-2">
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">type single, first item open</h3>
			<Accordion.Root type="single" value="shipping">
				{#each items as [value, title, text, disabled] (value)}
					<Accordion.Item {value} {disabled}>
						<Accordion.Trigger>{title}</Accordion.Trigger>
						<Accordion.Content>{text}</Accordion.Content>
					</Accordion.Item>
				{/each}
			</Accordion.Root>
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">type multiple, two items open</h3>
			<Accordion.Root type="multiple" value={['shipping', 'returns']}>
				{#each items as [value, title, text, disabled] (value)}
					<Accordion.Item {value} {disabled}>
						<Accordion.Trigger>{title}</Accordion.Trigger>
						<Accordion.Content>{text}</Accordion.Content>
					</Accordion.Item>
				{/each}
			</Accordion.Root>
		</div>
	</div>
</section>
