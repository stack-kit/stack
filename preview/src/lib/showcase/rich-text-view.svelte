<script lang="ts">
	import RichTextView from '#lib/stack/RichTextView.svelte';

	// A stored note from a field with the full preset, and three stored comments from a field with the
	// simple preset. The view cleans each one with the load list, so the script and the handler below never
	// run. Every note, comment and person is invented.
	const note = [
		'<h2>Delivery update</h2>',
		'<div>The new shelves arrive on <b>Thursday</b>, and the team installs them the same day.</div>',
		'<ul><li>Two shelving units</li><li>One <span class="color" style="color:#b91c1c">spare</span> bracket set</li></ul>',
		'<blockquote><div>Use the loading dock at the back.</div></blockquote>',
		'<div><span class="highlight" style="background-color:#fef08a">Parking is free on site.</span> See the <a href="https://example.com/site-map">site map</a>.</div>',
		'<div><img src="x" onerror="alert(1)"><script>alert(1)<\/script>Kind regards, Sam</div>'
	].join('');

	const comments = [
		{ who: 'Morgan Lee', html: '<div>The shelves look good. Can we move the <b>second unit</b> closer to the window, so that the light reaches the back of the room?</div><div>The bracket set can stay where it is.</div>' },
		{ who: 'Riley Shaw', html: '<div><i>Confirmed</i> for Thursday.</div>' },
		{ who: 'Jordan Hale', html: '<div>I checked the plan of the room again. The width of the wall by the door is 240 cm, so both units fit side by side, with room for the door to open.</div>' }
	];
</script>

<section id="showcase-rich-text-view" data-showcase="rich-text-view" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">rich-text-view</h2>
	<div class="flex max-w-4xl flex-col gap-8">
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-semibold text-muted-foreground">A stored note, full preset</h3>
			<RichTextView html={note} class="max-w-3xl" />
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-semibold text-muted-foreground">Stored comments in a list, simple preset, two lines</h3>
			<ul class="flex max-w-xl flex-col divide-y divide-border rounded-lg border border-border">
				{#each comments as c (c.who)}
					<li class="flex flex-col gap-1 px-3 py-2.5">
						<span class="text-xs font-semibold">{c.who}</span>
						<RichTextView html={c.html} preset="simple" lines={2} />
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>
