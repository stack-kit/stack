<script lang="ts">
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import { Kbd } from '#lib/components/ui/kbd/index.js';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import SearchIcon from '@lucide/svelte/icons/search';
	import SendIcon from '@lucide/svelte/icons/send';
</script>

<section id="showcase-input-group" data-showcase="input-group" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">input-group</h2>
	<div class="grid max-w-3xl gap-3 sm:grid-cols-2">
		<InputGroup.Root>
			<InputGroup.Addon><SearchIcon /></InputGroup.Addon>
			<InputGroup.Input placeholder="Search, addon inline-start" aria-label="Search" />
			<InputGroup.Addon align="inline-end"><Kbd>⌘K</Kbd></InputGroup.Addon>
		</InputGroup.Root>
		<InputGroup.Root>
			<InputGroup.Addon><InputGroup.Text>https://</InputGroup.Text></InputGroup.Addon>
			<InputGroup.Input placeholder="example.org" aria-label="Address" />
			<InputGroup.Addon align="inline-end"><InputGroup.Text>.org</InputGroup.Text></InputGroup.Addon>
		</InputGroup.Root>
		<InputGroup.Root>
			<InputGroup.Input value="Button size xs" aria-label="Button size xs" />
			<InputGroup.Addon align="inline-end"><InputGroup.Button size="xs">Copy</InputGroup.Button></InputGroup.Addon>
		</InputGroup.Root>
		<InputGroup.Root>
			<InputGroup.Input value="Button size sm" aria-label="Button size sm" />
			<InputGroup.Addon align="inline-end">
				<InputGroup.Button size="sm" variant="secondary">Copy</InputGroup.Button>
			</InputGroup.Addon>
		</InputGroup.Root>
		<InputGroup.Root>
			<InputGroup.Input value="Button size icon-xs" aria-label="Button size icon-xs" />
			<InputGroup.Addon align="inline-end">
				<InputGroup.Button size="icon-xs" aria-label="Copy"><CopyIcon /></InputGroup.Button>
			</InputGroup.Addon>
		</InputGroup.Root>
		<InputGroup.Root>
			<InputGroup.Input value="Button size icon-sm" aria-label="Button size icon-sm" />
			<InputGroup.Addon align="inline-end">
				<InputGroup.Button size="icon-sm" aria-label="Copy"><CopyIcon /></InputGroup.Button>
			</InputGroup.Addon>
		</InputGroup.Root>
		<InputGroup.Root>
			<InputGroup.Input value="Invalid" aria-invalid="true" aria-label="Invalid" />
			<InputGroup.Addon align="inline-end"><SearchIcon /></InputGroup.Addon>
		</InputGroup.Root>
		<InputGroup.Root>
			<InputGroup.Input value="Disabled" disabled aria-label="Disabled" />
			<InputGroup.Addon align="inline-end"><SearchIcon /></InputGroup.Addon>
		</InputGroup.Root>
		<InputGroup.Root class="sm:col-span-2">
			<InputGroup.Addon align="block-start"><InputGroup.Text>Addon block-start</InputGroup.Text></InputGroup.Addon>
			<InputGroup.Textarea placeholder="Write a message" aria-label="Message" />
			<InputGroup.Addon align="block-end">
				<InputGroup.Text>Addon block-end</InputGroup.Text>
				<InputGroup.Button size="icon-xs" variant="default" class="ml-auto" aria-label="Send"><SendIcon /></InputGroup.Button>
			</InputGroup.Addon>
		</InputGroup.Root>
	</div>
</section>
