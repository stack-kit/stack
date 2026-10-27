<script lang="ts">
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import { html, text, SANS } from '#lib/email/email.js';
	import { emailColors } from '#lib/email/design.js';
	import { checkTemplate } from '#lib/email/guard.js';
	import { KINDS } from '#lib/email/samples.js';
	import { view } from '#lib/stack/view.svelte.js';

	// The template of "## Email" in DESIGN.md and email.ts must agree, as the component menu and
	// the showcases must agree on the component page.
	checkTemplate();

	const WIDTHS = [600, 375];
	// Inter shows only where the device has it installed, so the second face is the stack without
	// the two Inter names: the system face of a device with no Inter.
	const SYSTEM = SANS.replace("'Inter Variable', Inter, ", '');

	let face = $state('stack');
	let client = $state('as-sent');

	const colors = $derived(emailColors[view.theme]);
	const rendered = $derived(
		colors
			? KINDS.map((k) => {
					const doc = html(k.email, colors);
					return { ...k, html: face === 'system' ? doc.replaceAll(SANS, SYSTEM) : doc, text: text(k.email) };
				})
			: []
	);

	/** A frame takes the height of its email, so that the page shows the whole email. */
	function fit(event: Event) {
		const frame = event.currentTarget as HTMLIFrameElement;
		const doc = frame.contentDocument;
		if (doc) frame.style.height = `${doc.documentElement.scrollHeight}px`;
	}
</script>

<svelte:head>
	<title>Email</title>
</svelte:head>

<h1 class="mb-1 text-xl font-semibold">Email</h1>
<p class="mb-4 max-w-180 text-sm text-muted-foreground">
	The four content kinds of <code class="font-mono">## Email</code>, each at 600 px and at 375 px,
	with its plain text part. An email has light values only, so it takes the light values of the
	theme that the switch selects. The dark mode button changes this page and never the email.
</p>

<div class="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
	<div class="flex items-center gap-2">
		<span id="face-label">Face</span>
		<ToggleGroup.Root
			type="single"
			variant="outline"
			size="sm"
			value={face}
			onValueChange={(v) => {
				if (v) face = v;
			}}
			aria-labelledby="face-label"
		>
			<ToggleGroup.Item value="stack">Inter, where it is installed</ToggleGroup.Item>
			<ToggleGroup.Item value="system">The system face</ToggleGroup.Item>
		</ToggleGroup.Root>
	</div>
	<div class="flex items-center gap-2">
		<span id="client-label">Client</span>
		<ToggleGroup.Root
			type="single"
			variant="outline"
			size="sm"
			value={client}
			onValueChange={(v) => {
				if (v) client = v;
			}}
			aria-labelledby="client-label"
		>
			<ToggleGroup.Item value="as-sent">As sent</ToggleGroup.Item>
			<ToggleGroup.Item value="inverted">Every color inverted</ToggleGroup.Item>
		</ToggleGroup.Root>
	</div>
</div>

{#if !colors}
	<p class="text-sm text-destructive">
		"### Email colors" in DESIGN.md has no column for the theme {view.theme}.
	</p>
{/if}

{#each rendered as kind (kind.id)}
	<section class="mb-12 border-t border-border pt-6" aria-labelledby="kind-{kind.id}" data-email-kind={kind.id}>
		<h2 id="kind-{kind.id}" class="mb-3 text-base font-semibold">{kind.title}</h2>
		<!-- The row of an inbox list: the sender, the subject and the preheader. -->
		<p class="mb-4 flex max-w-150 items-baseline gap-2 rounded-lg border border-border px-3 py-2 text-sm">
			<span class="shrink-0 font-semibold">{kind.email.product}</span>
			<span class="min-w-0 truncate">
				<span class="font-medium">{kind.email.subject}</span>
				<span class="text-muted-foreground"> · {kind.email.preheader}</span>
			</span>
		</p>
		<div class="flex flex-wrap items-start gap-6">
			{#each WIDTHS as width (width)}
				<figure class="flex min-w-0 flex-col gap-1.5">
					<figcaption class="text-xs text-muted-foreground">{width} px</figcaption>
					<!-- The frame keeps its width, so the email inside keeps the layout of that width.
					     On a narrower screen the frame scrolls inside this box, and the page keeps the
					     width of the screen ("Page width" in ### Width bands of DESIGN.md). -->
					<div class="max-w-full overflow-x-auto">
						<iframe
							title="{kind.title}, {width} px wide"
							srcdoc={kind.html}
							{width}
							class="block box-content border border-border"
							class:invert-colors={client === 'inverted'}
							onload={fit}
						></iframe>
					</div>
				</figure>
			{/each}
			<figure class="flex w-93.75 max-w-full min-w-0 flex-col gap-1.5">
				<figcaption class="text-xs text-muted-foreground">The plain text part</figcaption>
				<!-- The full address of a link is one word, and pre-wrap breaks a line only at a space,
				     so the address breaks inside the word (wrap-break-word). -->
				<pre class="border border-border p-4 font-sans text-sm whitespace-pre-wrap wrap-break-word">{kind.text}</pre>
			</figure>
		</div>
	</section>
{/each}

<style>
	/* A model of a client that inverts every color, as some clients do in dark mode. It is not a
	   client: each client darkens in its own way. */
	.invert-colors {
		filter: invert(1) hue-rotate(180deg);
	}
</style>
