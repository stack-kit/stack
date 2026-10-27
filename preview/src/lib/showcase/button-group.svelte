<script lang="ts">
	import * as ButtonGroup from '#lib/components/ui/button-group/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import SearchIcon from '@lucide/svelte/icons/search';
</script>

<section id="showcase-button-group" data-showcase="button-group" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">button-group</h2>
	<h3 class="text-xs font-medium text-muted-foreground">horizontal</h3>
	<div class="flex flex-wrap items-start gap-4">
		<ButtonGroup.Root>
			<Button variant="outline">Archive</Button>
			<Button variant="outline">Report</Button>
			<Button variant="outline">Snooze</Button>
		</ButtonGroup.Root>
		<ButtonGroup.Root>
			<Button variant="outline" size="sm">Small</Button>
			<Button variant="outline" size="sm">Group</Button>
		</ButtonGroup.Root>
		<ButtonGroup.Root>
			<Button>Save</Button>
			<ButtonGroup.Separator />
			<Button size="icon" aria-label="More save options"><ChevronDownIcon /></Button>
		</ButtonGroup.Root>
		<ButtonGroup.Root>
			<ButtonGroup.Text>https://</ButtonGroup.Text>
			<Input placeholder="example.org" aria-label="Address" />
		</ButtonGroup.Root>
		<ButtonGroup.Root>
			<Input placeholder="Search" aria-label="Search" />
			<Button variant="outline" size="icon" aria-label="Search"><SearchIcon /></Button>
		</ButtonGroup.Root>
	</div>
	<h3 class="text-xs font-medium text-muted-foreground">vertical</h3>
	<ButtonGroup.Root orientation="vertical" class="w-fit">
		<Button variant="outline">Top</Button>
		<Button variant="outline">Middle</Button>
		<Button variant="outline">Bottom</Button>
	</ButtonGroup.Root>
</section>
