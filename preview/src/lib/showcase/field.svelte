<script lang="ts">
	import * as Field from '#lib/components/ui/field/index.js';
	import * as RadioGroup from '#lib/components/ui/radio-group/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
</script>

<section id="showcase-field" data-showcase="field" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">field</h2>
	<div class="grid max-w-4xl gap-8 lg:grid-cols-2">
		<Field.Set>
			<Field.Legend>Profile, legend variant legend</Field.Legend>
			<Field.Description>A field set with a group of fields in each orientation.</Field.Description>
			<Field.Group>
				<Field.Field>
					<Field.Label for="field-name">Name</Field.Label>
					<Input id="field-name" placeholder="Ana" />
					<Field.Description>Orientation vertical, with a description.</Field.Description>
				</Field.Field>
				<Field.Field data-invalid="true">
					<Field.Label for="field-email">Email</Field.Label>
					<Input id="field-email" value="ana@" aria-invalid="true" />
					<Field.Error>Enter a whole email address.</Field.Error>
				</Field.Field>
				<Field.Field data-disabled="true">
					<Field.Label for="field-disabled">Disabled</Field.Label>
					<Input id="field-disabled" value="Locked" disabled />
				</Field.Field>
				<Field.Separator>Or</Field.Separator>
				<Field.Field orientation="horizontal">
					<Checkbox id="field-news" checked />
					<Field.Label for="field-news">Orientation horizontal, with a check box</Field.Label>
				</Field.Field>
				<Field.Field orientation="horizontal">
					<Field.Content>
						<Field.Label for="field-switch">Field content</Field.Label>
						<Field.Description>A label and a description beside a switch.</Field.Description>
					</Field.Content>
					<Switch id="field-switch" />
				</Field.Field>
				<Field.Field orientation="responsive">
					<Field.Content>
						<Field.Label for="field-responsive">Orientation responsive</Field.Label>
						<Field.Description>A row when the group is wide enough.</Field.Description>
					</Field.Content>
					<Input id="field-responsive" placeholder="Value" />
				</Field.Field>
			</Field.Group>
		</Field.Set>
		<Field.Set>
			<Field.Legend variant="label">Plan, legend variant label</Field.Legend>
			<RadioGroup.Root value="team">
				<Field.Label for="field-plan-solo">
					<Field.Field orientation="horizontal">
						<Field.Content>
							<Field.Title>Solo</Field.Title>
							<Field.Description>A choice card: a field inside a label.</Field.Description>
						</Field.Content>
						<RadioGroup.Item value="solo" id="field-plan-solo" />
					</Field.Field>
				</Field.Label>
				<Field.Label for="field-plan-team">
					<Field.Field orientation="horizontal">
						<Field.Content>
							<Field.Title>Team</Field.Title>
							<Field.Description>The checked choice card.</Field.Description>
						</Field.Content>
						<RadioGroup.Item value="team" id="field-plan-team" />
					</Field.Field>
				</Field.Label>
			</RadioGroup.Root>
			<Field.Error errors={[{ message: 'First error.' }, { message: 'Second error.' }]} />
		</Field.Set>
	</div>
</section>
