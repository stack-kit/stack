// A plain text as HTML of the writing tools (### rich-text-field in DESIGN.md, "Writing tools"): the
// value of a text model of a plain text, such as the value of a text area, and a whole text that a
// writing service gives as `plain`. Each line is a line of its own, as the engine writes a line. The file
// imports nothing, so the review chunk takes it with no DOM, and `node --test` runs it.

const ESCAPE: Readonly<Record<string, string>> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

/**
 * A whole text as a plain text, `plain`, whose line ends split its lines. It is a type of the review chunk
 * only: WritingResult of rich-text.ts does not hold it, no export path gives it, and the contract does
 * not hold it. The writing tools take it only from a field that sets `plain` in its WritingField
 * (writing.svelte.js). The rich text field does not set it, so a plain whole text fails there as a result
 * that is no WritingResult. A result that gives both `html` and `plain` takes `html`.
 */
export type PlainResult = { kind: 'text'; plain: string; title?: string | undefined; note?: string | undefined };

/**
 * The HTML of a plain text. Each "\n", "\r\n" and "\r" ends a line, so an empty line and an empty last
 * line count. Each line is a <div> that holds its characters as text. An empty line, and a line that holds
 * only white space, is <div><br></div>, because the load list drops a block whose text is only white space,
 * and the line would go. blocksOf() of diff.ts reads each line as a block of the kind paragraph, and an
 * empty line as an empty block, and an empty text gives one empty line, which is a text with no lines.
 */
export function plainHtml(plain: string): string {
	return plain
		.split(/\r\n|\r|\n/)
		.map((line) => (line.trim() === '' ? '<div><br></div>' : `<div>${line.replace(/[&<>]/g, (c) => ESCAPE[c] ?? c)}</div>`))
		.join('');
}
