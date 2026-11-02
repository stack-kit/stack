<script lang="ts">
	import * as Table from '#lib/components/ui/table/index.js';
	import { colors, typography, spacing, rounded } from '#lib/preview/design.js';

	// A swatch paints var(--name), so it follows the theme and mode switch. The value columns
	// are the front matter of DESIGN.md, which is the default theme.
</script>

<svelte:head>
	<title>Tokens</title>
</svelte:head>

<h1 class="mb-1 text-xl font-semibold">Tokens</h1>
<p class="mb-6 text-sm text-muted-foreground">
	The values come from the front matter of DESIGN.md. Each swatch paints the variable of the
	theme and mode that the switch selects.
</p>

<section class="mb-10" aria-labelledby="colors">
	<h2 id="colors" class="mb-2 text-base font-semibold">Colors</h2>
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Swatch</Table.Head>
				<Table.Head>Name</Table.Head>
				<Table.Head>Light</Table.Head>
				<Table.Head>Dark</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each Object.entries(colors.light) as [name, value] (name)}
				<Table.Row>
					<Table.Cell>
						<span
							class="block size-6 rounded-sm border border-border"
							style:background={`var(--${name})`}
						></span>
					</Table.Cell>
					<Table.Cell class="font-mono text-xs">{name}</Table.Cell>
					<Table.Cell class="font-mono text-xs">{value}</Table.Cell>
					<Table.Cell class="font-mono text-xs">{colors.dark[name]}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</section>

<section class="mb-10" aria-labelledby="typography">
	<h2 id="typography" class="mb-2 text-base font-semibold">Typography</h2>
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Name</Table.Head>
				<Table.Head>Sample</Table.Head>
				<Table.Head>Size / line</Table.Head>
				<Table.Head>Weight</Table.Head>
				<Table.Head>Tracking</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each Object.entries(typography) as [name, t] (name)}
				<Table.Row>
					<Table.Cell class="font-mono text-xs">{name}</Table.Cell>
					<Table.Cell>
						<span
							style:font-family={t.fontFamily}
							style:font-size={t.fontSize}
							style:font-weight={t.fontWeight}
							style:line-height={t.lineHeight}
							style:letter-spacing={t.letterSpacing}>The quick brown fox, 0123456789</span
						>
					</Table.Cell>
					<Table.Cell class="font-mono text-xs">{t.fontSize} / {t.lineHeight}</Table.Cell>
					<Table.Cell class="font-mono text-xs">{t.fontWeight}</Table.Cell>
					<Table.Cell class="font-mono text-xs">{t.letterSpacing ?? ''}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</section>

<section class="mb-10" aria-labelledby="spacing">
	<h2 id="spacing" class="mb-2 text-base font-semibold">Spacing</h2>
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Name</Table.Head>
				<Table.Head>Value</Table.Head>
				<Table.Head class="w-full">Length</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each Object.entries(spacing) as [name, value] (name)}
				<Table.Row>
					<Table.Cell class="font-mono text-xs">{name}</Table.Cell>
					<Table.Cell class="font-mono text-xs">{value}</Table.Cell>
					<Table.Cell>
						<span class="block h-3 max-w-full bg-primary" style:width={value}></span>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</section>

<section class="mb-10" aria-labelledby="rounded">
	<h2 id="rounded" class="mb-2 text-base font-semibold">Rounded</h2>
	<div class="flex flex-wrap gap-6">
		{#each Object.entries(rounded) as [name, value] (name)}
			<figure class="flex flex-col items-center gap-2">
				<span
					class="block size-16 border border-border-strong bg-muted"
					style:border-radius={value}
				></span>
				<figcaption class="font-mono text-xs">{name} {value}</figcaption>
			</figure>
		{/each}
	</div>
</section>
