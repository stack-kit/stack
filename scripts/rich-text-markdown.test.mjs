// The Markdown marks of the rich text field (preview/src/lib/rich-text/engine/markdown.ts): which typed
// text gives which block or mark, what stays text, and which characters a change takes out, which are
// the characters that Backspace and the undo key give back. The engine makes each change in one undo
// step after the typed text, so Backspace right after the change gives back the line as the person typed it.
//
//   node --test scripts/rich-text-markdown.test.mjs
//
// The rules take the tools of each preset from tools/presets.ts, which names a .ts file with the
// extension .js, such as './commands.js'. A resolve hook gives Node the .ts file, as in
// scripts/rich-text-field.test.mjs, and Node runs it with its type stripping and no DOM.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const LIB = join(dirname(dirname(fileURLToPath(import.meta.url))), 'preview/src/lib');
registerHooks({
	resolve(specifier, context, next) {
		let file = null;
		if (specifier.startsWith('#lib/')) file = join(LIB, specifier.slice('#lib/'.length));
		else if (specifier.startsWith('.') && context.parentURL?.startsWith(pathToFileURL(LIB).href)) file = fileURLToPath(new URL(specifier, context.parentURL));
		const ts = file?.replace(/\.js$/, '.ts');
		return next(ts && existsSync(ts) ? pathToFileURL(ts).href : specifier, context);
	}
});

const { blockMatch, inlineMatch } = await import('../preview/src/lib/rich-text/engine/markdown.ts');
const { PRESET_TOOLS } = await import('../preview/src/lib/rich-text/tools/presets.ts');

const FULL = new Set(PRESET_TOOLS.full);
const SIMPLE = new Set(PRESET_TOOLS.simple);

/** The tool and the mark of a typed line at the start of a plain line, or null. */
const block = (before, after = '', tools = FULL) => {
	const m = blockMatch(before, after, tools);
	return m ? `${m.tool} ${before.slice(0, m.length)}` : null;
};
/** The tool and the words of a typed line, or null. */
const inline = (before, tools = FULL) => {
	const m = inlineMatch(before, tools);
	return m ? `${m.tool} ${before.slice(m.from, m.to)}` : null;
};

test('a mark and a space at the start of a plain line give the block of the mark', () => {
	assert.equal(block('# '), 'h1 # ');
	assert.equal(block('## '), 'h2 ## ');
	assert.equal(block('### '), 'h3 ### ');
	assert.equal(block('- '), 'bullet-list - ');
	assert.equal(block('* '), 'bullet-list * ');
	assert.equal(block('1. '), 'numbered-list 1. ');
	assert.equal(block('> '), 'quote > ');
	// A browser types a no-break space at the end of a line.
	assert.equal(block('#\u00a0'), 'h1 #\u00a0');
	// The rest of the line stays, and becomes the words of the block.
	assert.equal(block('# ', 'Delivery update'), 'h1 # ');
	assert.equal(block('- ', 'Use the loading dock'), 'bullet-list - ');
});

test('a divider and a code block take a line that holds the mark alone', () => {
	assert.equal(block('---'), 'hr ---');
	assert.equal(block('```'), 'code-block ```');
	assert.equal(block('---', 'words'), null);
	assert.equal(block('```', 'words'), null);
	assert.equal(block('---', ' '), null);
});

test('a mark for a tool that the preset does not hold stays text', () => {
	// The presets hold three headings, so a heading 4 to 6 stays text.
	assert.equal(block('#### '), null);
	assert.equal(block('##### '), null);
	assert.equal(block('###### '), null);
	assert.equal(block('####### '), null);
	// The simple preset holds no block tool.
	for (const typed of ['# ', '- ', '* ', '1. ', '> ', '---', '```']) assert.equal(block(typed, '', SIMPLE), null, typed);
	// A preset with no divider and no list.
	const some = new Set(['h1', 'bold']);
	assert.equal(block('---', '', some), null);
	assert.equal(block('- ', '', some), null);
	assert.equal(block('# ', '', some), 'h1 # ');
});

test('a mark that is not at the start of the line, or with no space, stays text', () => {
	assert.equal(block('#'), null);
	assert.equal(block('#x '), null);
	assert.equal(block(' # '), null);
	assert.equal(block('a # '), null);
	assert.equal(block('-- '), null);
	assert.equal(block('--'), null);
	assert.equal(block('----'), null);
	assert.equal(block('2. '), null);
	assert.equal(block('1) '), null);
	assert.equal(block('>> '), null);
	assert.equal(block('#  '), null);
	assert.equal(block('``'), null);
});

test('a pair of marks around words gives the mark of the words', () => {
	assert.equal(inline('**bold**'), 'bold bold');
	assert.equal(inline('__bold__'), 'bold bold');
	assert.equal(inline('*soft*'), 'italic soft');
	assert.equal(inline('_soft_'), 'italic soft');
	assert.equal(inline('~~gone~~'), 'strikethrough gone');
	assert.equal(inline('`npm ci`'), 'inline-code npm ci');
	assert.equal(inline('Ship on **Thursday morning**'), 'bold Thursday morning');
	assert.equal(inline('(see _the map_'), 'italic the map');
	assert.equal(inline('run x`y`'), 'inline-code y');
	assert.equal(inline('a\u00a0**b**'), 'bold b');
});

test('a pair that is not closed, is empty or stands inside a word stays text', () => {
	assert.equal(inline('**bold*'), null);
	assert.equal(inline('**bold'), null);
	assert.equal(inline('****'), null);
	assert.equal(inline('**'), null);
	assert.equal(inline('``'), null);
	assert.equal(inline('` `'), null);
	assert.equal(inline('***x**'), null);
	assert.equal(inline('** bold**'), null);
	assert.equal(inline('**bold **'), null);
	assert.equal(inline('a * b *'), null);
	assert.equal(inline('snake_case_'), null);
	assert.equal(inline('2*3*'), null);
	assert.equal(inline('**a*b**'), null);
	assert.equal(inline('plain words'), null);
});

test('a pair for a tool that the preset does not hold stays text', () => {
	// The simple preset holds bold, italic and underline.
	assert.equal(inline('**bold**', SIMPLE), 'bold bold');
	assert.equal(inline('_soft_', SIMPLE), 'italic soft');
	assert.equal(inline('`npm ci`', SIMPLE), null);
	assert.equal(inline('~~gone~~', SIMPLE), null);
	// With no bold, the last * of a bold pair closes no italic.
	assert.equal(inline('**bold**', new Set(['italic'])), null);
});

test('a change takes out the typed marks only, so Backspace gives back the line as it was typed', () => {
	for (const before of ['# ', '### ', '- ', '* ', '1. ', '> ', '---', '```']) {
		const m = blockMatch(before, '', FULL);
		assert.ok(m, before);
		// The mark is the whole typed line: the change leaves the words after the caret, and the undo step
		// before the change holds the mark.
		assert.equal(m.length, before.length, before);
	}
	for (const before of ['**bold**', 'Ship on __Thursday__', 'a *soft*', 'see `npm ci`', '~~gone~~']) {
		const m = inlineMatch(before, FULL);
		assert.ok(m, before);
		const open = before.slice(m.from - m.mark, m.from);
		const close = before.slice(m.to, m.to + m.mark);
		assert.equal(open, close, before);
		assert.equal(m.to + m.mark, before.length, `${before}: the closing mark ends at the caret`);
		assert.equal(before.slice(0, m.from - m.mark) + open + before.slice(m.from, m.to) + close, before, before);
	}
});
