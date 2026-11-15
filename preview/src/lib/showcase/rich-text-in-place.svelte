<script lang="ts">
	import { Switch } from '#lib/components/ui/switch/index.js';
	import RichTextInPlace from '#lib/stack/RichTextInPlace.svelte';
	import type { OnFailure } from '#lib/stack/rich-text.js';

	// A stored description, a stored note of a table row and an empty note. Each save stores the HTML after a
	// time, as a server does, and gives it back as html. Every record and person is invented.
	let description = $state(
		[
			'<div>The storage room on the second floor gets <b>two new shelving units</b> on Thursday.</div>',
			'<ul><li>Use the loading dock at the back.</li><li>Parking is free on site.</li></ul>',
			'<div>See the <a href="https://example.com/site-map">site map</a> for the way in.</div>'
		].join('')
	);
	let rows = $state([
		{ id: 'r1', who: 'Morgan Lee', note: '<div>Call back about the <i>second unit</i>.</div>' },
		{ id: 'r2', who: 'Riley Shaw', note: '' },
		{ id: 'r3', who: 'Jordan Hale', note: '<div>Confirmed for Thursday.</div>' }
	]);
	let bare = $state('<div>A text with no toolbar. Select words for the bar over them, or press Cmd+B.</div>');
	let failNext = $state(false);
	let dirty = $state(false);

	const store = (ms: number, put: (html: string) => void) => (html: string) =>
		new Promise<void>((resolve, reject) =>
			setTimeout(() => {
				if (failNext) {
					failNext = false;
					return reject(new Error('The server did not answer.'));
				}
				put(html);
				resolve();
			}, ms)
		);
	const onfailure: OnFailure = (f) => (f.kind === 'save' ? 'The text is not saved. Press Save to try again.' : undefined);
</script>

<section id="showcase-rich-text-in-place" data-showcase="rich-text-in-place" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">rich-text-in-place</h2>
	<div class="flex max-w-3xl flex-col gap-8">
		<div class="flex flex-col gap-2">
			<h3 id="showcase-in-place-description" class="text-xs font-semibold text-muted-foreground">Description, full preset</h3>
			<RichTextInPlace html={description} bind:dirty aria-labelledby="showcase-in-place-description" onsave={store(800, (h) => (description = h))} {onfailure} />
			<div class="flex items-center gap-2 text-xs text-muted-foreground">
				<Switch id="showcase-in-place-fail" bind:checked={failNext} />
				<label for="showcase-in-place-fail">The next save fails</label>
				<span class="ml-auto">dirty: {dirty}</span>
			</div>
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-semibold text-muted-foreground">Notes in the rows of a table, simple preset</h3>
			<ul class="flex flex-col divide-y divide-border rounded-lg border border-border">
				{#each rows as r, i (r.id)}
					<li class="flex flex-col gap-1 px-3 py-2.5">
						<span id="showcase-in-place-{r.id}" class="text-xs font-semibold">{r.who}</span>
						<RichTextInPlace html={r.note} preset="simple" empty="No note" aria-labelledby="showcase-in-place-{r.id}" onsave={store(500, (h) => (rows[i] = { ...r, note: h }))} />
					</li>
				{/each}
			</ul>
		</div>
		<div class="flex flex-col gap-2">
			<h3 id="showcase-in-place-bare" class="text-xs font-semibold text-muted-foreground">No toolbar</h3>
			<RichTextInPlace html={bare} toolbar="none" aria-labelledby="showcase-in-place-bare" onsave={store(500, (h) => (bare = h))} />
		</div>
		<div class="flex flex-col gap-2">
			<h3 id="showcase-in-place-readonly" class="text-xs font-semibold text-muted-foreground">Read-only</h3>
			<RichTextInPlace html={description} readonly aria-labelledby="showcase-in-place-readonly" onsave={async () => {}} />
		</div>
	</div>
</section>
