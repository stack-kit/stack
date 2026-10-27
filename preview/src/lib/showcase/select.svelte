<script lang="ts">
	import * as Field from '#lib/components/ui/field/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import { forcedOpen } from '#lib/stack/view.svelte.js';

	const sizes = ['sm', 'default'] as const;
	let open = $state(forcedOpen('select'));
	// The items prop of every Select.Root holds the entries of the list below. With items, the
	// trigger shows the label of a stored value before the list opens, and type-ahead works on the
	// closed trigger. Without it, the trigger shows the raw value until the list opens once.
	const fruits = [
		{ value: 'apple', label: 'Apple' },
		{ value: 'pear', label: 'Pear' },
		{ value: 'quince', label: 'Quince', disabled: true },
		{ value: 'leek', label: 'Leek' }
	];
</script>

{#snippet items()}
	<Select.Group>
		<Select.Label>Fruits</Select.Label>
		<Select.Item value="apple" label="Apple" />
		<Select.Item value="pear" label="Pear" />
		<Select.Item value="quince" label="Quince" disabled />
	</Select.Group>
	<Select.Separator />
	<Select.Group>
		<Select.GroupHeading>Vegetables</Select.GroupHeading>
		<Select.Item value="leek" label="Leek" />
	</Select.Group>
{/snippet}

<section id="showcase-select" data-showcase="select" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">select</h2>
	{#each sizes as size (size)}
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">size {size}</h3>
			<div class="flex flex-wrap items-center gap-3">
				<Select.Root type="single" items={fruits}>
					<Select.Trigger {size} class="w-44" aria-label="Fruit, {size}"><Select.Value placeholder="Placeholder" /></Select.Trigger>
					<Select.Content>{@render items()}</Select.Content>
				</Select.Root>
				<Select.Root type="single" items={fruits} value="apple">
					<Select.Trigger {size} class="w-44" aria-label="Fruit, {size}, chosen"><Select.Value /></Select.Trigger>
					<Select.Content>{@render items()}</Select.Content>
				</Select.Root>
				<Select.Root type="single" items={fruits} value="apple" disabled>
					<Select.Trigger {size} class="w-44" aria-label="Fruit, {size}, disabled"><Select.Value /></Select.Trigger>
					<Select.Content>{@render items()}</Select.Content>
				</Select.Root>
				<Select.Root type="single" items={fruits}>
					<Select.Trigger {size} class="w-44" aria-invalid="true" aria-label="Fruit, {size}, invalid">
						<Select.Value placeholder="Invalid" />
					</Select.Trigger>
					<Select.Content>{@render items()}</Select.Content>
				</Select.Root>
			</div>
		</div>
	{/each}
	<h3 class="text-xs font-medium text-muted-foreground">in a field, with a label</h3>
	<!-- The label names the trigger through aria-labelledby with its own id and the id of the trigger, so that the name holds the value. -->
	<Field.Field class="w-44">
		<Field.Label id="showcase-select-label" for="showcase-select-field">Fruit</Field.Label>
		<Select.Root type="single" items={fruits}>
			<Select.Trigger id="showcase-select-field" aria-labelledby="showcase-select-label showcase-select-field" class="w-full">
				<Select.Value placeholder="Choose a fruit" />
			</Select.Trigger>
			<Select.Content>{@render items()}</Select.Content>
		</Select.Root>
	</Field.Field>
	<h3 class="text-xs font-medium text-muted-foreground">in a field, with a stored value</h3>
	<Field.Field class="w-44">
		<Field.Label id="showcase-select-stored-label" for="showcase-select-stored">Fruit</Field.Label>
		<Select.Root type="single" items={fruits} value="apple">
			<Select.Trigger id="showcase-select-stored" aria-labelledby="showcase-select-stored-label showcase-select-stored" class="w-full">
				<Select.Value placeholder="Choose a fruit" />
			</Select.Trigger>
			<Select.Content>{@render items()}</Select.Content>
		</Select.Root>
	</Field.Field>
	<h3 class="text-xs font-medium text-muted-foreground">open, with a chosen item</h3>
	<Select.Root type="single" items={fruits} value="pear" bind:open>
		<Select.Trigger class="w-44" data-open-id="select" aria-label="Fruit, open"><Select.Value /></Select.Trigger>
		<Select.Content>{@render items()}</Select.Content>
	</Select.Root>
</section>
