<script lang="ts">
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { forcedOpen } from '#lib/stack/view.svelte.js';

	let open = $state(forcedOpen('dialog'));
	let openFooterClose = $state(forcedOpen('dialog-footer-close'));
	let openWide = $state(forcedOpen('dialog-wide'));

	// A wide dialog holds a list that the person checks before one action. Its body scrolls
	// between the header and the footer, and the dialog is at most 11/12 of the window high.
	const DUE = Array.from({ length: 14 }, (_, i) => ({
		number: `INV-${String(41 + i).padStart(4, '0')}`,
		client: ['Harbor Supply', 'North Mill', 'Blue Ash Studio', 'Quarry Lane'][i % 4],
		days: 3 + ((i * 5) % 40)
	}));
	let picked = $state(DUE.map((d) => d.number));
</script>

<section id="showcase-dialog" data-showcase="dialog" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">dialog</h2>
	<div class="flex flex-wrap gap-3">
		<Dialog.Root bind:open>
			<Dialog.Trigger class={buttonVariants({ variant: 'outline' })} data-open-id="dialog">
				With the close button
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Edit the profile</Dialog.Title>
					<Dialog.Description>Change the name, then save. The close button sits at the top right.</Dialog.Description>
				</Dialog.Header>
				<div class="flex flex-col gap-2">
					<Label for="dialog-name">Name</Label>
					<Input id="dialog-name" value="Ana" />
				</div>
				<Dialog.Footer>
					<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
					<Button onclick={() => (open = false)}>Save</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
		<Dialog.Root bind:open={openFooterClose}>
			<Dialog.Trigger class={buttonVariants({ variant: 'outline' })} data-open-id="dialog-footer-close">
				With a close button in the footer
			</Dialog.Trigger>
			<Dialog.Content showCloseButton={false}>
				<Dialog.Header>
					<Dialog.Title>Share the link</Dialog.Title>
					<Dialog.Description>showCloseButton is off on the content and on in the footer.</Dialog.Description>
				</Dialog.Header>
				<Input value="https://example.org/share/1234" readonly aria-label="Link" />
				<Dialog.Footer showCloseButton />
			</Dialog.Content>
		</Dialog.Root>
		<Dialog.Root bind:open={openWide}>
			<Dialog.Trigger class={buttonVariants({ variant: 'outline' })} data-open-id="dialog-wide">Wide, with a list</Dialog.Trigger>
			<Dialog.Content class="flex flex-col sm:max-w-160 md:max-h-11/12">
				<Dialog.Header>
					<Dialog.Title>Send a reminder</Dialog.Title>
					<Dialog.Description>The client of each checked invoice gets one email. The dialog is 640 px wide, and its list scrolls in a short window.</Dialog.Description>
				</Dialog.Header>
				<ul class="-mx-4 flex min-h-0 flex-1 flex-col overflow-y-auto px-4" aria-label="Overdue invoices">
					{#each DUE as d (d.number)}
						{@const id = `dialog-wide-${d.number}`}
						<li class="flex h-8 items-center gap-3 border-b border-border-faint text-sm">
							<Checkbox
								{id}
								checked={picked.includes(d.number)}
								onCheckedChange={(on) => (picked = on ? [...picked, d.number] : picked.filter((n) => n !== d.number))}
							/>
							<label for={id} class="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
								<span class="w-20 shrink-0 font-medium">INV-<span class="tabular-nums">{d.number.slice(4)}</span></span>
								<span class="min-w-0 flex-1 truncate">{d.client}</span>
								<span class="text-muted-foreground tabular-nums">{d.days} days late</span>
							</label>
						</li>
					{/each}
				</ul>
				<Dialog.Footer>
					<Dialog.Close class={buttonVariants({ variant: 'outline' })}>Cancel</Dialog.Close>
					<Button disabled={picked.length === 0} onclick={() => (openWide = false)}>Send {picked.length} {picked.length === 1 ? 'reminder' : 'reminders'}</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	</div>
</section>
