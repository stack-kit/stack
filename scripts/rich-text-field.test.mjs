// The modules of the rich text field that need no DOM: the command that takes a key that two commands
// get, the warning of development for such a key, the keys that a command can take
// (preview/src/lib/rich-text/tools/keys.ts), the order of the toolbar (tools/presets.ts), and a part of
// the toolbar that loads at its first use (toolbar/parts.ts).
//
//   node --test scripts/rich-text-field.test.mjs
//
// The modules name a .ts file with the extension .js, such as '#lib/stack/behaviour/keys.js' and
// './commands.js'. A resolve hook gives Node the .ts file, and Node then runs it with its type
// stripping. The test gives a navigator of macOS or of Windows, as scripts/keys.test.mjs does.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const LIB = join(ROOT, 'preview/src/lib');

registerHooks({
	resolve(specifier, context, next) {
		let file = null;
		if (specifier.startsWith('#lib/')) file = join(LIB, specifier.slice('#lib/'.length));
		else if (specifier.startsWith('.') && context.parentURL?.startsWith(pathToFileURL(LIB).href)) file = fileURLToPath(new URL(specifier, context.parentURL));
		const ts = file?.replace(/\.js$/, '.ts');
		return next(ts && existsSync(ts) ? pathToFileURL(ts).href : specifier, context);
	}
});

function system(name) {
	const platform = name === 'mac' ? 'MacIntel' : 'Win32';
	Object.defineProperty(globalThis, 'navigator', { value: { platform, userAgent: '' }, configurable: true, writable: true });
}

const keysModule = () => import('../preview/src/lib/rich-text/tools/keys.ts');
const presetsModule = () => import('../preview/src/lib/rich-text/tools/presets.ts');

test('the order of the toolbar holds each tool once, in the order of its groups', async () => {
	const { GROUPS, TOOL_ORDER } = await presetsModule();
	const { TOOLS } = await import('../preview/src/lib/rich-text/tools/commands.ts');
	assert.deepEqual(TOOL_ORDER, GROUPS.flatMap((g) => g.tools));
	assert.equal(new Set(TOOL_ORDER).size, Object.keys(TOOLS).length);
	assert.ok(TOOL_ORDER.indexOf('link') < TOOL_ORDER.indexOf('superscript'), 'Link stands in Format, before More formats');
});

test('a key that two commands get goes to the command that comes first, and the other commands lose it', async () => {
	system('mac');
	const { claimKeys } = await keysModule();
	const { TOOL_ORDER } = await presetsModule();
	const given = { toolbar: ['Alt+F10'], italic: ['Alt+F10'], link: ['Cmd+Shift+U'], superscript: ['cmd+shift+u'], 'text-color': ['Cmd+Shift+U', 'Cmd+Alt+C'], bold: ['Cmd+B'] };
	const { keys, shared } = claimKeys(['toolbar', ...TOOL_ORDER], (c) => given[c] ?? []);
	assert.deepEqual(keys.toolbar, ['Alt+F10']);
	assert.deepEqual(keys.italic, []);
	assert.deepEqual(keys.link, ['Cmd+Shift+U']);
	assert.deepEqual(keys['text-color'], ['Cmd+Alt+C']);
	assert.deepEqual(keys.superscript, []);
	assert.deepEqual(keys.bold, ['Cmd+B']);
	assert.deepEqual(keys.quote, []);
	assert.deepEqual(shared, [
		{ key: 'Alt+F10', commands: ['toolbar', 'italic'] },
		{ key: 'Cmd+Shift+U', commands: ['link', 'text-color', 'superscript'] }
	]);
});

test('off macOS Cmd and Ctrl are one key, and on macOS they are two', async () => {
	const { claimKeys } = await keysModule();
	const given = { bold: ['Cmd+B'], italic: ['Ctrl+B'] };
	system('windows');
	assert.deepEqual(claimKeys(['bold', 'italic'], (c) => given[c]).keys.italic, []);
	system('mac');
	assert.deepEqual(claimKeys(['bold', 'italic'], (c) => given[c]).keys.italic, ['Ctrl+B']);
});

test('the warning of a shared key names each key, its commands and the rule, in the form of the paper warning', async () => {
	const { sharedKeysWarning } = await keysModule();
	assert.equal(
		sharedKeysWarning([{ key: 'Cmd+Shift+U', commands: ['link', 'text-color', 'superscript'] }]),
		'The keys of the rich text field give one key to two or more commands (Cmd+Shift+U: link, text-color, superscript). The first command of each key takes it, in the order of the toolbar, and the other commands show no key. Give each command a key of its own.'
	);
});

test('a command takes a key with Cmd, Ctrl or Alt, or a function key, and no key of characters alone', async () => {
	const { usable } = await keysModule();
	assert.equal(usable('F2'), true);
	assert.equal(usable('Shift+F12'), true);
	assert.equal(usable('Cmd+B'), true);
	assert.equal(usable('Alt+F10'), true);
	assert.equal(usable('B'), false);
	assert.equal(usable('Shift+B'), false);
	assert.equal(usable('F25'), false);
	assert.equal(usable('G, then B'), false);
});

test('a part of the toolbar that did not load loads again at its next use', async () => {
	const { lazy } = await import('../preview/src/lib/rich-text/toolbar/parts.ts');
	let calls = 0;
	const part = lazy(() => (++calls === 1 ? Promise.reject(new Error('offline')) : Promise.resolve({ default: 'Menu' })));
	await assert.rejects(part.load(), /offline/);
	assert.equal(part.now, null);
	assert.equal(await part.load(), 'Menu');
	assert.equal(part.now, 'Menu');
	assert.equal(await part.load(), 'Menu');
	assert.equal(calls, 2);
});
