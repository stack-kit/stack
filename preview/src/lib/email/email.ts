// An email, as "## Email" in DESIGN.md gives it: the HTML part with inline styles,
// and the plain text part. Each function is pure and takes the colors as plain values, so the
// preview renders an email in the light values of each theme. The module imports only the list of
// roles, a plain file, so Node also runs it. guard.ts compares its output with the code blocks of
// "## Email".
import { EMAIL_ROLES } from '../../../../scripts/lib/email-roles.mjs';

/** The roles of "### Email colors", in the order of its table. scripts/lib/email-roles.mjs is the one source. */
export const ROLES = EMAIL_ROLES;
export type Role = (typeof ROLES)[number];
export type Colors = Record<Role, string>;
export type StateRole = 'success' | 'warning' | 'destructive';

export const SANS =
	"'Inter Variable', Inter, 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = 'ui-monospace, Menlo, Consolas, monospace';

export type Link = { label: string; url: string };
export type Fact = { label: string; value: string; strong?: boolean };
export type Figure = { label: string; value: string; change: string };
export type Table = {
	heading: string;
	columns: { label: string; numeric?: boolean }[];
	rows: string[][];
	more: string;
};

/** A block of the body. The first column of a table holds identifiers, so it takes weight 500. */
export type Block =
	| { kind: 'text'; text: string }
	| { kind: 'state'; role: StateRole; word: string; rest: string }
	| { kind: 'facts'; facts: Fact[] }
	| { kind: 'figures'; figures: Figure[] }
	| { kind: 'table'; table: Table }
	| { kind: 'log'; caption: string; lines: string[] };

export type Email = {
	lang: string;
	/** The direction of the text, "ltr" or "rtl". */
	dir: string;
	subject: string;
	preheader: string;
	product: string;
	workspace?: string;
	heading: string;
	body: Block[];
	action: Link;
	after: string[];
	links: Link[];
	why: string;
	stop?: Link;
	sender: string;
};

// The type steps of "### Email type". The family goes on each element that holds text.
const type = {
	heading: `font-family:${SANS}; font-size:20px; line-height:28px; font-weight:600; letter-spacing:-0.01em;`,
	section: `font-family:${SANS}; font-size:16px; line-height:24px; font-weight:600;`,
	body: `font-family:${SANS}; font-size:15px; line-height:24px; font-weight:400;`,
	value: `font-family:${SANS}; font-size:15px; line-height:24px; font-weight:500;`,
	mark: `font-family:${SANS}; font-size:15px; line-height:20px; font-weight:600;`,
	small: `font-family:${SANS}; font-size:13px; line-height:20px; font-weight:400;`,
	head: `font-family:${SANS}; font-size:13px; line-height:20px; font-weight:500;`,
	label: `font-family:${SANS}; font-size:13px; line-height:24px; font-weight:400;`,
	figure: `font-family:${SANS}; font-size:28px; line-height:36px; font-weight:600;`,
	code: `font-family:${MONO}; font-size:13px; line-height:20px; font-weight:400;`
};

const LAYOUT = 'role="presentation" cellpadding="0" cellspacing="0" border="0"';
const NUMS = ' font-variant-numeric:tabular-nums;';

/** Escapes text for HTML. The samples hold no markup, so every text goes through it. */
function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** An address for an href: absolute, and https only, so a value never supplies another scheme. */
function href(url: string): string {
	if (!url.startsWith('https://')) throw new Error(`An address in an email starts with https://, and ${JSON.stringify(url)} does not.`);
	return esc(url);
}

/** A color for a style: a hex value only, so a value never carries markup or another property. Both `html` and `blockLines` check it. */
function checkColors(c: Colors): void {
	for (const role of ROLES) {
		if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c[role])) {
			throw new Error(`A color in an email is a hex value such as #1a2b3c, and the color ${JSON.stringify(c[role])} of the role ${role} is not.`);
		}
	}
}

/**
 * An identifier in a column of identifiers: tabular figures on its number part only, so that the
 * hyphen keeps its width, as "### Type steps" of DESIGN.md asks.
 */
function identifier(s: string): string {
	const m = /^(.*?)(\d+)$/.exec(s);
	return m ? `${esc(m[1] ?? '')}<span style="font-variant-numeric:tabular-nums;">${m[2]}</span>` : esc(s);
}

const indent = (n: number, lines: string[]) => lines.map((l) => (l ? ' '.repeat(n) + l : l));

/** One row of the column: a cell with its top padding, around the lines of a block. */
function row(top: number, inner: string[], extra = ''): string[] {
	const style = [top ? `padding-top:${top}px;` : '', extra].filter(Boolean).join(' ');
	return ['<tr>', `  <td style="${style}">`, ...indent(4, inner), '  </td>', '</tr>'];
}

function p(style: string, color: string, html: string, margin = '0'): string {
	return `<p style="margin:${margin}; ${style} color:${color};">${html}</p>`;
}

function a(link: Link, style: string, color: string): string {
	return `<a href="${href(link.url)}" style="${style} color:${color}; text-decoration:underline;">${esc(link.label)}</a>`;
}

/** The head: the mark of the product in text, the workspace, and the rule under them. */
function head(e: Email, c: Colors): string[] {
	const workspace = e.workspace ? `<span style="font-weight:400; color:${c['muted-foreground']};"> · ${esc(e.workspace)}</span>` : '';
	return [
		'<tr>',
		`  <td style="padding-bottom:16px; border-bottom:1px solid ${c.border};">`,
		`    ${p(type.mark, c.foreground, esc(e.product) + workspace)}`,
		'  </td>',
		'</tr>'
	];
}

function heading(e: Email, c: Colors): string[] {
	return row(24, [`<h1 style="margin:0; ${type.heading} color:${c.foreground};">${esc(e.heading)}</h1>`]);
}

/** The lines of one block, with no outer row. "### Email template" of DESIGN.md shows these. */
export function blockLines(block: Block, c: Colors): string[] {
	checkColors(c);
	switch (block.kind) {
		case 'text':
			return [p(type.body, c.foreground, esc(block.text))];
		case 'state':
			return [
				p(
					type.body,
					c.foreground,
					`<span aria-hidden="true" style="color:${c[block.role]};">●</span> <span style="font-weight:500;">${esc(block.word)}</span><span style="color:${c['muted-foreground']};"> · ${esc(block.rest)}</span>`
				)
			];
		case 'facts':
			return [
				`<table ${LAYOUT} width="100%" bgcolor="${c.card}" style="background-color:${c.card}; border:1px solid ${c.border}; border-radius:8px; border-collapse:separate;">`,
				'  <tr>',
				'    <td style="padding:12px 16px;">',
				`      <table ${LAYOUT} width="100%">`,
				...block.facts.flatMap((f) => [
					'        <tr>',
					`          <td width="112" valign="top" style="width:112px; padding:4px 0; ${type.label} color:${c['muted-foreground']};">${esc(f.label)}</td>`,
					f.strong
						? `          <td valign="top" style="padding:4px 0 4px 16px; ${type.value} color:${c.foreground};">${esc(f.value)}</td>`
						: `          <td valign="top" style="padding:4px 0 4px 16px; ${type.body} color:${c.foreground};${NUMS}">${esc(f.value)}</td>`,
					'        </tr>'
				]),
				'      </table>',
				'    </td>',
				'  </tr>',
				'</table>'
			];
		case 'figures': {
			const bands: string[] = [];
			for (let i = 0; i < block.figures.length; i += 2) {
				bands.push('  <tr>');
				block.figures.slice(i, i + 2).forEach((f, j) => {
					const pad = j === 0 ? '12px 16px 12px 0' : '12px 0 12px 16px';
					bands.push(
						`    <td width="50%" valign="top" style="width:50%; padding:${pad}; border-bottom:1px solid ${c.border};">`,
						`      ${p(type.small, c['muted-foreground'], esc(f.label))}`,
						`      ${p(type.figure + NUMS, c.foreground, esc(f.value), '4px 0 0')}`,
						`      ${p(type.small, c['muted-foreground'], esc(f.change), '4px 0 0')}`,
						'    </td>'
					);
				});
				bands.push('  </tr>');
			}
			return [`<table ${LAYOUT} width="100%" style="border-top:1px solid ${c.border};">`, ...bands, '</table>'];
		}
		case 'table': {
			const t = block.table;
			const side = (i: number) => (t.columns[i]?.numeric ? 'right' : 'left');
			const pad = (i: number) => (i === t.columns.length - 1 ? '8px 0' : '8px 12px 8px 0');
			return [
				`<h2 style="margin:0 0 8px; ${type.section} color:${c.foreground};">${esc(t.heading)}</h2>`,
				'<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">',
				'  <tr>',
				...t.columns.map(
					(col, i) =>
						`    <th scope="col" align="${side(i)}" style="padding:${pad(i)}; border-bottom:1px solid ${c.border}; ${type.head} color:${c['muted-foreground']}; text-align:${side(i)};">${esc(col.label)}</th>`
				),
				'  </tr>',
				...t.rows.flatMap((cells) => [
					'  <tr>',
					...cells.map((cell, i) =>
						i === 0
							? `    <td align="${side(i)}" style="padding:${pad(i)}; border-bottom:1px solid ${c.border}; ${type.value} color:${c.foreground}; text-align:${side(i)};">${identifier(cell)}</td>`
							: `    <td align="${side(i)}" style="padding:${pad(i)}; border-bottom:1px solid ${c.border}; ${type.body} color:${c.foreground}; text-align:${side(i)};${NUMS}">${esc(cell)}</td>`
					),
					'  </tr>'
				]),
				'</table>',
				p(type.small, c['muted-foreground'], esc(t.more), '8px 0 0')
			];
		}
		case 'log':
			return [
				p(type.small, c['muted-foreground'], esc(block.caption), '0 0 8px'),
				`<table ${LAYOUT} width="100%">`,
				'  <tr>',
				`    <td bgcolor="${c.muted}" style="padding:12px 16px; border-radius:8px; background-color:${c.muted}; ${type.code} color:${c.foreground};">${block.lines.map(esc).join('<br>')}</td>`,
				'  </tr>',
				'</table>'
			];
	}
}

/** The gap above a block: 8 px under the heading, 16 px between two texts, 24 px elsewhere. */
function gap(block: Block, prev: Block | null): number {
	if (!prev) return block.kind === 'text' || block.kind === 'state' ? 8 : 16;
	if (block.kind === 'text' && (prev.kind === 'text' || prev.kind === 'state')) return 16;
	return 24;
}

/**
 * The primary action: a table cell with the ground, the radius and a 1 px edge in border, around a
 * link with the padding. The edge does not show in light. It outlines the button when a client
 * darkens the light colors and keeps the dark ground of the button.
 */
function buttonLines(link: Link, c: Colors): string[] {
	return [
		`<table ${LAYOUT}>`,
		'  <tr>',
		`    <td bgcolor="${c.primary}" style="border:1px solid ${c.border}; border-radius:8px; background-color:${c.primary}; mso-padding-alt:11px 19px;">`,
		`      <a href="${href(link.url)}" style="display:inline-block; padding:11px 19px; border-radius:8px; ${type.mark} color:${c['primary-foreground']}; text-decoration:none;">${esc(link.label)}</a>`,
		'    </td>',
		'  </tr>',
		'</table>'
	];
}

/** The full address of the action, as a plain line under the button. */
function addressLines(link: Link, c: Colors): string[] {
	const url = { label: link.url, url: link.url };
	return [`<p style="margin:0; ${type.code} color:${c['muted-foreground']}; word-break:break-all;">${a(url, type.code, c['muted-foreground'])}</p>`];
}

/** The foot: the reason, the line that stops the email where a person can stop it, and the sender. */
function footLines(e: Email, c: Colors): string[] {
	const muted = c['muted-foreground'];
	return [
		`<table ${LAYOUT} width="100%">`,
		'  <tr>',
		`    <td style="padding-top:16px; border-top:1px solid ${c.border};">`,
		`      ${p(type.small, muted, esc(e.why))}`,
		...(e.stop ? [`      ${p(type.small, muted, a(e.stop, type.small, muted), '8px 0 0')}`] : []),
		`      ${p(type.small, muted, esc(e.sender), '8px 0 0')}`,
		'    </td>',
		'  </tr>',
		'</table>'
	];
}

// The preheader is followed by pairs of a combining grapheme joiner and a no-break space, so that
// an inbox list shows no text of the body after it.
const FILL = '&#847;&#160;'.repeat(30);

/** The HTML part: a full document with inline styles only. */
export function html(e: Email, c: Colors): string {
	checkColors(c);
	let prev: Block | null = null;
	const body = e.body.flatMap((block) => {
		const lines = row(gap(block, prev), blockLines(block, c));
		prev = block;
		return lines;
	});
	const column = [
		...head(e, c),
		...heading(e, c),
		...body,
		...row(24, buttonLines(e.action, c)),
		...row(12, addressLines(e.action, c)),
		...e.after.flatMap((t, i) => row(i === 0 ? 24 : 16, [p(type.body, c.foreground, esc(t))])),
		...e.links.flatMap((l, i) => row(i === 0 ? 24 : 8, [p(type.body, c.link, a(l, type.body, c.link))])),
		...row(32, footLines(e, c))
	];
	return [
		'<!DOCTYPE html>',
		`<html lang="${esc(e.lang)}" dir="${esc(e.dir)}">`,
		'<head>',
		'<meta charset="utf-8">',
		'<meta name="viewport" content="width=device-width, initial-scale=1">',
		'<meta name="x-apple-disable-message-reformatting">',
		'<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">',
		`<title>${esc(e.subject)}</title>`,
		'</head>',
		`<body style="margin:0; padding:0; background-color:${c.background};">`,
		`  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${esc(e.preheader)}${FILL}</div>`,
		`  <table ${LAYOUT} width="100%" lang="${esc(e.lang)}" dir="${esc(e.dir)}" bgcolor="${c.background}" style="background-color:${c.background};">`,
		'    <tr>',
		'      <td style="padding:24px 16px 32px;">',
		'        <!--[if mso]><table role="presentation" width="568" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->',
		`        <table ${LAYOUT} width="100%" style="max-width:568px;">`,
		...indent(10, column),
		'        </table>',
		'        <!--[if mso]></td></tr></table><![endif]-->',
		'      </td>',
		'    </tr>',
		'  </table>',
		'</body>',
		'</html>',
		''
	].join('\n');
}

/** The plain text part: the same content in the same order, one line for each paragraph. */
export function text(e: Email): string {
	const out: string[] = [e.workspace ? `${e.product} · ${e.workspace}` : e.product, '', e.heading, ''];
	for (const block of e.body) {
		switch (block.kind) {
			case 'text':
				out.push(block.text, '');
				break;
			case 'state':
				out.push(`${block.word} · ${block.rest}`, '');
				break;
			case 'facts':
				out.push(...block.facts.map((f) => `${f.label}: ${f.value}`), '');
				break;
			case 'figures':
				out.push(...block.figures.map((f) => `${f.label}: ${f.value}, ${f.change.charAt(0).toLowerCase()}${f.change.slice(1)}`), '');
				break;
			case 'table':
				out.push(block.table.heading, block.table.columns.map((col) => col.label).join(' · '), ...block.table.rows.map((r) => r.join(' · ')), block.table.more, '');
				break;
			case 'log':
				out.push(`${block.caption}:`, ...block.lines, '');
				break;
		}
	}
	out.push(`${e.action.label}:`, e.action.url, '');
	for (const t of e.after) out.push(t, '');
	for (const l of e.links) out.push(`${l.label}:`, l.url, '');
	out.push(e.why);
	if (e.stop) out.push(`${e.stop.label}:`, e.stop.url);
	out.push(e.sender, '');
	return out.join('\n');
}
