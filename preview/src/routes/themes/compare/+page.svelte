<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Checkbox } from '#lib/components/ui/checkbox/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import { front } from '#lib/preview/design.js';
	import { view } from '#lib/preview/view.svelte.js';
	import { generate, compare, withCharts, formatOklch, STEPS, THEME_INPUTS } from '../../../../../scripts/lib/generate.mjs';

	// The generator of scripts/generate.mjs runs here in the browser, on the same rules and the same
	// pairs, so this page shows the values that the command writes. Each pane sets every color role
	// as a custom property, so the components in it take its values. The theme switch of the top bar
	// does not reach the panes, and the dark mode button does.
	type Block = Map<string, string>;
	type Theme = { root: Block; dark: Block };
	type Inputs = { base: string; accent: string; contrast: number; charts?: string };

	/** The two blocks of a theme file. The page reads the text and never loads the file as a style sheet. */
	function readTheme(css: string): Theme {
		const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
		const block = (selector: string): Block => {
			const body = new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(text)?.[1] ?? '';
			return new Map([...body.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
		};
		return { root: block(':root'), dark: block('\\.dark') };
	}

	const files = import.meta.glob<string>('../../../../../themes/*.css', { query: '?raw', import: 'default', eager: true });
	const themes = new Map(Object.entries(files).map(([path, css]) => [path.slice(path.lastIndexOf('/') + 1, -'.css'.length), readTheme(css)]));

	// The inputs of each theme: theme-inputs of the front matter for default, and the inputs that
	// "## Themes" gives for graphite, with its own chart colors.
	const presets: Record<string, Inputs> = { default: front['theme-inputs'] as Inputs, ...THEME_INPUTS };
	const names = [...themes.keys()].filter((n) => presets[n]);

	let name = $state('graphite');
	let base = $state(presets.graphite.base);
	let accent = $state(presets.graphite.accent);
	let contrast = $state(presets.graphite.contrast);
	let chartSet = $state(presets.graphite.charts ?? 'default');

	function pick(n: string) {
		name = n;
		({ base, accent, contrast } = presets[n]);
		chartSet = presets[n].charts ?? 'default';
	}

	// The chart colors of default are the colors of the front matter, as in the command.
	const source = $derived(chartSet === 'default' ? front : withCharts(front, themes.get(chartSet) as Theme, `themes/${chartSet}.css`));

	const result = $derived.by(() => {
		try {
			return { g: generate({ base, accent, contrast }, source), error: '' };
		} catch (e) {
			return { g: null, error: e instanceof Error ? e.message : String(e) };
		}
	});
	const mode = $derived(view.dark ? 'dark' : 'light');
	const current = $derived(themes.get(name) as Theme);
	const generated = $derived(result.g ? { root: result.g.light, dark: result.g.dark } : null);

	/** The values of one mode: the dark block over the light block, as the browser reads them. */
	const values = (t: Theme) => (mode === 'light' ? t.root : new Map([...t.root, ...t.dark]));
	const style = (t: Theme) => [...values(t)].map(([n, v]) => `--${n}: ${v}`).join('; ');
	const rows = $derived(generated ? compare(current, generated).filter((r) => r.mode === mode) : []);
	const differs = (r: { dl: number; dc: number; dh: number | null; da: number }) => Math.abs(r.dl) >= 0.02 || Math.abs(r.dc) >= 0.02 || (r.dh !== null && Math.abs(r.dh) >= 5) || Math.abs(r.da) >= 0.05;
	const scale = $derived(result.g ? result.g.scales[mode] : null);
	const strips = $derived(scale ? [{ label: 'base', steps: scale.base }, { label: 'accent', steps: scale.accent }] : []);

	// Each class is written out, so that Tailwind finds it.
	const charts = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-chart-6', 'bg-chart-7', 'bg-chart-8', 'bg-chart-ink', 'bg-chart-heat'];
	const tags = ['bg-tag-grey', 'bg-tag-blue', 'bg-tag-violet', 'bg-tag-pink', 'bg-tag-red', 'bg-tag-orange', 'bg-tag-yellow', 'bg-tag-green'];
	const states = [
		{ label: 'Running', tint: 'border-success/35 bg-success/10 text-success' },
		{ label: 'Waiting', tint: 'border-warning/35 bg-warning/10 text-warning' },
		{ label: 'Note', tint: 'border-info/35 bg-info/10 text-info' }
	];
</script>

<svelte:head>
	<title>Generated theme</title>
</svelte:head>

<h1 class="mb-1 text-xl font-semibold">Generated theme</h1>
<p class="mb-6 max-w-3xl text-sm text-muted-foreground">
	The left pane shows a theme file of this repository. The right pane shows the theme that the generator
	writes from the inputs below, with the command <code class="font-mono">npm run generate</code>. Change an
	input to see a new theme. The dark mode button of the top bar changes both panes.
</p>

<form class="mb-6 flex flex-wrap items-end gap-4" onsubmit={(e) => e.preventDefault()}>
	<label class="flex flex-col gap-1 text-sm">
		Compare with
		<select
			id="compare-theme"
			class="h-8 rounded-lg border border-input bg-background px-2"
			value={name}
			onchange={(e) => pick(e.currentTarget.value)}
		>
			{#each names as n (n)}
				<option value={n}>{n}</option>
			{/each}
		</select>
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Base color
		<Input id="input-base" class="w-64 font-mono" bind:value={base} />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Accent color
		<Input id="input-accent" class="w-64 font-mono" bind:value={accent} />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Contrast level, 0 to 100
		<Input id="input-contrast" class="w-24" type="number" min="0" max="100" bind:value={contrast} />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Chart colors
		<select id="input-charts" class="h-8 rounded-lg border border-input bg-background px-2" bind:value={chartSet}>
			{#each [...themes.keys()] as n (n)}
				<option value={n}>{n}</option>
			{/each}
		</select>
	</label>
</form>

{#if result.error}
	<p class="mb-6 text-sm text-destructive" role="alert">The generator stops: {result.error}</p>
{:else if result.g && result.g.problems.length}
	<ul class="mb-6 text-sm text-destructive" role="alert">
		{#each result.g.problems as p (p)}
			<li>{p}</li>
		{/each}
	</ul>
{/if}

{#snippet sample(title: string)}
	<div class="flex min-h-[30rem] text-sm">
		<nav aria-label="{title}: sidebar" class="w-40 shrink-0 border-r border-sidebar-border bg-sidebar p-2 text-sidebar-foreground">
			<p class="px-2 py-1 text-xs text-sidebar-foreground/70">Workspace</p>
			<span class="block rounded-md bg-sidebar-accent px-2 py-1 text-sidebar-accent-foreground">Inbox</span>
			<span class="flex justify-between rounded-md px-2 py-1">Invoices <span class="text-muted-foreground">12</span></span>
			<span class="block rounded-md px-2 py-1">Settings</span>
		</nav>
		<div class="flex min-w-0 grow flex-col gap-4 p-4">
			<p class="text-base font-semibold text-strong-foreground">{title}</p>
			<div class="flex flex-col gap-1">
				<p>Body text in the text color, with <a href="#compare-theme" class="text-link underline">a link</a> in it.</p>
				<p class="text-muted-foreground">Muted text: a label, a description, a time.</p>
				<p class="text-faint-foreground">Faint text: the time of the last save.</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<Button size="sm">Save</Button>
				<Button size="sm" variant="secondary">Secondary</Button>
				<Button size="sm" variant="outline">Outline</Button>
				<Button size="sm" variant="ghost">Ghost</Button>
				<Button size="sm" variant="destructive">Delete</Button>
			</div>
			<div class="flex items-center gap-3">
				<Input class="max-w-44" placeholder="Search" aria-label="{title}: search" />
				<Checkbox checked aria-label="{title}: a check box that is checked" />
				<Switch checked aria-label="{title}: a switch that is on" />
			</div>
			<ul class="overflow-hidden rounded-md border border-border">
				<li class="flex justify-between border-b border-border-faint bg-selected px-3 py-1.5 text-selected-foreground">A selected row <span class="text-muted-foreground">09:40</span></li>
				<li class="flex justify-between border-b border-border-faint bg-muted/50 px-3 py-1.5">A row under the pointer <span class="text-muted-foreground">09:12</span></li>
				<li class="flex justify-between px-3 py-1.5">A row <span class="text-warning">Due today</span></li>
			</ul>
			<div class="flex flex-wrap items-center gap-2">
				{#each states as s (s.label)}
					<Badge variant="outline" class={s.tint}>{s.label}</Badge>
				{/each}
				<Badge variant="destructive">Failed</Badge>
				{#each tags as t (t)}
					<span class="size-2 rounded-full {t}" aria-hidden="true"></span>
				{/each}
			</div>
			<div class="grid grid-cols-2 gap-3">
				<Card.Root size="sm">
					<Card.Header>
						<Card.Title>A card</Card.Title>
						<Card.Description>Its ground is the card role.</Card.Description>
					</Card.Header>
				</Card.Root>
				<div class="rounded-lg bg-popover p-3 text-popover-foreground shadow-md ring-1 ring-foreground/10">
					<p class="font-medium">A menu</p>
					<p class="text-muted-foreground">Its ground is the popover role.</p>
				</div>
			</div>
			<div class="flex gap-1" aria-hidden="true">
				{#each charts as c (c)}
					<span class="h-6 grow rounded-sm {c}"></span>
				{/each}
			</div>
			<div class="overflow-hidden rounded-md bg-muted font-mono text-xs">
				<p class="bg-diff-added/10 px-3 py-1">+ an added line</p>
				<p class="bg-diff-removed/10 px-3 py-1">- a removed line</p>
			</div>
		</div>
	</div>
{/snippet}

<div class="mb-10 grid gap-4 xl:grid-cols-2">
	<section aria-label="The current theme" class="overflow-hidden rounded-lg border border-border bg-background text-foreground" style={style(current)}>
		{@render sample(`Current: ${name}`)}
	</section>
	{#if generated}
		<section aria-label="The generated theme" class="overflow-hidden rounded-lg border border-border bg-background text-foreground" style={style(generated)}>
			{@render sample('Generated')}
		</section>
	{/if}
</div>

{#if scale}
	<section class="mb-10" aria-labelledby="scales">
		<h2 id="scales" class="mb-2 text-base font-semibold">The scales of the generated theme, {mode}</h2>
		<p class="mb-3 max-w-3xl text-sm text-muted-foreground">
			Each step of the base scale has one role. The accent scale sets only the two steps that carry a role: 300 for a
			selected row and 700 for the primary fill.
		</p>
		<div class="flex flex-col gap-3">
			{#each strips as strip (strip.label)}
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div class="flex items-start gap-1 overflow-x-auto" tabindex="0" role="region" aria-label="The {strip.label} scale">
					<span class="w-14 shrink-0 pt-2 text-xs text-muted-foreground">{strip.label}</span>
					{#each STEPS as step, i (step)}
						{@const o = strip.steps[i]}
						<span class="flex grow basis-0 flex-col gap-1 font-mono text-[10px] text-muted-foreground">
							<span class="h-8 rounded-sm border border-border-faint" style:background={o ? formatOklch(o) : 'transparent'}></span>
							{step}{#if o}<span>L {o.l.toFixed(3)}</span>{/if}
						</span>
					{/each}
				</div>
			{/each}
		</div>
	</section>
{/if}

{#if result.g && result.g.lifts.length}
	<section class="mb-10" aria-labelledby="lifts">
		<h2 id="lifts" class="mb-2 text-base font-semibold">The lifts</h2>
		<p class="mb-3 max-w-3xl text-sm text-muted-foreground">The generator moved the lightness of these values until each pair passed its minimum.</p>
		<ul class="flex flex-col gap-1 font-mono text-xs">
			{#each result.g.lifts as l (`${l.mode} ${l.role}`)}
				<li>{l.mode} {l.role}: {l.from} to {l.to}, for {l.pairs.join('; ')}</li>
			{/each}
		</ul>
	</section>
{/if}

<section class="mb-10" aria-labelledby="deltas">
	<h2 id="deltas" class="mb-2 text-base font-semibold">Each role, {mode}</h2>
	<p class="mb-3 max-w-3xl text-sm text-muted-foreground">
		The difference is the generated value minus the value of {name}. A row in bold differs by 0.02 or more in L or C,
		by 5 or more degrees of hue, or by 0.05 or more in alpha (A). A gray has no hue, so its hue difference is empty.
	</p>
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Role</Table.Head>
				<Table.Head>{name}</Table.Head>
				<Table.Head>Generated</Table.Head>
				<Table.Head>L</Table.Head>
				<Table.Head>C</Table.Head>
				<Table.Head>h</Table.Head>
				<Table.Head>A</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each rows as r (r.role)}
				<Table.Row class={differs(r) ? 'font-semibold' : ''}>
					<Table.Cell class="font-mono text-xs">{r.role}</Table.Cell>
					<Table.Cell class="font-mono text-xs">
						<span class="mr-2 inline-block size-3 rounded-sm border border-border align-middle" style:background={r.from}></span>{r.from}
					</Table.Cell>
					<Table.Cell class="font-mono text-xs">
						<span class="mr-2 inline-block size-3 rounded-sm border border-border align-middle" style:background={r.to}></span>{r.to}
					</Table.Cell>
					<Table.Cell class="font-mono text-xs tabular-nums">{r.dl}</Table.Cell>
					<Table.Cell class="font-mono text-xs tabular-nums">{r.dc}</Table.Cell>
					<Table.Cell class="font-mono text-xs tabular-nums">{r.dh ?? ''}</Table.Cell>
					<Table.Cell class="font-mono text-xs tabular-nums">{r.da}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</section>
