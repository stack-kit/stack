// "## Print" of DESIGN.md, read at build time: the css block of "### Print template". The page /print
// renders the sample report with this block as it stands, so the template of DESIGN.md and the
// preview never differ, and the preview keeps no copy of a print value.
import raw from '../../../../DESIGN.md?raw';

/** The lines of "## Print", up to the next "## " heading outside a fence. */
function printSection(text: string): string[] {
	const lines = text.split('\n');
	const start = lines.indexOf('## Print');
	if (start < 0) throw new Error('DESIGN.md has no "## Print" section.');
	let fence = false;
	const out: string[] = [];
	for (const line of lines.slice(start + 1)) {
		if (line.startsWith('```')) fence = !fence;
		if (!fence && line.startsWith('## ')) break;
		out.push(line);
	}
	return out;
}

/** The first css block after "### Print template". */
function templateCss(lines: string[]): string {
	const start = lines.indexOf('### Print template');
	const open = lines.indexOf('```css', start);
	const close = lines.indexOf('```', open + 1);
	if (start < 0 || open < 0 || close < 0) {
		throw new Error('DESIGN.md: "### Print template" in "## Print" has no css block.');
	}
	return lines.slice(open + 1, close).join('\n');
}

export const printCss = templateCss(printSection(raw));
