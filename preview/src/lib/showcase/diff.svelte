<script lang="ts">
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import Diff, { type DiffLine } from '#lib/stack/Diff.svelte';

	// The sample lines in a short form: each line starts with " " (unchanged), "+" (added) or "-"
	// (removed). ">" is an added line that replaces the first removed line of its change that no line
	// replaces yet. "~12" stands for 12 lines that the product does not have, and a text after the count
	// is the context of the next hunk. Inside a changed line, "{+...+}" marks an added word and
	// "[-...-]" a removed word, as git diff --word-diff=plain writes them. The numbers count on from the
	// first old and new number.
	function parse(src: string, start = { old: 1, new: 1 }): DiffLine[] {
		let o = start.old;
		let n = start.new;
		// The old numbers of the removed lines of the current change that no line replaces yet.
		let open: number[] = [];
		return src
			.replace(/^\n/, '')
			.split('\n')
			.map((raw): DiffLine => {
				const head = raw[0];
				if (head === '~') {
					const [, digits, context] = raw.match(/^~(\d+) ?(.*)$/)!;
					const count = Number(digits);
					o += count;
					n += count;
					open = [];
					return { kind: 'folded', count, context: context || undefined };
				}
				const body = raw.slice(1);
				const marks = /\{\+([\s\S]*?)\+\}|\[-([\s\S]*?)-\]/g;
				const words: { text: string; changed?: boolean }[] = [];
				let last = 0;
				for (const m of body.matchAll(marks)) {
					if (m.index > last) words.push({ text: body.slice(last, m.index) });
					words.push({ text: m[1] ?? m[2], changed: true });
					last = m.index + m[0].length;
				}
				if (last < body.length) words.push({ text: body.slice(last) });
				const text = words.map((w) => w.text).join('');
				const marked = words.some((w) => w.changed);
				if (head === '+' || head === '>') {
					const replaces = head === '>' ? open.shift() : undefined;
					return { kind: 'added', text, new: n++, replaces, words: marked ? words : undefined };
				}
				if (head === '-') {
					open.push(o);
					return { kind: 'removed', text, old: o++, words: marked ? words : undefined };
				}
				open = [];
				return { kind: 'same', text, old: o++, new: n++ };
			});
	}

	const retry = parse(`
 import { post } from './client';
 import { clock } from './clock';
 import { limits } from './limits';

 /** Sends one part, and tries again after a dropped line. */
 export async function sendPart(part: Part, tries = 0): Promise<Ack> {
   const started = clock.now();
-  if (tries [-> 2-]) throw new GaveUp(part.index);
-  return post(part);
>  if (tries {+>= limits.tries+}) {
+    throw new GaveUp(part.index, clock.since(started));
+  }
>  return post(part{+, { resume: true }+});
 }

 /** The wait before the next try grows with each try, up to the limit. */
 export function wait(tries: number): number {
   const base = 250;
   const step = 2 ** tries;
   const most = limits.wait;
   const late = clock.jitter(base);
   const total = base * step + late;
   return Math.min(total, most);
 }

 /** Sends the parts of a file in their order. */
 export async function sendAll(parts: Part[]): Promise<void> {
-  for (const part of parts) await sendPart(part);
>  for (const part of parts) {
+    await sendPart(part);
+    progress.done(part.index);
+  }
 }`);

	const hunks = parse(
		`
~1205 export async function upload(file: File, server: Server): Promise<Result> {
   const parts = split(file, CHUNK);
-  for (let i = [-0-]; i < parts.length; i++) {
+  const from = await server.offset(file.name);
>  for (let i = {+from+}; i < parts.length; i++) {
     await send(parts[i], i);
~37 export async function upload(file: File, server: Server): Promise<Result> {
   log.info('upload done', { name: file.name, parts: parts.length, bytes: file.size, took: clock.since(started), resumed: from > 0 });
-  return { ok: true };
>  return { ok: true, resumed: from > 0 };
~512`,
		{ old: 1, new: 1 }
	);

	const prose = parse(
		`
 Each part of a file goes up on its own, and the server confirms each one.
-A part that fails [-ends the whole upload-].
>A part that fails {+goes again, up to three times, with a longer wait each time+}.
+After the third try the upload stops and names the part that failed.
 The client keeps the list of the parts that it sent.
 A part is at most 8 MB.
 The upload of a file of 2 GB takes about 250 parts.
 The server keeps a part for 24 hours.
-A part that is older than 24 hours goes again.`
	);

	let view = $state<'unified' | 'split'>('unified');
</script>

<section id="showcase-diff" data-showcase="diff" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">diff</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		The product brings the lines. Unchanged lines more than three lines away from a change fold. N and Shift+N move to the
		next and the previous change while the focus is in a diff. From 1024 px the switch shows the split view.
	</p>
	<ToggleGroup.Root
		type="single"
		size="sm"
		spacing={0.5}
		class="w-fit bg-muted p-0.5 max-lg:hidden"
		aria-label="View of the diffs"
		bind:value={() => view, (v) => v && (view = v as 'unified' | 'split')}
	>
		{#each [['unified', 'Unified'], ['split', 'Split']] as [value, label] (value)}
			<ToggleGroup.Item
				{value}
				class="data-[state=on]:bg-background data-[state=on]:inset-ring data-[state=on]:inset-ring-border-strong max-md:min-w-11">{label}</ToggleGroup.Item
			>
		{/each}
	</ToggleGroup.Root>
	<div class="flex max-w-6xl flex-col gap-8">
		<div class="flex min-w-0 flex-col gap-2" data-diff-case="code">
			<h3 id="diff-retry" class="flex flex-wrap gap-x-2 text-xs font-semibold text-muted-foreground">
				<span class="font-mono font-normal text-foreground">src/upload/retry.ts</span>
				<span class="font-normal tabular-nums">+7 −3<span class="sr-only">: 7 lines added, 3 lines removed</span></span>
			</h3>
			<Diff lines={retry} {view} complete oldName="main, commit 4e1a9c2" newName="part-retry" aria-labelledby="diff-retry" />
		</div>
		<div class="flex min-w-0 flex-col gap-2" data-diff-case="hunks">
			<h3 id="diff-client" class="flex flex-wrap gap-x-2 text-xs font-semibold text-muted-foreground">
				<span class="font-mono font-normal text-foreground">src/upload/client.ts</span>
				<span class="font-normal tabular-nums">+3 −2<span class="sr-only">: 3 lines added, 2 lines removed</span></span>
			</h3>
			<Diff lines={hunks} {view} oldName="commit 9c41d7e" newName="commit 2b07e18" aria-labelledby="diff-client" />
		</div>
		<div class="flex min-w-0 flex-col gap-2" data-diff-case="text">
			<h3 id="diff-spec" class="text-xs font-semibold text-muted-foreground">The upload spec, changes from version 2</h3>
			<Diff kind="text" lines={prose} {view} complete oldName="Version 2, approved" newName="Version 3, draft" aria-labelledby="diff-spec" class="max-w-180" />
		</div>
	</div>
</section>
