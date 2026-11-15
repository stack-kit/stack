// The lines of the text of the rich text field, as a person sees them: each block, each line break and
// each line of a code block starts a line. words(), a proposed change and a TextRange count these lines.
import type { TextRange } from '#lib/stack/rich-text.js';

const LINE_BLOCK = /^(?:ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|DD|DIV|DL|DT|FIGCAPTION|FIGURE|FOOTER|H[1-6]|HEADER|HR|LI|OL|P|PRE|SECTION|TABLE|TR|UL)$/;
/** The zero-width space that Squire writes; it is no character of a line. */
export const ZWS = '​';

/** A run of characters of one text node in one line: `offsets[k]` is the offset in the node of character k, and the last entry its end. */
type Piece = { node: Text; line: number; start: number; offsets: number[] };
export type Lines = { lines: string[]; pieces: Piece[] };

/** The lines of the text and the place of each character. A zero-width space is no character, and a no-break space is a space. */
export function readLines(root: HTMLElement): Lines {
	const lines = [''];
	const pieces: Piece[] = [];
	let pending = false;
	const newLine = () => {
		lines.push('');
		pending = false;
	};
	const last = () => lines.length - 1;

	/** True when no content follows the line break in its line, so that it makes no line. */
	function trailing(br: Node): boolean {
		for (let n: Node = br; ; ) {
			for (let s = n.nextSibling; s; s = s.nextSibling) {
				if (s instanceof Text) {
					if (s.data.replaceAll(ZWS, '') !== '') return false;
					continue;
				}
				return s instanceof Element && LINE_BLOCK.test(s.nodeName);
			}
			const p = n.parentNode;
			if (!p || p === root || (p instanceof Element && LINE_BLOCK.test(p.nodeName))) return true;
			n = p;
		}
	}

	function walk(node: Node, pre: boolean) {
		for (let child = node.firstChild; child; child = child.nextSibling) {
			if (child instanceof Text) {
				const data = child.data;
				let piece: Piece | null = null;
				for (let i = 0; i < data.length; i++) {
					const c = data[i] ?? '';
					if (c === ZWS) continue;
					if (c === '\n' && pre) {
						piece?.offsets.push(i);
						piece = null;
						if (pending) newLine();
						pending = true;
						continue;
					}
					if (!piece) {
						if (pending) newLine();
						piece = { node: child, line: last(), start: (lines[last()] ?? '').length, offsets: [] };
						pieces.push(piece);
					}
					piece.offsets.push(i);
					lines[last()] += c === ' ' || (!pre && /[\n\r\t]/.test(c)) ? ' ' : c;
				}
				piece?.offsets.push(data.length);
			} else if (child instanceof Element) {
				if (child.nodeName === 'BR') {
					if (!trailing(child)) {
						if (pending) newLine();
						pending = true;
					}
				} else if (LINE_BLOCK.test(child.nodeName)) {
					if (pending || lines[last()] !== '') newLine();
					walk(child, pre || child.nodeName === 'PRE');
					pending = true;
				} else walk(child, pre);
			}
		}
	}
	walk(root, false);
	return { lines, pieces };
}

/** The place [line, offset] of a boundary point of a range in the lines. */
export function pointOf(model: Lines, container: Node, offset: number): [number, number] {
	if (container instanceof Text) {
		const own = model.pieces.filter((p) => p.node === container);
		let best = own[0];
		for (const p of own) if ((p.offsets[0] ?? 0) <= offset) best = p;
		if (best) {
			let k = 0;
			while (k < best.offsets.length - 1 && (best.offsets[k] ?? 0) < offset) k++;
			return [best.line, best.start + k];
		}
	}
	// The first character after the point.
	const probe = document.createRange();
	probe.setStart(container, offset);
	for (const p of model.pieces) if (probe.comparePoint(p.node, p.offsets[0] ?? 0) >= 0) return [p.line, p.start];
	const end = model.lines.length - 1;
	return [end, (model.lines[end] ?? '').length];
}

/** The range of the characters [from, to) of a line, or null when they do not stand in the line. */
export function rangeOf(model: Lines, line: number, from: number, to: number): Range | null {
	const own = model.pieces.filter((p) => p.line === line);
	const at = (col: number, end: boolean): [Text, number] | null => {
		for (const p of own) {
			const len = p.offsets.length - 1;
			const inside = end ? col > p.start && col <= p.start + len : col >= p.start && col < p.start + len;
			const offset = p.offsets[col - p.start];
			if (inside && offset !== undefined) return [p.node, offset];
		}
		return null;
	};
	const a = at(from, false);
	const b = at(to, true);
	if (!a || !b) return null;
	const range = document.createRange();
	range.setStart(a[0], a[1]);
	range.setEnd(b[0], b[1]);
	return range;
}

/**
 * The boundary point before the character `col` of a line, or after the last character of the line for a
 * col past its end; the last line for a line past the end. null when the line holds no character.
 */
export function caretAt(model: Lines, line: number, col: number): [Text, number] | null {
	const own = model.pieces.filter((p) => p.line === Math.min(line, model.lines.length - 1));
	for (const p of own) {
		const len = p.offsets.length - 1;
		if (col >= p.start && col <= p.start + len) return [p.node, p.offsets[col - p.start] ?? 0];
	}
	const last = own.at(-1);
	return last ? [last.node, last.offsets.at(-1) ?? 0] : null;
}

/** The index of `old` in `text` when it stands there exactly once, else -1. */
export function onceIn(text: string, old: string): number {
	if (!old) return -1;
	const i = text.indexOf(old);
	return i >= 0 && text.indexOf(old, i + 1) < 0 ? i : -1;
}

/** A range of the text as a part of the words, with no white space at its ends; null when it holds none. */
export function textRange(model: Lines, range: Range): TextRange | null {
	const all = model.lines.join('\n');
	const starts: number[] = [];
	let at = 0;
	for (const line of model.lines) {
		starts.push(at);
		at += line.length + 1;
	}
	const flat = ([l, c]: [number, number]) => (starts[l] ?? 0) + c;
	const place = (i: number): [number, number] => {
		let l = 0;
		while (l + 1 < starts.length && (starts[l + 1] ?? 0) <= i) l++;
		return [l, i - (starts[l] ?? 0)];
	};
	let a = flat(pointOf(model, range.startContainer, range.startOffset));
	let b = flat(pointOf(model, range.endContainer, range.endOffset));
	if (b < a) [a, b] = [b, a];
	while (a < b && /\s/.test(all[a] ?? '')) a++;
	while (b > a && /\s/.test(all[b - 1] ?? '')) b--;
	if (a === b) return null;
	return { from: place(a), to: place(b), text: all.slice(a, b) };
}
