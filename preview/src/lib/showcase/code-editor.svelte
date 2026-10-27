<script lang="ts">
	import * as Field from '#lib/components/ui/field/index.js';
	import * as Kbd from '#lib/components/ui/kbd/index.js';

	// CodeMirror adds about 88 KB gzip. The component page holds every showcase in one chunk, so the
	// editor loads in a chunk of its own, and the page chunk stays under the 500 kB warning of the bundler.
	const loading = import('#lib/stack/CodeEditor.svelte');

	let short = $state('name: nightly-check\nsteps:\n  - fetch\n  - test');
	const long = [
		'# A text past the max-height of the box, so that the box scrolls.',
		'# The next line runs past the width of the box, so that it scrolls sideways at 768 px and up, and wraps below.',
		'rules:',
		...Array.from({ length: 27 }, (_, i) => `  - id: rule-${i + 1}\n    run: check --level ${(i % 3) + 1}`)
	].join('\n');
	let longValue = $state(long);
	const locked = 'name: release\nsteps:\n  - build\n  - publish';
	let invalidValue = $state('name: broken\nsteps\n  - fetch');
</script>

<section id="showcase-code-editor" data-showcase="code-editor" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">code-editor</h2>
	{#await loading then { default: CodeEditor }}
		<div class="grid max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
			<Field.Field>
				<Field.Label id="code-editor-short-label">Instructions, growing</Field.Label>
				<CodeEditor
					bind:value={short}
					class="max-h-80"
					aria-labelledby="code-editor-short-label"
					aria-describedby="code-editor-short-keys"
				/>
				<Field.Description id="code-editor-short-keys">
					<Kbd.Root>Tab</Kbd.Root> indents. <Kbd.Root>Esc</Kbd.Root>, then <Kbd.Root>Tab</Kbd.Root>, moves the
					focus out.
				</Field.Description>
			</Field.Field>
			<Field.Field>
				<Field.Label id="code-editor-long-label">Rules, scrolling at 320 px</Field.Label>
				<CodeEditor
					bind:value={longValue}
					class="max-h-80"
					aria-labelledby="code-editor-long-label"
					aria-describedby="code-editor-long-keys"
				/>
				<Field.Description id="code-editor-long-keys">
					<Kbd.Root>Tab</Kbd.Root> indents. <Kbd.Root>Esc</Kbd.Root>, then <Kbd.Root>Tab</Kbd.Root>, moves the
					focus out.
				</Field.Description>
			</Field.Field>
			<Field.Field>
				<Field.Label id="code-editor-locked-label">Release steps, read-only</Field.Label>
				<Field.Description id="code-editor-locked-reason">
					The release runs now, so its steps do not change.
				</Field.Description>
				<CodeEditor
					value={locked}
					readonly
					class="max-h-80"
					aria-labelledby="code-editor-locked-label"
					aria-describedby="code-editor-locked-reason"
				/>
			</Field.Field>
			<Field.Field data-invalid="true">
				<Field.Label id="code-editor-invalid-label">Steps, invalid</Field.Label>
				<CodeEditor
					bind:value={invalidValue}
					invalid
					class="max-h-80"
					aria-labelledby="code-editor-invalid-label"
					aria-describedby="code-editor-invalid-keys code-editor-invalid-error"
				/>
				<Field.Description id="code-editor-invalid-keys">
					<Kbd.Root>Tab</Kbd.Root> indents. <Kbd.Root>Esc</Kbd.Root>, then <Kbd.Root>Tab</Kbd.Root>, moves the
					focus out.
				</Field.Description>
				<Field.Error id="code-editor-invalid-error">Line 2 needs a colon after "steps".</Field.Error>
			</Field.Field>
		</div>
	{:catch e}
		<p class="text-sm text-destructive">The code editor did not load: {e.message}</p>
	{/await}
</section>
