// The inline styles of rich text in an email (richTextStyles of preview/src/lib/email/email.ts), as
// "### Rich text in an email" in DESIGN.md gives them: the table in the colors of each theme of "### Email
// colors", one style for each tag of the server list of ### rich-text-field, the sides of a right-to-left
// email, and the check of each color.
//
//   node --test scripts/email.test.mjs
//
// The module imports only the list of roles, a plain file, so Node runs it with its type stripping.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { MONO, ROLES, SANS, richTextStyles } from '../preview/src/lib/email/email.ts';

const design = readFileSync(new URL('../DESIGN.md', import.meta.url), 'utf8').split('\n');

/** The lines of a section of DESIGN.md, up to the next heading of level 2 or 3. */
function sectionOf(heading) {
	const start = design.indexOf(heading);
	assert.ok(start >= 0, `DESIGN.md has the section ${heading}`);
	const out = [];
	for (const line of design.slice(start + 1)) {
		if (/^#{2,3} /.test(line)) break;
		out.push(line);
	}
	return out;
}
const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
const unquote = (c) => /^`(.*)`$/.exec(c)?.[1] ?? c;

/** The hex values of the roles of "### Email colors", for each theme column. */
function themes() {
	const rows = sectionOf('### Email colors').filter((l) => l.startsWith('|')).map(cells);
	const head = rows.findIndex((r) => r[0] === 'Role');
	const names = rows[head].slice(2).map(unquote);
	const body = rows.slice(head + 2).filter((r) => ROLES.includes(unquote(r[0])));
	return Object.fromEntries(names.map((name, i) => [name, Object.fromEntries(body.map((r) => [unquote(r[0]), unquote(r[i + 2])]))]));
}

/** The table of "### Rich text in an email", in the colors of a theme. */
function table(c) {
	const out = {};
	for (const line of sectionOf('### Rich text in an email').filter((l) => l.startsWith('| `'))) {
		const [tags, style] = cells(line);
		const value = style === 'none' ? '' : unquote(style).replace(/\{([a-z-]+)\}/g, (_, k) => (k === 'sans' ? SANS : k === 'mono' ? MONO : c[k]));
		for (const m of tags.matchAll(/`([a-z0-9]+)`/g)) out[m[1]] = value;
	}
	return out;
}

test('richTextStyles gives the table of DESIGN.md in the colors of each theme', () => {
	const all = themes();
	assert.ok(Object.keys(all).length >= 2, `### Email colors has a column for each theme: ${Object.keys(all).join(', ')}`);
	for (const [name, c] of Object.entries(all)) assert.deepEqual({ ...richTextStyles(c) }, table(c), name);
});

test('the table gives one style for each tag of the server list of ### rich-text-field', () => {
	const purpose = sectionOf('### rich-text-field').find((l) => l.startsWith('**Purpose.**')) ?? '';
	const list = /the tags ((?:`[a-z0-9]+`(?:, | and )?)+);/.exec(purpose)?.[1] ?? '';
	const tags = [...list.matchAll(/`([a-z0-9]+)`/g)].map((m) => m[1]).sort();
	assert.ok(tags.length > 10, `the purpose of ### rich-text-field names the tags of the server list: ${tags.join(', ')}`);
	assert.deepEqual(Object.keys(richTextStyles(themes().default)).sort(), tags);
});

test('a right-to-left email puts the indent of a list and the edge of a quote on the right, and changes nothing else', () => {
	const c = themes().default;
	const ltr = richTextStyles(c);
	const rtl = richTextStyles(c, 'rtl');
	assert.equal(rtl.ul, 'margin:0; padding:0 24px 0 0;');
	assert.equal(rtl.ol, rtl.ul);
	assert.equal(rtl.blockquote, `margin:4px 0; padding:0 12px 0 0; border-right:1px solid ${c.border};`);
	for (const tag of Object.keys(ltr).filter((t) => !['ul', 'ol', 'blockquote'].includes(t))) assert.equal(rtl[tag], ltr[tag], tag);
});

test('a color that is no hex value stops the function, so a value never carries another property', () => {
	const c = { ...themes().default, link: 'red; background:url(javascript:alert(1))' };
	assert.throws(() => richTextStyles(c), /hex value/);
});
