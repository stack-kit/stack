// The guard of "### Email template": the code blocks of "## Email" in DESIGN.md must be the output of
// email.ts for the samples, in the default colors. The page /email calls it, and it throws on the
// first block that differs. No build and no npm run check runs it, so open /email after a change of either side.
import { blockLines, html, text, type Block, type Email } from './email.js';
import { emailColors, htmlBlocks, textBlocks } from './design.js';
import { alert, digest, notification } from './samples.js';

function block(e: Email, kind: Block['kind']): string {
	const b = e.body.find((x) => x.kind === kind);
	if (!b) throw new Error(`The sample has no ${kind} block.`);
	return blockLines(b, emailColors.default).join('\n');
}

/** The first line that differs, with its number, for the error message. */
function firstDifference(want: string, got: string): string {
	const a = want.split('\n');
	const b = got.split('\n');
	const i = a.findIndex((line, n) => line !== b[n]);
	const n = i < 0 ? a.length : i;
	return `line ${n + 1}: DESIGN.md has ${JSON.stringify(b[n] ?? '(no line)')}, email.ts writes ${JSON.stringify(a[n] ?? '(no line)')}`;
}

export function checkTemplate(): void {
	const c = emailColors.default;
	const want = {
		html: [
			['the template', html(notification, c).trimEnd()],
			['the figures of a digest', block(digest, 'figures')],
			['the table of a digest', block(digest, 'table')],
			['the state line of an alert', block(alert, 'state')],
			['the log of an alert', block(alert, 'log')]
		],
		text: [['the plain text part', text(notification).trimEnd()]]
	};
	for (const [kind, got] of [
		['html', htmlBlocks],
		['text', textBlocks]
	] as const) {
		const list = want[kind];
		if (got.length !== list.length) {
			throw new Error(`"## Email" of DESIGN.md has ${got.length} ${kind} blocks, and the preview draws ${list.length}.`);
		}
		list.forEach(([name, value], i) => {
			if (got[i] !== value) {
				throw new Error(`"### Email template" of DESIGN.md differs from preview/src/lib/email/email.ts in ${name}, ${firstDifference(value, got[i])}. Change both in one commit.`);
			}
		});
	}
}
