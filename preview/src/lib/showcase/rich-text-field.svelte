<script lang="ts">
	import * as Field from '#lib/components/ui/field/index.js';
	import ColorPicker from '#lib/rich-text/toolbar/ColorPicker.svelte';
	import type { OnFailure, RichTextEditor, RichTextQuote, RichTextWriting, StoredPicture, TextRange, WritingChange, WritingMode, WritingRequest, WritingResult } from '#lib/stack/rich-text.js';

	// The field loads in a chunk of its own, and its engine in another, so the page chunk stays small.
	const loading = import('#lib/stack/RichTextField.svelte');

	// An invented plan of a room, 240 by 135 px.
	const PLAN = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAACHCAIAAACnEEO8AAACFklEQVR42u3doQ2AMBRF0Q7LCGzBllVIKipw7Qo1X7yc5KPJzTvB0q77cS7m2n76+9Xffu+Yf/3pDe4FWi/QBtYLtIH1Am1gvUAbGGgD6wXawHqBNrBeoA2sF2gDA21gvUAbWC/QBtYLtIH1Ag000AbWC7SB9QJtYL1AG1gv0EADbWC9QBtYL9AG1gu0gfUCDTTQBtYLtIH1Am1gvUAbWC/QeoE2sF6gDawXaAPrBdrAeoHWC7SB9QJtYL1AG1gv0AYGGmi9QBtYL9AG1gu0gfWeg3Yu6uf1vhx6M3qB1gu0gfUCbWC9QBtYL9AGBtrAeoE2sF6gDawXaAPrBdrAQBtYL9AG1gu0gfUCbWC9QAMNtIH1Am1gvUAbWC/QBtYLNNBAG1gv0AbWC7SB9QJtYL1AAw20gfUCbWC9QBtYL9AG1gu0XqANrBdoA+sF2sB6gTawXqD1Am1gvUAbWC/QBtYLtIGBBlov0AbWC7SB9QJtYL3noJ2L+nm9L4fejF6g9QJtYL1AG1gv0AbWC7SBgTawXqANrBdoA+sF2sB6gTYw0AbWC7SB9QJtYL1AG1gv0EADbWC9QBtYL9AG1gu0gfUCDTTQBtYLtIH1Am1gvUAbWC/QQANtYL1AG1gv0AbWC7SB9QKtF2gD6wXawHqBNrBeoA2sF2i9QBtYL9AG1gu0gfUCbWCggdYLtIH1Am1gvUWgnYu5BZRT8H+d5K8SAAAAAElFTkSuQmCC';

	// The lines of words() that the changes below count: 0 the heading, 1 the greeting, 2 empty, 3 and 4
	// the two lines, 5 and 6 the items, 7 the highlight, 8 the picture, 9 and 10 the closing.
	const note = [
		'<h2>Delivery update</h2>',
		'<div>Hello Morgan,</div>',
		'<div><br></div>',
		'<div>The new shelves arrive on Thursday, and the team will install them the the same day.</div>',
		'<div>Please confirm the <b>loading dock</b> number and the <a href="https://example.com/site-map">site map</a> before noon.</div>',
		'<ul><li>Two shelving units</li><li>One <span class="color" style="color:#b91c1c">spare</span> bracket set</li></ul>',
		'<div><span class="highlight" style="background-color:#fef08a">Parking is free on site.</span></div>',
		`<div><img src="${PLAN}" width="240" height="135" alt="A plan of the storage room"></div>`,
		'<div>Kind regards,</div>',
		'<div>Sam</div>'
	].join('');

	const found: WritingChange[] = [
		{ block: 3, old: 'the the same day', new: 'the same day', rule: 'Spelling', reason: 'The word "the" stands twice.' },
		{ block: 4, old: 'before noon', new: 'by 12:00', rule: 'Style', reason: 'A time in figures is easier to find.' },
		{ block: 9, old: 'Kind regards,', new: 'Best regards,', rule: 'Tone', reason: 'A shorter closing reads warmer.' },
		{ block: 1, old: 'Hello Morgan,', new: 'Hi Morgan,', rule: 'Tone', reason: 'A short greeting fits a note to a colleague.' }
	];

	const modes: WritingMode[] = [
		{ id: 'shorten', label: 'Shorten', group: 'Edit' },
		{ id: 'rephrase', label: 'Rephrase', group: 'Edit' },
		{ id: 'formal', label: 'Formal', group: 'Tone' },
		{ id: 'friendly', label: 'Friendly', group: 'Tone' }
	];

	/** A result after a time, as from a service. Stop aborts the signal, and the result then never comes. */
	function later(ms: number, signal: AbortSignal, result: () => WritingResult): Promise<WritingResult> {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => resolve(result()), ms);
			signal.addEventListener('abort', () => (clearTimeout(timer), reject(signal.reason)), { once: true });
		});
	}

	/** A rewrite of the note in a mode: the service gives the whole text again. */
	function rewrite(r: WritingRequest): WritingResult {
		const html =
			r.mode === 'shorten'
				? r.html.replace(/<div>Please confirm[^]*?before noon\.<\/div>/, '').replace('the the same day', 'that day')
				: r.mode === 'formal'
					? r.html.replace('Hello Morgan,', 'Dear Morgan,').replace('Kind regards,', 'Yours sincerely,')
					: r.html.replace('Hello Morgan,', 'Hi Morgan,').replace('the the same day', 'right away');
		return { kind: 'text', html, title: `A new text: ${modes.find((m) => m.id === r.mode)?.label ?? 'Rewrite'}` };
	}

	// A new layout of the note: the greeting joins the first line, a heading comes before the list, and the closing joins.
	const structure = (r: WritingRequest): WritingResult => ({
		kind: 'text',
		html: r.html.replace('<div>Hello Morgan,</div>', '').replace('<div>The new shelves', '<div>Hello Morgan, the new shelves').replace('<ul>', '<h3>What arrives</h3><ul>').replace('<div>Kind regards,</div><div>Sam</div>', '<div>Kind regards, Sam</div>')
	});

	let decisions = $state(0);
	const writing: RichTextWriting = {
		source: 'Suggestions',
		modes,
		run: (r, signal) =>
			later(1200, signal, () =>
				r.kind === 'check'
					? { kind: 'changes', changes: found }
					: r.kind === 'rewrite'
						? rewrite(r)
						: r.kind === 'structure'
							? structure(r)
							: { kind: 'changes', changes: found.slice(0, 1), note: `The service read the instruction: "${r.instruction ?? ''}".` }
			),
		ondecide: () => decisions++
	};

	let editor = $state<RichTextEditor | null>(null);
	let changed = $state(0);
	let selection = $state<TextRange | null>(null);

	// A reply to a mail: the earlier mail stands under the words, folded, until the person moves it into the text.
	const earlier: RichTextQuote = {
		line: 'On 12 Nov 2026, Ana Turner wrote:',
		body: ['Hello,', 'The shelves came today, and one bracket set is missing. Can you send it this week?\nThe order is SO-2291, and the delivery note is at https://example.com/orders/SO-2291/delivery-note-of-the-twelfth-of-november.', 'Kind regards,\nAna Turner']
	};
	let quoteEdited = $state(false);

	// A draft whose new layout another person asked for: the result comes as pending, with who asked and when.
	const draft = ['Delivery update', 'Hello team, the new shelves arrive on Thursday.', 'Two shelving units', 'One bracket set', 'Kind regards,', 'Sam']
		.map((line) => `<div>${line}</div>`)
		.join('');
	const LAYOUT =
		'<h2>Delivery update</h2><div>Hello team,</div><div>the new shelves arrive on Thursday.</div><h3>What arrives</h3><ul><li>Two shelving units</li><li>One bracket set</li></ul><div>Kind regards, Sam</div>';
	let layoutEditor = $state<RichTextEditor | null>(null);
	let layoutWriting = $state<RichTextWriting>({
		tools: ['structure'],
		run: (_r, signal) => later(1200, signal, () => ({ kind: 'text', html: LAYOUT, title: 'A new layout' })),
		pending: { kind: 'structure', asked: { by: 'Morgan', at: '09:14' }, result: { kind: 'text', html: LAYOUT, title: 'A new layout' } }
	});
	/** Morgan asks again: the draft comes back, and the result of the request comes after 1.5 s. */
	function askAgain() {
		layoutEditor?.load(draft);
		const result = new Promise<WritingResult>((resolve) => setTimeout(() => resolve({ kind: 'text', html: LAYOUT, title: 'A new layout' }), 1500));
		layoutWriting = { ...layoutWriting, pending: { kind: 'structure', asked: { by: 'Morgan', at: '09:20' }, result } };
	}

	// A service that does not answer: the field shows only the words that onfailure gives.
	const failing: RichTextWriting = {
		tools: ['check'],
		run: (_r, signal) =>
			new Promise((_resolve, reject) => {
				const timer = setTimeout(() => reject(new Error('The service is down.')), 800);
				signal.addEventListener('abort', () => (clearTimeout(timer), reject(signal.reason)), { once: true });
			})
	};
	const failingWords: OnFailure = (f) => (f.kind === 'writing' ? 'The check did not finish. Press Check to try again.' : undefined);

	// A check that another person started: the result never comes here, so the text stays read-only.
	const locked: RichTextWriting = { tools: ['check'], run: () => new Promise(() => {}), pending: { kind: 'check', asked: { by: 'Morgan', at: '09:14' }, result: new Promise(() => {}) } };

	/** The page stores a picture: here it reads the file as a data address, and rejects when it cannot read it. */
	function upload(file: File): Promise<StoredPicture> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const src = String(reader.result);
				const img = new Image();
				img.onload = () => resolve({ src, width: img.naturalWidth, height: img.naturalHeight });
				img.onerror = () => reject(new Error('The picture could not be read.'));
				img.src = src;
			};
			reader.onerror = () => reject(new Error('The picture could not be read.'));
			reader.readAsDataURL(file);
		});
	}

	/** The field writes no failure text of its own: the page gives the words of each line. */
	const onfailure: OnFailure = (failure) => {
		switch (failure.kind) {
			case 'load':
				return 'The editor did not load. Reload the page to write here.';
			case 'picture-type':
				return 'Only a PNG, JPEG, GIF or WebP picture can go into the text.';
			case 'upload':
				return 'The picture could not be read. Try another file.';
			case 'picture-address':
				return 'The field does not keep a picture from this address.';
			case 'paper':
				return undefined;
		}
	};
</script>

<section id="showcase-rich-text-field" data-showcase="rich-text-field" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">rich-text-field</h2>
	{#await loading then { default: RichTextField }}
		<div class="flex max-w-4xl flex-col gap-8">
			<Field.Field>
				<Field.Label id="rich-text-note-label">Note to the site team, with the writing tools</Field.Label>
				<RichTextField
					bind:editor
					html={note}
					aria-labelledby="rich-text-note-label"
					aria-describedby="rich-text-note-help"
					placeholder="Write the note…"
					{writing}
					{upload}
					{onfailure}
					onchange={() => changed++}
					onselection={(range) => (selection = range)}
					class="max-w-3xl"
				/>
				<Field.Description id="rich-text-note-help">
					Check gives changes, Rewrite gives a whole text in a mode, Structure gives a new layout, and the instruction row asks in words. Stop ends a request. Select words for the bar over them, click the plan for its grip and its bar, and open a color from the toolbar. Changes: {changed}. Decisions: {decisions}. Selected: {selection ? `"${selection.text}"` : 'none'}.
				</Field.Description>
			</Field.Field>

			<Field.Field>
				<Field.Label id="rich-text-reply-label">A reply to a mail, with the quoted earlier mail under the words</Field.Label>
				<RichTextField
					bind:quoteEdited
					html={'<div>Hello Ana,</div><div>The bracket set goes out tomorrow with the courier.</div>'}
					quote={earlier}
					aria-labelledby="rich-text-reply-label"
					aria-describedby="rich-text-reply-help"
					placeholder="Write the reply…"
					class="max-w-3xl"
				/>
				<Field.Description id="rich-text-reply-help">
					The quote stands under the words and outside the text, so the words that the page sends hold no quote. Edit the quoted text moves it into the text as one undo step, and the undo key gives the fold back. The quote is in the text: {quoteEdited ? 'yes' : 'no'}.
				</Field.Description>
			</Field.Field>

			<Field.Field>
				<Field.Label id="rich-text-layout-label">A new layout that another person asked for, with Take all and Leave all</Field.Label>
				<RichTextField bind:editor={layoutEditor} html={draft} aria-labelledby="rich-text-layout-label" aria-describedby="rich-text-layout-help" writing={layoutWriting} class="max-w-3xl" />
				<Field.Description id="rich-text-layout-help">
					The field computes the diff of the whole text, with the marks of the blocks. Take all makes the new layout as one undo step. <button type="button" class="underline" onclick={askAgain}>Ask again</button>
				</Field.Description>
			</Field.Field>

			<Field.Field>
				<Field.Label id="rich-text-failing-label">A service that does not answer</Field.Label>
				<RichTextField html={draft} aria-labelledby="rich-text-failing-label" writing={failing} onfailure={failingWords} class="max-w-3xl" />
			</Field.Field>

			<Field.Field>
				<Field.Label id="rich-text-locked-label">While a check of another person runs, read-only</Field.Label>
				<RichTextField html={note} aria-labelledby="rich-text-locked-label" writing={locked} class="max-w-3xl" />
			</Field.Field>

			<Field.Field>
				<Field.Label id="rich-text-markdown-label">Markdown as you type and the slash menu</Field.Label>
				<RichTextField html={'<div>A plan for the new shelves.</div><div><br></div>'} aria-labelledby="rich-text-markdown-label" aria-describedby="rich-text-markdown-help" markdown slash {upload} {onfailure} class="max-w-3xl" />
				<Field.Description id="rich-text-markdown-help">
					At the start of a line, type # and a space for a heading, - and a space for a list, or --- for a divider. Put two stars around words for bold. Backspace gives the marks back. On an empty line or after a space, a slash opens the block commands, and letters filter them.
				</Field.Description>
			</Field.Field>

			<Field.Field data-invalid="true">
				<Field.Label id="rich-text-simple-label">Comment, simple, required and empty</Field.Label>
				<RichTextField preset="simple" required invalid placeholder="Write a comment…" aria-labelledby="rich-text-simple-label" aria-describedby="rich-text-simple-error" class="max-w-xl" />
				<Field.Error id="rich-text-simple-error">Write the comment first.</Field.Error>
			</Field.Field>

			<div class="flex flex-wrap gap-8">
				<div class="flex flex-col gap-2">
					<h3 class="text-xs font-semibold text-muted-foreground">Content color picker, text</h3>
					<div class="rounded-lg bg-popover p-3 shadow-md ring-1 ring-foreground/10">
						<ColorPicker kind="text" value="#b91c1c" onpick={() => {}} />
					</div>
				</div>
				<div class="flex flex-col gap-2">
					<h3 class="text-xs font-semibold text-muted-foreground">Content color picker, highlight</h3>
					<div class="rounded-lg bg-popover p-3 shadow-md ring-1 ring-foreground/10">
						<ColorPicker kind="highlight" value="#fef08a" onpick={() => {}} />
					</div>
				</div>
			</div>
		</div>
	{:catch e}
		<p role="alert" class="text-sm">The rich text field did not load: {String(e)}</p>
	{/await}
</section>
