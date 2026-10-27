<script lang="ts">
	import * as Form from '#lib/components/ui/form/index.js';
	import * as RadioGroup from '#lib/components/ui/radio-group/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import type { SuperForm } from 'sveltekit-superforms';
	import { writable } from 'svelte/store';

	type Data = { username: string; email: string; notify: string };

	// sveltekit-superforms 2.31.0 supports SvelteKit 1 and 2. Its superForm() reads $app/stores,
	// which SvelteKit 3 removed, so it throws app_stores_removed. The form parts read only these
	// four stores of a superForm, so the showcase passes them directly. The email error is set
	// by hand, so that the invalid state shows with no submit.
	const form = {
		form: writable<Data>({ username: 'ana', email: 'ana@', notify: 'all' }),
		errors: writable({ email: ['Enter a whole email address.'] }),
		constraints: writable({}),
		tainted: writable(undefined)
	} as unknown as SuperForm<Data>;
	const formData = form.form;
</script>

<section id="showcase-form" data-showcase="form" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">form</h2>
	<form class="flex max-w-sm flex-col gap-6" onsubmit={(e) => e.preventDefault()}>
		<Form.Field {form} name="username">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Username</Form.Label>
					<Input {...props} bind:value={$formData.username} />
				{/snippet}
			</Form.Control>
			<Form.Description>The valid state, with a description.</Form.Description>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="email">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Email</Form.Label>
					<Input {...props} bind:value={$formData.email} />
				{/snippet}
			</Form.Control>
			<Form.Description>The invalid state, with an error.</Form.Description>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Fieldset {form} name="notify" class="flex flex-col gap-3">
			<Form.Legend>Notify me about</Form.Legend>
			<RadioGroup.Root bind:value={$formData.notify} name="notify" class="flex flex-col gap-2">
				{#each [['all', 'All new messages'], ['mentions', 'Mentions only']] as [value, label] (value)}
					<div class="flex items-center gap-2">
						<Form.Control>
							{#snippet children({ props })}
								<RadioGroup.Item {value} {...props} />
								<Form.Label class="font-normal">{label}</Form.Label>
							{/snippet}
						</Form.Control>
					</div>
				{/each}
			</RadioGroup.Root>
			<Form.FieldErrors />
		</Form.Fieldset>
		<Form.Button class="w-fit">Submit</Form.Button>
	</form>
</section>
