// The Markdown marks of the rich text field (### rich-text-field in DESIGN.md, "Markdown as you type"):
// which typed text gives which format. The rules need no DOM, so node --test runs them
// (scripts/rich-text-markdown.test.mjs). After each typed character, the engine (engine.ts) gives the
// words of the line before the caret and the tools of the preset, and makes the change that a rule gives.
// A mark for a tool that the preset does not hold gives no rule, so it stays text.
import type { ToolId } from '../tools/commands.js';

/** A tool that a mark at the start of a plain line gives. */
export type BlockTool = 'h1' | 'h2' | 'h3' | 'bullet-list' | 'numbered-list' | 'quote' | 'code-block' | 'hr';

/** A tool that a pair of marks around words gives. */
export type InlineTool = 'bold' | 'italic' | 'strikethrough' | 'inline-code';

/** The mark is the first `length` characters of the line, and the line becomes `tool`. */
export type BlockMatch = { tool: BlockTool; length: number };

/** The words from `from` to `to` of the line take `tool`, and the mark of `mark` characters before and after them goes. */
export type InlineMatch = { tool: InlineTool; from: number; to: number; mark: number };

/** A no-break space is a space: a browser types one at the end of a line. */
const spaces = (text: string) => text.replace(/\u00a0/g, ' ');

/**
 * The block that a mark at the start of a plain line gives. `before` is the line before the caret, with
 * the typed character last, and `after` is the line after the caret. A heading, a list and a quote take
 * a space after the mark, and the rest of the line stays. A divider and a code block take a line that
 * holds the mark alone.
 */
export function blockMatch(before: string, after: string, tools: ReadonlySet<ToolId>): BlockMatch | null {
	const line = spaces(before);
	const alone = spaces(after) === '';
	let tool: BlockTool | null = null;
	const heading = /^(#{1,6}) $/.exec(line);
	if (heading) tool = ({ 1: 'h1', 2: 'h2', 3: 'h3' } as const)[(heading[1] ?? '').length as 1] ?? null;
	else if (line === '- ' || line === '* ') tool = 'bullet-list';
	else if (line === '1. ') tool = 'numbered-list';
	else if (line === '> ') tool = 'quote';
	else if (line === '---' && alone) tool = 'hr';
	else if (line === '```' && alone) tool = 'code-block';
	return tool && tools.has(tool) ? { tool, length: line.length } : null;
}

/** The marks of words, the longer mark of a character first. */
const PAIRS: readonly { mark: string; tool: InlineTool }[] = [
	{ mark: '**', tool: 'bold' },
	{ mark: '__', tool: 'bold' },
	{ mark: '~~', tool: 'strikethrough' },
	{ mark: '*', tool: 'italic' },
	{ mark: '_', tool: 'italic' },
	{ mark: '`', tool: 'inline-code' }
];

const WORD = /[\p{L}\p{N}]/u;
const SPACE = /\s/;

/** The pair of `mark` that the last characters of `line` close, or null. */
function pairOf(line: string, mark: string, tool: InlineTool): InlineMatch | null {
	const ch = mark[0] ?? '';
	const code = tool === 'inline-code';
	if (!line.endsWith(mark)) return null;
	const to = line.length - mark.length;
	// The words stand between the two marks and hold no character of the mark.
	const open = line.lastIndexOf(ch, to - 1);
	if (open < 0) return null;
	const from = open + 1;
	const words = line.slice(from, to);
	const start = from - mark.length;
	if (words === '' || start < 0 || line.slice(start, from) !== mark) return null;
	// A mark of the same character just before the pair makes it another pair, such as *** or ``.
	const outside = line[start - 1];
	if (outside === ch) return null;
	if (code) return words.trim() === '' ? null : { tool, from, to, mark: mark.length };
	// The words do not start or end with a space, and a letter or a digit does not stand just before the
	// first mark, so snake_case_name and 2*3*4 stay text.
	if (SPACE.test(words[0] ?? '') || SPACE.test(words.at(-1) ?? '')) return null;
	if (outside !== undefined && WORD.test(outside)) return null;
	return { tool, from, to, mark: mark.length };
}

/**
 * The mark of words that the typed character closes: `before` is the line before the caret, with the
 * typed character last. **words** and __words__ give bold, *words* and _words_ italic, ~~words~~
 * strikethrough, and `words` inline code.
 */
export function inlineMatch(before: string, tools: ReadonlySet<ToolId>): InlineMatch | null {
	const line = spaces(before);
	for (const { mark, tool } of PAIRS) {
		if (!tools.has(tool)) continue;
		const pair = pairOf(line, mark, tool);
		if (pair) return pair;
	}
	return null;
}
