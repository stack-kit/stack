// The diff of a whole text that a writing service gives back (### rich-text-field in DESIGN.md,
// "Writing tools"). The field computes it, so a product computes no diff and no mark.
//
// - blocksOf() reads the blocks of a text: the HTML through the load list, then each line as a person
//   sees it, with its kind: a line, a heading of its level, an item of a list, a line of a quote or of
//   code, a line that holds only pictures, or a divider. A picture is its words in its line, a divider a
//   block of its words, and a link takes the words of its address after its own words (BlockMarks), so a
//   picture, a divider and an address that change are changes of the diff. blockMarks() gives each
//   picture address one number in both texts, so the same picture keeps its words.
// - diffBlocks() gives the lines of a diff of kind text (### diff). A Myers diff on the words of the
//   blocks finds the blocks that stay. Between two such blocks, a block whose words stand in two or more
//   blocks of the new text is a split, and two or more blocks whose words stand in one block are a join.
//   The other blocks pair by their place, and a Myers diff on the words of a pair marks each changed
//   word. A block that keeps its words and becomes a heading or an item of a list takes the mark of the
//   block. The lines follow the new text.
// - The limit is the most items, old and new together, that one comparison takes: the blocks of a
//   changed run for a split or a join, or the words of a changed pair. Above it, the run has no split
//   and no join, and the pair has no word marks.
//
// The file imports types only, so `node --test` runs it with no DOM and no build.
import type { DiffBlock, DiffLine, DiffWord } from '#lib/stack/Diff.svelte';
import type { WritingWords } from '#lib/stack/rich-text.js';

/** The kind of a block: a line, a heading of its level, an item of a list, a line of a quote or of code, pictures, or a divider. */
export type TextBlockKind = 'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'bullet' | 'number' | 'quote' | 'code' | 'picture' | 'divider';

/** A block of a text: its kind and its words, with each run of white space as one space. A picture and a divider are their words. */
export type TextBlock = { kind: TextBlockKind; text: string };

/** The words of what a text holds besides words: a picture in its line, a divider, and the address of a link. */
export type BlockMarks = {
	picture: (src: string, alt: string) => string;
	divider: string;
	link: (href: string) => string;
};

/**
 * The marks of the blocks of two texts, from the words of the writing tools. Each picture address takes
 * a number in the order in which it first comes, in the old text and then in the new one.
 */
export function blockMarks(words: Pick<WritingWords, 'picture' | 'divider' | 'address'>): BlockMarks {
	const numbers = new Map<string, number>();
	return {
		picture(src, alt) {
			const n = numbers.get(src) ?? numbers.size + 1;
			numbers.set(src, n);
			return words.picture(n, alt);
		},
		divider: words.divider,
		link: words.address
	};
}

/** The limit of diffBlocks() when the caller gives none. */
export const DIFF_LIMIT = 2000;

const LINE_BLOCK = /^(?:ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|DD|DIV|DL|DT|FIGCAPTION|FIGURE|FOOTER|H[1-6]|HEADER|HR|LI|OL|P|PRE|SECTION|TABLE|TR|UL)$/;
/** The zero-width space that the engine writes; it is no character of a line. */
const ZWS = '​';

const norm = (text: string) => text.replace(/\s+/g, ' ').trim();

/** The kind of the lines inside an element, from the kind of the lines around it. */
function kindIn(name: string, around: TextBlockKind): TextBlockKind {
	if (/^H[1-6]$/.test(name)) return name.toLowerCase() as TextBlockKind;
	if (name === 'UL') return 'bullet';
	if (name === 'OL') return 'number';
	if (name === 'BLOCKQUOTE') return 'quote';
	if (name === 'PRE') return 'code';
	return around;
}

/**
 * The blocks of a text. `load` gives the HTML through the load list, such as richTextFragment() of
 * @stack-kit/stack/rich-text, and `marks` the words of a picture, a divider and an address. Each block,
 * each line break and each line of a code block starts a line, as in words(). A line with no words and no
 * picture is no block, and a line whose only words are pictures is a block of pictures.
 */
export function blocksOf(html: string, load: (html: string) => ParentNode, marks: BlockMarks): TextBlock[] {
	const out: TextBlock[] = [];
	let line: { kind: TextBlockKind; text: string; words: boolean; pictures: boolean } | null = null;
	const open = (kind: TextBlockKind) => (line ??= { kind, text: '', words: false, pictures: false });
	const add = (kind: TextBlockKind, words: string) => {
		const l = open(kind);
		l.text += words;
		if (/\S/.test(words)) l.words = true;
	};
	const end = () => {
		if (!line) return;
		const text = norm(line.text);
		if (text) out.push({ kind: line.pictures && !line.words ? 'picture' : line.kind, text });
		line = null;
	};
	function walk(node: ParentNode, kind: TextBlockKind) {
		for (const child of node.childNodes) {
			if (child.nodeType === 3) {
				const data = (child as Text).data.replaceAll(ZWS, '');
				if (kind !== 'code') {
					add(kind, data);
					continue;
				}
				data.split('\n').forEach((part, i) => {
					if (i > 0) end();
					add(kind, part);
				});
			} else if (child.nodeType === 1) {
				const el = child as Element;
				if (el.nodeName === 'BR') end();
				else if (el.nodeName === 'IMG') {
					const l = open(kind);
					l.text += ` ${marks.picture(el.getAttribute('src') ?? '', el.getAttribute('alt') ?? '')} `;
					l.pictures = true;
				} else if (el.nodeName === 'HR') {
					end();
					const text = norm(marks.divider);
					if (text) out.push({ kind: 'divider', text });
				} else if (LINE_BLOCK.test(el.nodeName)) {
					end();
					walk(el, kindIn(el.nodeName, kind));
					end();
				} else {
					walk(el, kind);
					const href = el.nodeName === 'A' ? el.getAttribute('href') : null;
					if (href) add(kind, ` ${marks.link(href)}`);
				}
			}
		}
	}
	walk(load(html), 'paragraph');
	end();
	return out;
}

/** 0: the item stays, 1: only the old side holds it, 2: only the new side holds it. */
type Op = 0 | 1 | 2;

/**
 * The Myers diff of two lists, as one op for each item of either list in order, or null when the two
 * lists need more than maxD inserts and deletes. Equal items at the start and the end are trimmed first.
 */
function myers<T>(a: readonly T[], b: readonly T[], maxD: number): Op[] | null {
	let head = 0;
	while (head < a.length && head < b.length && a[head] === b[head]) head++;
	let tail = 0;
	while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;
	const x0 = a.slice(head, a.length - tail);
	const y0 = b.slice(head, b.length - tail);
	const n = x0.length;
	const m = y0.length;
	const max = n + m;
	const off = max + 1;
	const v = new Int32Array(2 * max + 3);
	// The trace keeps the part -d..d of v before each round d.
	const trace: Int32Array[] = [];
	let found = -1;
	for (let d = 0; d <= Math.min(max, maxD) && found < 0; d++) {
		trace.push(v.slice(off - d, off + d + 1));
		for (let k = -d; k <= d; k += 2) {
			let x = k === -d || (k !== d && (v[off + k - 1] ?? 0) < (v[off + k + 1] ?? 0)) ? (v[off + k + 1] ?? 0) : (v[off + k - 1] ?? 0) + 1;
			let y = x - k;
			while (x < n && y < m && x0[x] === y0[y]) {
				x++;
				y++;
			}
			v[off + k] = x;
			if (x >= n && y >= m) {
				found = d;
				break;
			}
		}
	}
	if (found < 0) return null;
	// Back from the end: each round d took one insert or one delete, and a run of equal items after it.
	const middle: Op[] = [];
	let x = n;
	let y = m;
	for (let d = found; d > 0; d--) {
		const past = trace[d] as Int32Array;
		const at = (k: number) => past[k + d] ?? 0;
		const k = x - y;
		const down = k === -d || (k !== d && at(k - 1) < at(k + 1));
		const pk = down ? k + 1 : k - 1;
		const px = at(pk);
		const py = px - pk;
		while (x > (down ? px : px + 1) && y > (down ? py + 1 : py)) {
			middle.push(0);
			x--;
			y--;
		}
		middle.push(down ? 2 : 1);
		if (down) y--;
		else x--;
	}
	while (x > 0 && y > 0) {
		middle.push(0);
		x--;
		y--;
	}
	middle.reverse();
	return [...Array<Op>(head).fill(0), ...middle, ...Array<Op>(tail).fill(0)];
}

const isHeading = (k: TextBlockKind) => /^h[1-6]$/.test(k);
const isItem = (k: TextBlockKind) => k === 'bullet' || k === 'number';

/** The mark at the start of a new block: a heading or an item that the old block `was` is not. */
function startMark(now: TextBlockKind, was: TextBlockKind | null): DiffWord[] {
	if (now === was) return [];
	if (isHeading(now)) return [{ text: '', block: 'heading' }];
	if (isItem(now)) return [{ text: '', block: 'item' }];
	return [];
}

/** A word, a run of white space, or one other character. */
const TOKEN = /\s+|[\p{L}\p{N}\p{M}'’_-]+|\S/gu;

/** The words of a changed pair, each changed word marked, or null for no word marks. */
function wordMarks(old: string, now: string, limit: number): { old: DiffWord[]; now: DiffWord[] } | null {
	const a = old.match(TOKEN) ?? [];
	const b = now.match(TOKEN) ?? [];
	if (a.length + b.length > limit) return null;
	const ops = myers(a, b, limit);
	if (!ops) return null;
	const left: { text: string; changed: boolean }[] = [];
	const right: { text: string; changed: boolean }[] = [];
	let i = 0;
	let j = 0;
	let shared = false;
	for (const op of ops) {
		if (op === 0) {
			const t = a[i++] ?? '';
			if (/\S/.test(t)) shared = true;
			left.push({ text: t, changed: false });
			right.push({ text: b[j++] ?? '', changed: false });
		} else if (op === 1) left.push({ text: a[i++] ?? '', changed: true });
		else right.push({ text: b[j++] ?? '', changed: true });
	}
	// A pair that shares no word shows no word marks: every word would be marked.
	if (!shared) return null;
	return { old: merge(left), now: merge(right) };
}

/** Joins the runs of one state, and marks a run of white space between two changed words. */
function merge(tokens: { text: string; changed: boolean }[]): DiffWord[] {
	tokens.forEach((t, k) => {
		if (!t.changed && !/\S/.test(t.text) && tokens[k - 1]?.changed && tokens[k + 1]?.changed) t.changed = true;
	});
	const out: DiffWord[] = [];
	for (const t of tokens) {
		const last = out.at(-1);
		if (last && !!last.changed === t.changed) last.text += t.text;
		else out.push(t.changed ? { text: t.text, changed: true } : { text: t.text });
	}
	return out;
}

type Indexed = TextBlock & { at: number };

/** The count of the blocks of `parts`, from `from`, whose words joined with one space are `whole`; 0 for none, or for fewer than two. */
function cover(whole: string, parts: readonly Indexed[], from: number): number {
	let acc = parts[from]?.text ?? '';
	if (!whole.startsWith(acc)) return 0;
	let k = 1;
	while (acc.length < whole.length && from + k < parts.length) {
		acc += ` ${parts[from + k]?.text ?? ''}`;
		k++;
		if (!whole.startsWith(acc)) return 0;
	}
	return acc === whole && k >= 2 ? k : 0;
}

type Anchor = { i: number; j: number; kind: 'split' | 'join'; k: number };

/** The nearest split or join of a run from (i, j), or null. */
function anchor(r: readonly Indexed[], s: readonly Indexed[], i: number, j: number): Anchor | null {
	const steps = r.length - i + (s.length - j);
	for (let step = 0; step <= steps; step++) {
		for (let di = Math.max(0, step - (s.length - j)); di <= Math.min(step, r.length - i - 1); di++) {
			const ri = i + di;
			const sj = j + step - di;
			const x = r[ri];
			const y = s[sj];
			if (!x || !y) continue;
			const split = cover(x.text, s, sj);
			if (split) return { i: ri, j: sj, kind: 'split', k: split };
			const join = cover(y.text, r, ri);
			if (join) return { i: ri, j: sj, kind: 'join', k: join };
		}
	}
	return null;
}

/** The lines of a run of changed blocks: the splits and the joins, and between them the pairs by place. */
function runLines(r: readonly Indexed[], s: readonly Indexed[], limit: number): DiffLine[] {
	const out: DiffLine[] = [];
	const search = r.length > 0 && s.length > 0 && r.length + s.length <= limit;
	let i = 0;
	let j = 0;
	while (i < r.length || j < s.length) {
		const hit = search ? anchor(r, s, i, j) : null;
		out.push(...pairLines(r.slice(i, hit ? hit.i : r.length), s.slice(j, hit ? hit.j : s.length), limit));
		if (!hit) break;
		if (hit.kind === 'split') {
			const x = r[hit.i] as Indexed;
			s.slice(hit.j, hit.j + hit.k).forEach((y, p) => {
				const words = [...startMark(y.kind, x.kind), { text: y.text }, ...(p < hit.k - 1 ? [{ text: '', block: 'split' as DiffBlock }] : [])];
				out.push({ kind: 'same', text: y.text, old: x.at + 1, new: y.at + 1, ...(words.length > 1 ? { words } : {}) });
			});
			i = hit.i + 1;
			j = hit.j + hit.k;
		} else {
			const y = s[hit.j] as Indexed;
			const parts = r.slice(hit.i, hit.i + hit.k);
			const words: DiffWord[] = [...startMark(y.kind, parts[0]?.kind ?? null)];
			parts.forEach((x, p) => {
				if (p > 0) words.push({ text: '', block: 'join' });
				words.push({ text: p > 0 ? ` ${x.text}` : x.text });
			});
			out.push({ kind: 'same', text: y.text, old: (parts[0]?.at ?? 0) + 1, new: y.at + 1, words });
			i = hit.i + hit.k;
			j = hit.j + 1;
		}
	}
	return out;
}

/** The lines of old blocks and new blocks that pair by their place: the removed lines, then the added lines. */
function pairLines(r: readonly Indexed[], s: readonly Indexed[], limit: number): DiffLine[] {
	const out: DiffLine[] = [];
	let removed: DiffLine[] = [];
	let added: DiffLine[] = [];
	for (let p = 0; p < Math.max(r.length, s.length); p++) {
		const x = r[p];
		const y = s[p];
		if (x && y && x.text === y.text) {
			// The same words with another kind, in a run: the pairs before it come first.
			out.push(...removed, ...added, ...sameLines(x, y));
			removed = [];
			added = [];
			continue;
		}
		const marks = x && y ? wordMarks(x.text, y.text, limit) : null;
		if (x) removed.push({ kind: 'removed', text: x.text, old: x.at + 1, ...(marks ? { words: marks.old } : {}) });
		if (y) {
			const start = startMark(y.kind, x?.kind ?? null);
			const words = [...start, ...(marks ? marks.now : start.length > 0 ? [{ text: y.text }] : [])];
			added.push({ kind: 'added', text: y.text, new: y.at + 1, ...(x ? { replaces: x.at + 1 } : {}), ...(words.length > 0 ? { words } : {}) });
		}
	}
	return [...out, ...removed, ...added];
}

/** The lines of a block that keeps its words: one line with the mark of its new kind, or a removed and an added line for any other change of kind. */
function sameLines(x: Indexed, y: Indexed): DiffLine[] {
	if (x.kind === y.kind) return [{ kind: 'same', text: y.text, old: x.at + 1, new: y.at + 1 }];
	const start = startMark(y.kind, x.kind);
	if (start.length > 0) return [{ kind: 'same', text: y.text, old: x.at + 1, new: y.at + 1, words: [...start, { text: y.text }] }];
	return [
		{ kind: 'removed', text: x.text, old: x.at + 1 },
		{ kind: 'added', text: y.text, new: y.at + 1, replaces: x.at + 1 }
	];
}

/** The lines of a diff of kind text from the blocks `a` of the old text to the blocks `b` of the new text. */
export function diffBlocks(a: readonly TextBlock[], b: readonly TextBlock[], limit: number = DIFF_LIMIT): DiffLine[] {
	const x = a.map((t, at) => ({ kind: t.kind, text: norm(t.text), at }));
	const y = b.map((t, at) => ({ kind: t.kind, text: norm(t.text), at }));
	const ops = myers(
		x.map((t) => t.text),
		y.map((t) => t.text),
		x.length + y.length
	) as Op[];
	const out: DiffLine[] = [];
	let i = 0;
	let j = 0;
	let r: Indexed[] = [];
	let s: Indexed[] = [];
	const flush = () => {
		if (r.length > 0 || s.length > 0) out.push(...runLines(r, s, limit));
		r = [];
		s = [];
	};
	for (const op of ops) {
		if (op === 0) {
			flush();
			out.push(...sameLines(x[i++] as Indexed, y[j++] as Indexed));
		} else if (op === 1) r.push(x[i++] as Indexed);
		else s.push(y[j++] as Indexed);
	}
	flush();
	return out;
}
