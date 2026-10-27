<script lang="ts">
	import * as Questionnaire from '#lib/components/ui/questionnaire/index.js';

	const items = [
		{
			name: 'role',
			required: true,
			choices: [{ value: 'design' }, { value: 'engineering' }, { value: 'other', disabled: true }]
		},
		{ name: 'tools', choices: [{ value: 'editor' }, { value: 'terminal' }, { value: 'browser' }] },
		{ name: 'email', required: true }
	];
</script>

{#snippet form(defaultItem: string, invalid: boolean)}
	<Questionnaire.Root {items} {defaultItem} shortcuts="letters" class="max-w-md rounded-lg border border-border p-4">
		<Questionnaire.Progress />
		<Questionnaire.Item name="role" required>
			<Questionnaire.Title>What is your role?</Questionnaire.Title>
			<Questionnaire.Description>One choice, with letter shortcuts.</Questionnaire.Description>
			<Questionnaire.Choices>
				<Questionnaire.Choice value="design" defaultChecked>Design</Questionnaire.Choice>
				<Questionnaire.Choice value="engineering">
					Engineering
					<Questionnaire.ChoiceDescription>Writes and reviews the code.</Questionnaire.ChoiceDescription>
				</Questionnaire.Choice>
				<Questionnaire.Choice value="other" disabled>Other, disabled</Questionnaire.Choice>
			</Questionnaire.Choices>
			<Questionnaire.Error>Choose a role.</Questionnaire.Error>
		</Questionnaire.Item>
		<Questionnaire.Item name="tools" multiple>
			<Questionnaire.Title>Which tools do you use?</Questionnaire.Title>
			<Questionnaire.Description>More than one choice.</Questionnaire.Description>
			<Questionnaire.Choices>
				<Questionnaire.Choice value="editor" defaultChecked>An editor</Questionnaire.Choice>
				<Questionnaire.Choice value="terminal" defaultChecked>A terminal</Questionnaire.Choice>
				<Questionnaire.Choice value="browser">A browser</Questionnaire.Choice>
			</Questionnaire.Choices>
		</Questionnaire.Item>
		<Questionnaire.Item name="email" required {invalid}>
			<Questionnaire.Title>Where do we send the summary?</Questionnaire.Title>
			<Questionnaire.Input type="email" placeholder="ana@example.org" aria-invalid={invalid || undefined} />
			<Questionnaire.Error>Enter an email address.</Questionnaire.Error>
		</Questionnaire.Item>
		<Questionnaire.Actions>
			<Questionnaire.Previous>Back</Questionnaire.Previous>
			<Questionnaire.Skip>Skip</Questionnaire.Skip>
			<Questionnaire.Next>Next</Questionnaire.Next>
			<Questionnaire.Submit>Submit</Questionnaire.Submit>
		</Questionnaire.Actions>
	</Questionnaire.Root>
{/snippet}

<section id="showcase-questionnaire" data-showcase="questionnaire" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">questionnaire</h2>
	<div class="grid max-w-5xl gap-6 lg:grid-cols-3">
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">one choice</h3>
			{@render form('role', false)}
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">multiple choices</h3>
			{@render form('tools', false)}
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">an input, invalid</h3>
			{@render form('email', true)}
		</div>
	</div>
</section>
