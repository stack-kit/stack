// "## Email" of DESIGN.md, read at build time: the hex values of "### Email colors" for each theme,
// and the code blocks of the section. The preview never keeps a copy of a value.
import raw from '../../../../DESIGN.md?raw';
import { ROLES, type Colors } from './email.js';

/** The lines of "## Email", up to the next "## " heading outside a fence. */
function emailSection(text: string): string[] {
	const lines = text.split('\n');
	const start = lines.indexOf('## Email');
	if (start < 0) throw new Error('DESIGN.md has no "## Email" section.');
	let fence = false;
	const out: string[] = [];
	for (const line of lines.slice(start + 1)) {
		if (line.startsWith('```')) fence = !fence;
		if (!fence && line.startsWith('## ')) break;
		out.push(line);
	}
	return out;
}

const section = emailSection(raw);

/** The values of the table whose first column is "Role", one set of colors for each theme column. */
function readColors(lines: string[]): Record<string, Colors> {
	const start = lines.indexOf('### Email colors');
	const rows = lines
		.slice(start + 1)
		.filter((l, i, all) => l.startsWith('|') && !all.slice(0, i).some((x) => x.startsWith('### ')))
		.map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
	const head = rows.findIndex((r) => r[0] === 'Role');
	if (start < 0 || head < 0) throw new Error('DESIGN.md: "### Email colors" has no table whose first column is "Role".');
	const unquote = (c: string) => /^`(.*)`$/.exec(c)?.[1] ?? c;
	const themes = rows[head].map((c, i) => [unquote(c), i] as const).filter(([, i]) => i >= 2);
	const body: string[][] = [];
	for (const r of rows.slice(head + 2)) {
		if (!ROLES.includes(unquote(r[0]) as (typeof ROLES)[number])) break;
		body.push(r);
	}
	const out: Record<string, Colors> = {};
	for (const [theme, i] of themes) {
		const set = Object.fromEntries(body.map((r) => [unquote(r[0]), unquote(r[i])]));
		const missing = ROLES.filter((role) => !/^#[0-9a-f]{6}$/.test(set[role] ?? ''));
		if (missing.length) throw new Error(`DESIGN.md: "### Email colors" lacks a hex value of ${missing.join(', ')} for ${theme}.`);
		out[theme] = set as Colors;
	}
	return out;
}

/** The fenced code blocks of one language in "## Email", in their order. */
function blocks(lines: string[], lang: string): string[] {
	const out: string[] = [];
	let current: string[] | null = null;
	for (const line of lines) {
		if (current) {
			if (line === '```') {
				out.push(current.join('\n'));
				current = null;
			} else current.push(line);
		} else if (line === '```' + lang) current = [];
	}
	return out;
}

export const emailColors = readColors(section);
export const htmlBlocks = blocks(section, 'html');
export const textBlocks = blocks(section, 'text');
