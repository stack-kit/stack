<!--
	The sample report of "## Print" in DESIGN.md, rendered with the css block of "### Print template"
	as it stands. On the screen the document shows as a sheet of the paper size, with the margins as
	its padding. In print the sheet takes no width and no padding, the margins of @page apply, and the
	top bar and the controls of this page do not print. ?paper=letter adds "@page { size: letter; }"
	after the block, as a product does for Letter.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import { printCss } from '#lib/print/design.js';
	import { report } from '#lib/print/report.js';
	import ReportChart from '#lib/print/ReportChart.svelte';

	const paper = $derived(page.url.searchParams.get('paper') === 'letter' ? 'letter' : 'a4');
	const css = $derived(paper === 'letter' ? `${printCss}\n@page { size: letter; }` : printCss);
	const summary = $derived(
		`${report.title}, the amount invoiced by service: ${report.byService.map((s) => `${s.label} ${report.wholeMoney(s.value)}`).join(', ')}.`
	);
</script>

<svelte:head>
	<title>{report.title}</title>
	{@html `<style id="print-template">${css}</style>`}
</svelte:head>

<section aria-label="Sample report" class="mb-6 flex max-w-180 flex-col gap-3 text-sm print:hidden">
	<p class="text-muted-foreground">
		The sample report of <code class="font-mono">## Print</code>, rendered with the CSS of
		<code class="font-mono">### Print template</code> as it stands. Print this page, or save it as a PDF,
		to see the head and the foot of each page and the head of the table on each page. The document keeps
		its print colors in both modes.
	</p>
	<div class="flex items-center gap-2">
		<span id="paper-label">Paper</span>
		<ToggleGroup.Root
			type="single"
			variant="outline"
			size="sm"
			value={paper}
			onValueChange={(v) => {
				if (v) goto(v === 'letter' ? '?paper=letter' : '?', { replace: true, reset: false });
			}}
			aria-labelledby="paper-label"
		>
			<ToggleGroup.Item value="a4">A4</ToggleGroup.Item>
			<ToggleGroup.Item value="letter">Letter</ToggleGroup.Item>
		</ToggleGroup.Root>
	</div>
</section>

<div class="overflow-x-auto print:overflow-visible">
	<main class="document sheet" class:letter={paper === 'letter'} data-paper={paper}>
		<header>
			<p class="doc-issuer">{report.issuer.name}</p>
			<p class="doc-note">{report.issuer.address}</p>
			<h1 class="doc-title">{report.title}</h1>
			<dl class="doc-facts">
				{#each report.facts as fact (fact.label)}
					<dt>{fact.label}</dt>
					<dd class:doc-id={fact.id}>{fact.value}</dd>
				{/each}
			</dl>
		</header>

		<section aria-labelledby="summary">
			<h2 id="summary" class="doc-section">Summary</h2>
			<div class="doc-figures">
				{#each report.figures as f (f.label)}
					<div>
						<p class="doc-note">{f.label}</p>
						<p class="doc-figure">{f.value}</p>
						<p class="doc-note">{f.change}</p>
					</div>
				{/each}
			</div>
		</section>

		<section aria-labelledby="by-service">
			<h2 id="by-service" class="doc-section">Amount by service</h2>
			<ReportChart
				title="The amount invoiced for each service in October 2026, with VAT"
				{summary}
				categories={report.byService}
				format={report.wholeMoney}
			/>
		</section>

		<section aria-labelledby="invoices">
			<h2 id="invoices" class="doc-section">Invoices</h2>
			<table class="doc-table">
				<thead>
					<tr>
						<th scope="col">Invoice</th>
						<th scope="col">Client</th>
						<th scope="col">Service</th>
						<th scope="col">Issued</th>
						<th scope="col">Due</th>
						<th scope="col">Status</th>
						<th scope="col" class="doc-number">Amount</th>
					</tr>
				</thead>
				<tbody>
					{#each report.invoices as inv (inv.digits)}
						<tr>
							<td class="doc-id">{inv.prefix}<span class="doc-tabular">{inv.digits}</span></td>
							<td>{inv.client}</td>
							<td>{inv.service}</td>
							<td class="doc-tabular">{inv.issued}</td>
							<td class="doc-tabular">{inv.due}</td>
							<td>{inv.status}</td>
							<td class="doc-number">{report.money(inv.amount)}</td>
						</tr>
					{/each}
				</tbody>
				<tbody class="doc-totals">
					{#each report.totals as t, i (t.label)}
						<tr class:doc-total={i === report.totals.length - 1}>
							<th scope="row" colspan="6">{t.label}</th>
							<td class="doc-number">{t.amount}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="doc-note">Amounts in euros, with VAT. An invoice is due 15 days after its date of issue.</p>
		</section>
	</main>
</div>

<style>
	/* The sheet on the screen: the paper size, with the margins of @page as its padding. */
	.sheet {
		box-sizing: border-box;
		width: 210mm;
		padding: 20mm 18mm;
		border: 1px solid var(--border);
	}
	.sheet.letter {
		width: 215.9mm;
	}
	@media print {
		.sheet,
		.sheet.letter {
			width: auto;
			padding: 0;
			border: 0;
		}
	}
</style>
