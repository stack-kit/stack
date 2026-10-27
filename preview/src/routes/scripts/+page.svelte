<script lang="ts">
	import { Input } from '#lib/components/ui/input/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import CodeBlock from '#lib/stack/CodeBlock.svelte';

	// The text of each script that Inter does not cover, and of three that it covers, at the type
	// steps, as "### Other scripts" in DESIGN.md measures them. Each sentence says the same thing:
	// the invoice went to the client. Every name on this page is invented.
	const SCRIPTS: { name: string; lang: string; dir: 'ltr' | 'rtl'; text: string }[] = [
		{ name: 'Latin', lang: 'en', dir: 'ltr', text: 'The invoice went to the client.' },
		{ name: 'Cyrillic', lang: 'bg', dir: 'ltr', text: 'Фактурата е изпратена на клиента.' },
		{ name: 'Greek', lang: 'el', dir: 'ltr', text: 'Το τιμολόγιο στάλθηκε στον πελάτη.' },
		{ name: 'Arabic', lang: 'ar', dir: 'rtl', text: 'تم إرسال الفاتورة إلى العميل.' },
		{ name: 'Hebrew', lang: 'he', dir: 'rtl', text: 'החשבונית נשלחה ללקוח.' },
		{ name: 'Devanagari', lang: 'hi', dir: 'ltr', text: 'चालान ग्राहक को भेज दिया गया।' },
		{ name: 'Thai', lang: 'th', dir: 'ltr', text: 'ส่งใบแจ้งหนี้ให้ลูกค้าแล้ว' },
		{ name: 'Chinese, simplified', lang: 'zh-Hans', dir: 'ltr', text: '发票已发送给客户。' },
		{ name: 'Chinese, traditional', lang: 'zh-Hant', dir: 'ltr', text: '發票已發送給客戶。' },
		{ name: 'Japanese', lang: 'ja', dir: 'ltr', text: '請求書を顧客に送信しました。' },
		{ name: 'Korean', lang: 'ko', dir: 'ltr', text: '청구서를 고객에게 보냈습니다.' }
	];
	const STEPS = [
		{ name: 'meta', cls: 'text-2xs' },
		{ name: 'small', cls: 'text-xs' },
		{ name: 'body', cls: 'text-sm' },
		{ name: 'reading', cls: 'text-md' },
		{ name: 'code', cls: 'font-mono text-xs' }
	];
	// The same three Han characters take another face in each language.
	const HAN = ['zh-Hans', 'zh-Hant', 'ja', 'ko'];
	const MIXED = 'Sent to تم إرسال and 发票已发送 and चालान भेजा and ส่งใบแจ้งหนี้ by Ana';
	const THAI = 'ส่งใบแจ้งหนี้ให้ลูกค้าแล้ว ที่นี่ ส่งใบแจ้งหนี้';

	// Content in another language: the names of a client list, each in its own script.
	const CLIENTS = [
		{ name: 'Lena Müller', lang: 'de', count: 2, title: 'Angebot für den Frühjahrskatalog und die Druckauflage' },
		{ name: 'سلمى حداد', lang: 'ar', count: 3, title: 'عرض سعر لكتالوج الربيع وطباعة النسخ' },
		{ name: 'נועה לוי', lang: 'he', count: 1, title: 'הצעת מחיר לקטלוג האביב ולהדפסה' },
		{ name: 'अनु शर्मा', lang: 'hi', count: 4, title: 'वसंत सूची और छपाई के लिए प्रस्ताव' },
		{ name: 'สมชาย ใจดี', lang: 'th', count: 1, title: 'ใบเสนอราคาสำหรับแคตตาล็อกฤดูใบไม้ผลิ' },
		{ name: '森田葵', lang: 'ja', count: 2, title: '春のカタログと印刷部数の見積もり' }
	];
	const NAME = 'سلمى حداد';

	// Sort and search, as "### Sorting and search" in architecture/web-app.md gives them: the
	// collator of the interface, and the fold that removes the accents of U+0300 to U+036F and
	// the marks of Arabic and Hebrew only, changes the text to lower case, and then replaces ß,
	// ł, ø and the d with a stroke (U+0111, written as 0x111), which NFD does not split.
	const collator = new Intl.Collator('en-GB');
	const sorted = [...CLIENTS.map((c) => c.name), 'Änne Vogel', 'Émile Faure', 'Борис Стоянов', 'Ζωή Παππά', '김민준', '陈小明'].sort(collator.compare);
	const fold = (s: string) =>
		s
			.normalize('NFD')
			.replace(/[\u0300-\u036f]|(?=[\p{scx=Arabic}\p{scx=Hebrew}])\p{M}/gu, '')
			.toLowerCase()
			.replace(/ß/g, 'ss')
			.replace(/ł/g, 'l')
			.replace(/ø/g, 'o')
			.replaceAll(String.fromCodePoint(0x111), 'd');
	const PAIRS = [
		{ query: 'muller', text: 'Müller', note: 'the same name' },
		{ query: 'strasse', text: 'Straße', note: 'the same word, with ß as ss' },
		{ query: 'laka', text: 'Łąka', note: 'the same word, with ł as l' },
		{ query: 'orken', text: 'Ørken', note: 'the same word, with ø as o' },
		{ query: 'αθηνα', text: 'Ἀθηνᾶ', note: 'the same word' },
		{ query: 'كتب', text: 'كَتَبَ', note: 'the same word, with its vowel marks' },
		{ query: 'שלום', text: 'שָׁלוֹם', note: 'the same word, with its points' },
		{ query: 'कल', text: 'कुल', note: 'tomorrow and total: two words' },
		{ query: 'ขาว', text: 'ข้าว', note: 'white and rice: two words' }
	];
	let query = $state('');
	const found = $derived(query.trim() ? sorted.filter((n) => fold(n).includes(fold(query.trim()))) : sorted);

	const h2 = 'text-sm font-medium';
	const note = 'text-xs text-muted-foreground';
</script>

<svelte:head>
	<title>Scripts and direction</title>
</svelte:head>

<div class="flex max-w-5xl flex-col gap-10">
	<div class="flex flex-col gap-1">
		<h1 class="text-base font-semibold">Scripts and direction</h1>
		<p class="text-sm text-muted-foreground">
			Text in a script that Inter does not cover, and content in another language or direction than the interface, as
			"Other scripts" and "Content in another language" in DESIGN.md define them. The interface runs left to right
			("Direction" in DESIGN.md). Every name and text is invented.
		</p>
	</div>

	<section class="flex flex-col gap-3" aria-labelledby="steps">
		<h2 id="steps" class={h2}>Each script at each step</h2>
		<p class={note}>Each line keeps the line height of its step. The browser takes a system face for each script that Inter does not cover.</p>
		<div class="overflow-x-auto">
			<table class="text-left">
				<thead class={note}>
					<tr>
						<th class="pe-4 pb-1 font-normal">Script</th>
						{#each STEPS as step (step.name)}<th class="pe-4 pb-1 font-normal">{step.name}</th>{/each}
					</tr>
				</thead>
				<tbody>
					{#each SCRIPTS as s (s.lang)}
						<tr class="align-top">
							<th class="pe-4 py-1 text-xs font-normal text-muted-foreground">{s.name} <code class="font-mono">{s.lang}</code></th>
							{#each STEPS as step (step.name)}
								<td class="pe-4 py-1"><div lang={s.lang} dir={s.dir} data-step={step.name} class="{step.cls} whitespace-nowrap">{s.text}</div></td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="han">
		<h2 id="han" class={h2}>Han characters by language</h2>
		<p class={note}>The same three characters, with the lang of each language. The last one has the lang of the interface.</p>
		<div class="flex flex-wrap gap-6">
			{#each [...HAN, ''] as lang (lang)}
				<div class="flex flex-col gap-1">
					<span lang={lang || undefined} class="text-3xl">直骨角</span>
					<code class="font-mono text-xs text-muted-foreground">{lang || 'no lang of its own'}</code>
				</div>
			{/each}
		</div>
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="mixed">
		<h2 id="mixed" class={h2}>A line that mixes scripts</h2>
		<div class="overflow-x-auto"><p id="mixed-line" class="text-sm whitespace-nowrap">{MIXED}</p></div>
		<p id="mixed-paragraph" class="w-75 text-md">
			Ana sent the invoice <bdi lang="ar">تم إرسال الفاتورة إلى العميل</bdi> and the note <span lang="zh-Hans">发票已发送给客户</span> and
			<span lang="hi">चालान ग्राहक को भेज दिया गया</span> and <span lang="th">ส่งใบแจ้งหนี้ให้ลูกค้าแล้ว</span> to the client today.
		</p>
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="clip">
		<h2 id="clip" class={h2}>An ellipsis over the marks of a line</h2>
		<p class={note}><code class="font-mono">truncate</code> cuts the tops of the Thai tone marks. The second line keeps them.</p>
		<div lang="th" id="clip-truncate" class="w-40 truncate text-sm">{THAI}</div>
		<div lang="th" id="clip-x" class="w-40 overflow-x-clip text-sm text-ellipsis whitespace-nowrap">{THAI}</div>
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="content">
		<h2 id="content" class={h2}>Content in another language</h2>
		<div class="flex max-w-180 flex-col gap-1 rounded-lg border border-border p-4">
			<div class="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
				<span>Message from <bdi>{NAME}</bdi></span>
				<time datetime="2026-10-25T09:20">09:20</time>
			</div>
			<p id="message-ar" lang="ar" dir="rtl" class="text-md">شكراً على الفاتورة. سندفع المبلغ كاملاً قبل نهاية الشهر.</p>
		</div>
		<div class="flex max-w-180 flex-col gap-1 rounded-lg border border-border p-4">
			<div class="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
				<span>Message from <bdi>Jonas Weber</bdi></span>
				<time datetime="2026-10-25T09:42">09:42</time>
			</div>
			<p lang="de" class="text-md">Danke für die Rechnung. Wir zahlen den vollen Betrag vor dem Monatsende.</p>
		</div>
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="sentence">
		<h2 id="sentence" class={h2}>A name inside a sentence</h2>
		<p id="sentence-plain" class="text-sm"><span class={note}>Not isolated:</span> Reviewed by {NAME} · 3 comments</p>
		<p id="sentence-bdi" class="text-sm"><span class={note}>In &lt;bdi&gt;:</span> Reviewed by <bdi>{NAME}</bdi> · 3 comments</p>
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="cells">
		<h2 id="cells" class={h2}>A table with values in other scripts</h2>
		<p class={note}>
			Each value sits in &lt;bdi&gt;, so the column keeps its left edge and the count stays after the name. A cut title
			takes dir="auto" and text-left, so it keeps its start. The last row cuts its title with truncate alone.
		</p>
		<table class="w-full max-w-180 table-fixed text-sm">
			<thead class="text-left text-muted-foreground">
				<tr class="border-b border-border">
					<th class="h-8 w-48 ps-3 font-medium">Client</th>
					<th class="h-8 ps-3 font-medium">Title</th>
					<th class="h-8 w-24 pe-4 text-right font-medium">Open</th>
				</tr>
			</thead>
			<tbody>
				{#each CLIENTS as c (c.name)}
					<tr class="h-8 border-b border-border-faint">
						<td class="ps-3"><bdi lang={c.lang}>{c.name}</bdi> <span class="text-muted-foreground">({c.count})</span></td>
						<td class="ps-3"><div lang={c.lang} dir="auto" class="overflow-x-clip text-left text-ellipsis whitespace-nowrap">{c.title}</div></td>
						<td class="pe-4 text-right tabular-nums">{c.count}</td>
					</tr>
				{/each}
				<tr class="h-8 border-b border-border-faint">
					<td class="ps-3"><bdi lang="ar">{CLIENTS[1].name}</bdi></td>
					<td class="ps-3"><div id="cut-truncate" lang="ar" class="truncate">{CLIENTS[1].title}</div></td>
					<td class="pe-4 text-right tabular-nums">3</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="fields">
		<h2 id="fields" class={h2}>Fields where a person types</h2>
		<div class="flex max-w-96 flex-col gap-2">
			<Label for="field-name">Name of the contact</Label>
			<Input id="field-name" dir="auto" value={NAME} />
		</div>
		<div class="flex max-w-96 flex-col gap-2">
			<Label for="field-note">Note</Label>
			<Textarea id="field-note" dir="auto" value="הלקוח ביקש עותק מודפס של החשבונית." />
		</div>
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="code">
		<h2 id="code" class={h2}>Code inside right-to-left content</h2>
		<div lang="ar" dir="rtl" class="flex max-w-180 flex-col gap-2 text-md">
			<p>أضف هذا السطر إلى الإعدادات:</p>
			<pre id="code-plain" class="rounded-lg bg-muted px-2.5 py-2 font-mono text-xs">const total = sum(rows); // المجموع</pre>
			<div id="code-ltr"><CodeBlock code={'const total = sum(rows); // المجموع'} aria-label="Line for the settings" /></div>
		</div>
		<p class={note}>The first block is a pre with no dir of its own. The second is a code block, which takes dir="ltr".</p>
	</section>

	<section class="flex flex-col gap-3" aria-labelledby="sort">
		<h2 id="sort" class={h2}>Sort and search</h2>
		<p class={note}>The names in the order of Intl.Collator for en-GB. The search folds the query and each name.</p>
		<div class="flex max-w-96 flex-col gap-2">
			<Label for="search-names">Search the names</Label>
			<Input id="search-names" type="search" dir="auto" bind:value={query} />
		</div>
		<ol class="flex flex-col gap-1 text-sm">
			{#each found as n (n)}<li><bdi>{n}</bdi></li>{/each}
		</ol>
		<table class="max-w-180 text-left text-sm">
			<thead class="text-muted-foreground">
				<tr><th class="pe-6 font-medium">Query</th><th class="pe-6 font-medium">Text</th><th class="pe-6 font-medium">Found</th><th class="font-medium">Why</th></tr>
			</thead>
			<tbody>
				{#each PAIRS as p (p.query)}
					<tr>
						<td class="pe-6"><bdi>{p.query}</bdi></td>
						<td class="pe-6"><bdi>{p.text}</bdi></td>
						<td class="pe-6">{fold(p.text).includes(fold(p.query)) ? 'Yes' : 'No'}</td>
						<td class="text-muted-foreground">{p.note}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
</div>
