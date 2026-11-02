<!--
	The diff of DESIGN.md (### diff): a read-only view of the change between two versions of a text
	or of code. The product brings the lines: each line is unchanged, added or removed, with its old
	and its new number, and a changed line can mark the words that changed. The part computes no diff.

	kind="code" draws the box of a code block: the muted ground, the code step and a gutter of line
	numbers. kind="text" draws paragraphs in the reading step on the ground of the page, with no box
	and no numbers. An added line takes a "+" sign and the diff-added tint, and a removed line a "−"
	sign and the diff-removed tint, so that the sign carries the change and the color never does it
	alone. A changed word takes the tint of its line at 30% over it, and an underline when it is added
	or a line through it when it is removed.

	view="split" puts the old version on the left and the new version on the right, from 1024 px only.
	An added line with `replaces` stands beside the removed line of that old number, and a line with no
	pair takes a row of its own. A change with no `replaces` pairs its lines by position. Below 1024 px
	every diff is unified. Unchanged lines that are more than `context` lines away from a change fold
	into one row, when that row hides at least two lines. The row opens them in place. A line of kind
	"folded" stands for lines that the product does not have: it shows the count and the context of the
	hunk that follows, and it is no button.

	The sides row names the two versions and holds a copy button for each when the product marks the
	diff as `complete`, and the buttons to the previous and the next change when the diff holds two
	changes or more. N and Shift+N do the same while the focus is in the diff. A polite live region says
	each result. A changed word is an ins or a del element.

	The root of the part (diff-wrapper) holds the box, the line of a refused copy and the live region,
	and it takes the class, which places the part.
-->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type DiffWord = { text: string; changed?: boolean };
	export type DiffLine =
		| {
				kind: 'same' | 'added' | 'removed';
				text: string;
				/** The number in the old version: an unchanged and a removed line. */
				old?: number;
				/** The number in the new version: an unchanged and an added line. */
				new?: number;
				/** An added line: the old number of the removed line that it replaces, for the split view. */
				replaces?: number;
				/** The words of a changed line, each marked when it changed. They join to the text. */
				words?: DiffWord[];
		  }
		| {
				kind: 'folded';
				count: number;
				/** The context of the hunk after the fold, such as the function that a git hunk header names. */
				context?: string;
		  };

	export type DiffWords = {
		added: string;
		removed: string;
		oldVersion: string;
		newVersion: string;
		copyOld: string;
		copyNew: string;
		copied: string;
		failed: string;
		/** The words that a screen reader says before a changed word of a text. */
		inserted: string;
		deleted: string;
		previous: string;
		next: string;
		position: (at: number, of: number) => string;
		fold: (n: number) => string;
		folded: (n: number) => string;
	};

	/** @behaviour next-change:N previous-change:Shift+N */
	export type DiffProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		/** The root element of the part, which holds the box, the line of a refused copy and the live region. */
		ref?: HTMLDivElement | null;
		lines: DiffLine[];
		kind?: 'code' | 'text';
		/** The pick of the person. Split shows from 1024 px only. */
		view?: 'unified' | 'split';
		/** The unchanged lines that stay next to each change: 3 for code and 1 for text by default. */
		context?: number;
		/** The names of the two versions, such as a branch and a commit. */
		oldName?: string;
		newName?: string;
		/** True when the product gave every line of both versions. Only then each side has a copy button. */
		complete?: boolean;
		/** Classes for the root, which place the part, such as a margin or a width. */
		class?: string;
		'aria-label'?: string;
		'aria-labelledby'?: string;
		/** The words of the part, in the language of the product. */
		words?: Partial<DiffWords>;
	};
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { bands } from '#lib/stack/behaviour/width.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import UnfoldVerticalIcon from '@lucide/svelte/icons/unfold-vertical';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Kbd } from '#lib/components/ui/kbd/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';

	let {
		lines,
		kind = 'code',
		view = 'unified',
		context,
		oldName,
		newName,
		complete = false,
		class: className,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		words: given = {},
		ref = $bindable(null),
		...rest
	}: DiffProps = $props();

	const unit = $derived(kind === 'code' ? 'lines' : 'paragraphs');
	const w: DiffWords = $derived({
		added: 'Added',
		removed: 'Removed',
		oldVersion: 'Old version',
		newVersion: 'New version',
		copyOld: 'Copy the old version',
		copyNew: 'Copy the new version',
		copied: 'Copied',
		failed: 'The browser did not copy the text. The text is selected, so copy it by hand.',
		inserted: 'inserted',
		deleted: 'deleted',
		previous: 'Previous change',
		next: 'Next change',
		position: (at, of) => `Change ${at} of ${of}`,
		fold: (n) => `Show ${n} unchanged ${n === 1 ? unit.slice(0, -1) : unit}`,
		folded: (n) => `${n} unchanged ${n === 1 ? unit.slice(0, -1) : unit}`,
		...given
	});

	const id = $props.id();
	const split = $derived(view === 'split' && bands.lg.current);
	const keep = $derived(context ?? (kind === 'code' ? 3 : 1));
	const SIGN = { same: '', added: '+', removed: '−' } as const;

	type Line = Exclude<DiffLine, { kind: 'folded' }>;
	type Item =
		| { type: 'line'; line: Line; i: number }
		| { type: 'fold'; from: number; to: number }
		| { type: 'folded'; count: number; context?: string | undefined; i: number };

	/** The changes: each run of added and removed lines, as the index of its first and its last line. */
	const changes = $derived.by(() => {
		const out: { from: number; to: number }[] = [];
		lines.forEach((l, i) => {
			if (l.kind !== 'added' && l.kind !== 'removed') return;
			const last = out.at(-1);
			if (last && last.to === i - 1) last.to = i;
			else out.push({ from: i, to: i });
		});
		return out;
	});
	const changeAt = $derived(new Map(changes.map((c, k) => [c.from, k])));

	// The folds that the person opened, by the index of their first line.
	let opened = $state<Set<number>>(new Set());

	/** The rows in order: a line, a fold that the person can open, or lines that the product folded. */
	const items = $derived.by(() => {
		const out: Item[] = [];
		let i = 0;
		while (i < lines.length) {
			const l = lines[i]!;
			if (l.kind === 'folded') {
				out.push({ type: 'folded', count: l.count, context: l.context, i });
				i++;
				continue;
			}
			if (l.kind !== 'same') {
				out.push({ type: 'line', line: l, i });
				i++;
				continue;
			}
			let end = i;
			while (end + 1 < lines.length && lines[end + 1]!.kind === 'same') end++;
			// A run keeps `keep` lines next to each change around it, and folds the rest when that hides
			// two lines or more. A diff with no change folds nothing.
			const before = i > 0 && lines[i - 1]!.kind !== 'folded';
			const after = end < lines.length - 1 && lines[end + 1]!.kind !== 'folded';
			const head = changes.length && before ? keep : 0;
			const tail = changes.length && after ? keep : 0;
			const from = i + head;
			const to = end - tail;
			const hide = changes.length > 0 && to - from + 1 >= 2 && !opened.has(from);
			for (let j = i; j <= end; j++) {
				if (hide && j === from) out.push({ type: 'fold', from, to });
				if (hide && j >= from && j <= to) continue;
				out.push({ type: 'line', line: lines[j] as Line, i: j });
			}
			i = end + 1;
		}
		return out;
	});

	type Cell = { line: Line; i: number };
	type Row =
		| { type: 'line'; left?: Cell | undefined; right?: Cell | undefined; first: number; change?: number | undefined }
		| Exclude<Item, { type: 'line' }>;

	/**
	 * The rows of the split view: an unchanged line on both sides, and each removed line beside the added
	 * line that replaces it. A line with no pair takes a row of its own, and each side keeps its order.
	 * A change in which no added line names a removed line with `replaces` pairs its lines by position.
	 */
	const rows = $derived.by(() => {
		const out: Row[] = [];
		const push = (left?: Cell, right?: Cell) =>
			out.push({ type: 'line', left, right, first: Math.min(left?.i ?? Infinity, right?.i ?? Infinity) });
		let k = 0;
		while (k < items.length) {
			const it = items[k]!;
			if (it.type !== 'line') {
				out.push(it);
				k++;
				continue;
			}
			if (it.line.kind === 'same') {
				push(it, it);
				k++;
				continue;
			}
			const removed: Cell[] = [];
			const added: Cell[] = [];
			while (k < items.length) {
				const c = items[k]!;
				if (c.type !== 'line' || c.line.kind === 'same') break;
				(c.line.kind === 'removed' ? removed : added).push(c);
				k++;
			}
			const start = out.length;
			const byOld = new Map(removed.map((c, j) => [c.line.old, j]));
			// The index in `removed` of the line that each added line replaces, or -1.
			const target = added.map((c) => (c.line.replaces === undefined ? -1 : (byOld.get(c.line.replaces) ?? -1)));
			if (target.every((t) => t === -1)) {
				for (let j = 0; j < Math.max(removed.length, added.length); j++) push(removed[j], added[j]);
			} else {
				// The index in `added` of the first line that replaces each removed line, or -1.
				const partner = removed.map((_, j) => target.indexOf(j));
				let r = 0;
				added.forEach((a, j) => {
					const p = target[j]!;
					if (p >= r) {
						while (r < p) push(removed[r++]);
						push(removed[r++], a);
						return;
					}
					// The removed lines that no later added line replaces come first, as in the unified view.
					while (r < removed.length && partner[r]! < j) push(removed[r++]);
					push(undefined, a);
				});
				while (r < removed.length) push(removed[r++]);
			}
			// The first row of a change takes the focus of the change keys, whichever side it starts on.
			const head = out[start]!;
			if (head.type === 'line') head.change = changeAt.get(it.i);
		}
		return out;
	});

	// The gutter is as wide as the largest number, and at least 36 px, so that every line keeps one column.
	const digits = $derived(
		String(Math.max(0, ...lines.map((l) => (l.kind === 'folded' ? 0 : Math.max(l.old ?? 0, l.new ?? 0))))).length
	);
	const gutterWidth = $derived(`max(2.25rem, calc(${digits}ch + 0.75rem))`);

	const joiner = $derived(kind === 'code' ? '\n' : '\n\n');
	const sideText = (side: 'old' | 'new') =>
		lines
			.filter((l): l is Line => l.kind === 'same' || l.kind === (side === 'old' ? 'removed' : 'added'))
			.map((l) => l.text)
			.join(joiner);

	let root = $state<HTMLElement | null>(null);
	let body = $state<HTMLElement | null>(null);
	let said = $state('');
	let result = $state<{ side: 'old' | 'new'; state: 'copied' | 'failed' } | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let at = $state(-1);
	// The side that a refused copy selected. The lines of the other side take select-none while that
	// selection lasts, so that a copy by hand gives this side alone.
	let pick = $state<'old' | 'new' | null>(null);
	let unpick: (() => void) | undefined;

	function say(text: string) {
		// The same text twice in a row is a change too, so the region empties first.
		said = '';
		queueMicrotask(() => (said = text));
	}

	function release() {
		unpick?.();
		unpick = undefined;
		pick = null;
	}

	/** Opens every fold and selects the lines of one side, as a code block selects its text. */
	async function select(side: 'old' | 'new') {
		pick = side;
		opened = new Set([...opened, ...items.flatMap((it) => (it.type === 'fold' ? [it.from] : []))]);
		await tick();
		const selection = getSelection();
		if (!selection || !body) return;
		selection.selectAllChildren(body);
		const r = selection.getRangeAt(0);
		const ours = [r.startContainer, r.startOffset, r.endContainer, r.endOffset];
		// A click or a key that changes the selection ends the pick.
		const onchange = () => {
			const now = selection.rangeCount ? selection.getRangeAt(0) : null;
			const same = now && [now.startContainer, now.startOffset, now.endContainer, now.endOffset].every((v, j) => v === ours[j]);
			if (!same) release();
		};
		document.addEventListener('selectionchange', onchange);
		unpick = () => document.removeEventListener('selectionchange', onchange);
	}

	async function copy(side: 'old' | 'new') {
		clearTimeout(timer);
		release();
		try {
			await navigator.clipboard.writeText(sideText(side));
			result = { side, state: 'copied' };
			say(w.copied);
		} catch {
			// No clipboard, as on a page that is not secure, or a write that the browser refused.
			result = { side, state: 'failed' };
			say(w.failed);
			await select(side);
		}
		timer = setTimeout(() => {
			result = null;
			said = '';
		}, 2000);
	}
	$effect(() => () => {
		clearTimeout(timer);
		unpick?.();
	});

	/**
	 * Moves the focus to the first line of the next or the previous change, and wraps at the ends. From a
	 * line that is no change, such as the first line of a fold that the person opened, the next change is
	 * the first one after that line.
	 */
	function move(by: 1 | -1) {
		if (!changes.length || !root) return;
		const focused = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('[data-line]');
		let from = at;
		if (focused && root.contains(focused)) {
			if (focused.dataset.change !== undefined) from = Number(focused.dataset.change);
			else {
				const after = changes.findIndex((c) => c.from > Number(focused.dataset.line));
				const next = after === -1 ? changes.length : after;
				from = by === 1 ? next - 1 : next;
			}
		}
		at = from < 0 ? (by === 1 ? 0 : changes.length - 1) : (from + by + changes.length) % changes.length;
		const el = root.querySelector<HTMLElement>(`[data-change="${at}"]`);
		if (!el) return;
		// focusVisible keeps the focus ring after a click on a button, as after a key.
		el.focus({ preventScroll: true, focusVisible: true } as FocusOptions);
		el.scrollIntoView({ block: 'center' });
		say(w.position(at + 1, changes.length));
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key.toLowerCase() !== 'n' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
		e.preventDefault();
		// A key of the product, such as N for a new item, does not fire too.
		e.stopPropagation();
		move(e.shiftKey ? -1 : 1);
	}

	/** Opens a fold and moves the focus to its first line, because the button of the fold goes. */
	async function open(from: number) {
		opened = new Set([...opened, from]);
		await tick();
		const el = root?.querySelector<HTMLElement>(`[data-line="${from}"]`);
		if (!el) return;
		el.tabIndex = -1;
		el.focus({ focusVisible: true } as FocusOptions);
	}

	const tint = (l: Line | undefined) =>
		l?.kind === 'added' ? 'bg-diff-added/10' : l?.kind === 'removed' ? 'bg-diff-removed/10' : undefined;
	const mark = (l: Line) =>
		l.kind === 'added' ? 'bg-diff-added/30 underline underline-offset-2' : 'bg-diff-removed/30 line-through';
	const focusRing = 'outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset';
	const gutter = 'shrink-0 w-(--diff-gutter) pr-2 pl-1 text-right text-muted-foreground select-none max-md:hidden';
	const showSides = $derived(Boolean(oldName || newName) || complete || changes.length > 1);
</script>

<!-- A changed word is an ins or a del element. In text, a word that does not show comes before it, so
     that a screen reader finds the change in a long paragraph. An empty line holds a br, so that a
     copy by hand keeps it. -->
{#snippet text(l: Line)}
	<span class="sr-only select-none">{l.kind === 'added' ? `${w.added}: ` : l.kind === 'removed' ? `${w.removed}: ` : ''}</span
	>{#if l.words && l.kind !== 'same'}{#each l.words as word, j (j)}{#if !word.changed}{word.text}{:else if l.kind === 'added'}<ins class={mark(l)}
					>{#if kind === 'text'}<span class="sr-only select-none">{`${w.inserted} `}</span>{/if}{word.text}</ins
				>{:else}<del class={mark(l)}>{#if kind === 'text'}<span class="sr-only select-none">{`${w.deleted} `}</span>{/if}{word.text}</del
				>{/if}{/each}{:else if l.text}{l.text}{:else}<br />{/if}
{/snippet}

{#snippet sign(l: Line)}
	<span data-slot="diff-sign" aria-hidden="true" class={cn('shrink-0 text-center select-none', kind === 'code' ? 'w-5' : 'w-3')}>{SIGN[l.kind]}</span>
{/snippet}

{#snippet codeLine(l: Line, sides: 'both' | 'old' | 'new')}
	{#if sides !== 'new'}<span data-slot="diff-gutter" aria-hidden="true" class={cn(gutter, sides === 'old' && 'border-r border-border')}>{l.old ?? ''}</span>{/if}
	{#if sides !== 'old'}<span data-slot="diff-gutter" aria-hidden="true" class={cn(gutter, 'border-r border-border')}>{l.new ?? ''}</span>{/if}
	{@render sign(l)}
	<span class="min-w-0 flex-1 pr-2.5 whitespace-pre-wrap wrap-anywhere">{@render text(l)}</span>
{/snippet}

{#snippet fold(it: { from: number; to: number })}
	<button
		type="button"
		data-slot="diff-fold"
		class={cn(
			'flex h-6 w-full cursor-pointer items-center gap-2 border-y border-border font-sans text-xs text-muted-foreground hover:text-foreground',
			focusRing,
			kind === 'text' && 'rounded-md border-dashed px-2'
		)}
		onclick={() => open(it.from)}
	>
		{#if kind === 'code'}<span class="flex shrink-0 justify-end pr-2 max-md:hidden" style:width="calc(2 * var(--diff-gutter))" aria-hidden="true"><UnfoldVerticalIcon class="size-3.5" /></span>{/if}
		{#if kind === 'text'}<UnfoldVerticalIcon class="size-3.5 shrink-0" aria-hidden="true" />{/if}
		<span class="max-md:pl-2.5">{w.fold(it.to - it.from + 1)}</span>
	</button>
{/snippet}

{#snippet folded(count: number, context?: string)}
	<p
		data-slot="diff-fold"
		class={cn(
			'flex h-6 min-w-0 items-center gap-2 border-y border-border font-sans text-xs text-muted-foreground',
			kind === 'code' ? 'px-2.5' : 'rounded-md border-dashed px-2'
		)}
	>
		<span class="shrink-0">{w.folded(count)}</span>
		{#if context}<span data-slot="diff-context" class="min-w-0 truncate font-mono">{context}</span>{/if}
	</p>
{/snippet}

{#snippet copyButton(side: 'old' | 'new')}
	{@const label = side === 'old' ? w.copyOld : w.copyNew}
	{@const done = result?.side === side ? result.state : null}
	<Tooltip.Root disableCloseOnTriggerClick>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="ghost" size="icon-xs" class="print:hidden" aria-label={label} onclick={() => copy(side)}>
					{#if done === 'copied'}<CheckIcon />{:else}<CopyIcon />{/if}
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>{done === 'copied' ? w.copied : done === 'failed' ? w.failed : label}</Tooltip.Content>
	</Tooltip.Root>
{/snippet}

{#snippet side(which: 'old' | 'new')}
	{@const name = which === 'old' ? oldName : newName}
	<span class="flex min-w-0 items-center gap-1">
		<span aria-hidden="true" class="font-mono">{which === 'old' ? '−' : '+'}</span><span class="sr-only">{which === 'old' ? w.oldVersion : w.newVersion}{name ? ': ' : ''}</span>
		{#if name}<span class="min-w-0 truncate">{name}</span>{:else}<span aria-hidden="true">{which === 'old' ? w.oldVersion : w.newVersion}</span>{/if}
		{#if complete}{@render copyButton(which)}{/if}
	</span>
{/snippet}

{#snippet stepButton(by: 1 | -1)}
	{@const label = by === 1 ? w.next : w.previous}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="ghost" size="icon-xs" class="print:hidden" aria-label={label} aria-keyshortcuts={by === 1 ? 'N' : 'Shift+N'} onclick={() => move(by)}>
					{#if by === 1}<ChevronDownIcon />{:else}<ChevronUpIcon />{/if}
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>{label} <Kbd>{by === 1 ? 'N' : 'Shift N'}</Kbd></Tooltip.Content>
	</Tooltip.Root>
{/snippet}

<!-- The part gives its tooltips their provider, so it works on a page with none. -->
<Tooltip.Provider>
<div bind:this={ref} data-slot="diff-wrapper" class={cn('flex min-w-0 flex-col gap-1', className)} {...rest}>
	<!-- N and Shift+N come from the buttons and the change lines inside the box, so the box listens for them. -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		bind:this={root}
		data-slot="diff"
		data-kind={kind}
		data-view={split ? 'split' : 'unified'}
		role="group"
		aria-label={ariaLabel}
		aria-labelledby={ariaLabelledby}
		style:--diff-gutter={gutterWidth}
		class={kind === 'code' ? 'rounded-lg bg-muted font-mono text-xs text-foreground' : 'text-md text-foreground'}
		{onkeydown}
	>
		{#if showSides}
			<div
				data-slot="diff-sides"
				class={cn(
					'flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-xs text-muted-foreground',
					kind === 'code' ? 'border-b border-border py-1 pr-1 pl-2.5' : 'pb-2'
				)}
			>
				{@render side('old')}
				{@render side('new')}
				{#if changes.length > 1}
					<span class="ml-auto flex items-center gap-1">{@render stepButton(-1)}{@render stepButton(1)}</span>
				{/if}
			</div>
		{/if}

		<div bind:this={body} class={kind === 'code' ? 'py-2' : 'flex flex-col gap-1'}>
			{#if split}
				{#each rows as r (r.type === 'line' ? `l${r.first}` : r.type === 'fold' ? `f${r.from}` : `x${r.i}`)}
					{#if r.type === 'fold'}
						{@render fold(r)}
					{:else if r.type === 'folded'}
						{@render folded(r.count, r.context)}
					{:else}
						{@const k = r.change}
						<!-- The first row of a change takes tabindex -1 only, so that the change keys can move the focus to it. -->
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<div
							data-line={r.first}
							data-change={k}
							tabindex={k !== undefined ? -1 : undefined}
							class={cn('grid grid-cols-2', kind === 'text' && 'gap-2', focusRing, pick && !(pick === 'old' ? r.left : r.right) && 'select-none')}
						>
							{#each [r.left, r.right] as cell, c (c)}
								<div
									data-slot="diff-line"
									data-kind={cell?.line.kind ?? 'empty'}
									class={cn(
										'flex min-w-0',
										kind === 'code' ? 'min-h-4' : 'gap-2 rounded-md px-2 py-1',
										tint(cell?.line),
										kind === 'code' && c === 0 && 'border-r border-border',
										pick && c !== (pick === 'old' ? 0 : 1) && 'select-none'
									)}
								>
									{#if cell}
										{#if kind === 'code'}
											{@render codeLine(cell.line, c === 0 ? 'old' : 'new')}
										{:else}
											{@render sign(cell.line)}<span class="min-w-0 flex-1">{@render text(cell.line)}</span>
										{/if}
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				{/each}
			{:else}
				{#each items as it (it.type === 'line' ? `l${it.i}` : it.type === 'fold' ? `f${it.from}` : `x${it.i}`)}
					{#if it.type === 'fold'}
						{@render fold(it)}
					{:else if it.type === 'folded'}
						{@render folded(it.count, it.context)}
					{:else}
						{@const k = changeAt.get(it.i)}
						<!-- The first line of a change takes tabindex -1 only, so that the change keys can move the focus to it. -->
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<div
							data-slot="diff-line"
							data-kind={it.line.kind}
							data-line={it.i}
							data-change={k}
							tabindex={k !== undefined ? -1 : undefined}
							class={cn(
								'flex',
								kind === 'code' ? 'min-h-4' : 'gap-2 rounded-md px-2 py-1',
								tint(it.line),
								focusRing,
								pick && it.line.kind === (pick === 'old' ? 'added' : 'removed') && 'select-none'
							)}
						>
							{#if kind === 'code'}
								{@render codeLine(it.line, 'both')}
							{:else}
								{@render sign(it.line)}<span class="min-w-0 flex-1">{@render text(it.line)}</span>
							{/if}
						</div>
					{/if}
				{/each}
			{/if}
		</div>
	</div>
	<!-- The line of a refused copy stays for 2 s, and a move to a change does not replace it. The live
	     region has said it already. -->
	{#if result?.state === 'failed'}<p aria-hidden="true" class="text-xs text-muted-foreground">{w.failed}</p>{/if}
	<span id="{id}-said" role="status" class="sr-only">{said}</span>
</div>
</Tooltip.Provider>
