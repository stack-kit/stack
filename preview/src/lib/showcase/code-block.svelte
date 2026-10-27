<script lang="ts">
	import CodeBlock, { type LogEntry } from '#lib/stack/CodeBlock.svelte';

	const config = [
		'# A text past the max-height of the box, so that the box scrolls down.',
		'# The next line runs past the width of the box, so that it scrolls sideways at 768 px and up, and wraps below.',
		'rules:',
		...Array.from({ length: 27 }, (_, i) => `  - id: rule-${i + 1}\n    run: check --level ${(i % 3) + 1}`)
	].join('\n');
	const short = 'name: nightly-check\nsteps:\n  - fetch\n  - test\n';
	const token = 'tok_3b8e51c0f9a24d7e86c1a05f2e9d4b73';
	const install = 'npm install --save-exact @codemirror/state@6.7.6';
	const join = [
		'runner join \\',
		'  --server https://hub.example.com \\',
		'  --machine "Rack 2" \\',
		'  --key tok_3b8e51c0f9a24d7e86c1a05f2e9d4b73',
		'runner status --wait-for-connection --timeout 120 --print-the-full-path-of-the-config-file'
	].join('\n');
	const at = (s: string) => `2026-10-18 14:${s}`;
	const log: LogEntry[] = [
		['20:05', 'read project.toml: prefix INV, 6 statuses, 9 labels'],
		['20:05', 'labels 9 of 9'],
		['20:06', 'records 1 to 150 of 437'],
		['20:41', 'records 151 to 437 of 437'],
		['21:02', 'comments 1185 of 1186: an entry of INV-301 had no text, so the import skipped it and went on with the next entry'],
		['21:02', 'finished: 437 records, 1185 comments, 9 labels']
	].map(([t, text]) => ({
		time: at(t),
		datetime: `2026-10-18T14:${t}+02:00`,
		full: `Sunday, 18 October 2026 at 14:${t} Central European Summer Time`,
		text
	}));
	const screen = 'worker 3 on rack-2\nOverwrite exports/manifest.json? [y/N]';
</script>

<section id="showcase-code-block" data-showcase="code-block" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">code-block</h2>
	<div class="grid max-w-4xl gap-8 lg:grid-cols-2">
		<div class="flex min-w-0 flex-col gap-2">
			<h3 id="code-block-config" class="text-xs font-medium text-muted-foreground">code, numbered, scrolling at 320 px, and sideways from 768 px</h3>
			<CodeBlock code={config} numbers aria-labelledby="code-block-config" copyLabel="Copy the rules" />
		</div>
		<div class="flex min-w-0 flex-col gap-6">
			<div class="flex flex-col gap-2">
				<h3 id="code-block-short" class="text-xs font-medium text-muted-foreground">code, numbered, fitting</h3>
				<CodeBlock code={short} numbers aria-labelledby="code-block-short" copyLabel="Copy the steps" />
			</div>
			<div class="flex flex-col gap-2">
				<h3 id="code-block-token" class="text-xs font-medium text-muted-foreground">code, one value</h3>
				<CodeBlock code={token} aria-labelledby="code-block-token" copyLabel="Copy the token" />
			</div>
			<div class="flex flex-col gap-2">
				<h3 id="code-block-install" class="text-xs font-medium text-muted-foreground">command, one line</h3>
				<CodeBlock kind="command" code={install} aria-labelledby="code-block-install" copyLabel="Copy the install command" />
			</div>
		</div>
		<div class="flex min-w-0 flex-col gap-2">
			<h3 id="code-block-join" class="text-xs font-medium text-muted-foreground">command, two commands, wrapping</h3>
			<CodeBlock kind="command" code={join} aria-labelledby="code-block-join" copyLabel="Copy the join commands" />
		</div>
		<div class="flex min-w-0 flex-col gap-2">
			<h3 id="code-block-log" class="text-xs font-medium text-muted-foreground">log, with times, wrapping</h3>
			<CodeBlock kind="log" entries={log} aria-labelledby="code-block-log" copyLabel="Copy the import log" />
		</div>
		<div class="flex min-w-0 flex-col gap-2">
			<h3 id="code-block-screen" class="text-xs font-medium text-muted-foreground">log, the screen of a terminal</h3>
			<CodeBlock kind="log" code={screen} aria-labelledby="code-block-screen" copyLabel="Copy the screen" />
		</div>
		<div class="flex min-w-0 flex-col gap-2">
			<h3 id="code-block-low" class="text-xs font-medium text-muted-foreground">log, stopping at 120 px</h3>
			<CodeBlock kind="log" entries={log} class="max-h-30" aria-labelledby="code-block-low" copyLabel="Copy the short log" />
		</div>
	</div>
</section>
