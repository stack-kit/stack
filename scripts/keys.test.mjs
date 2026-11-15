// The one key parser of STACK (preview/src/lib/stack/behaviour/keys.ts), which the shared keys and the
// rich text field both use, and the key check of scripts/keys.mjs for the ids of the rich text field.
//
//   node --test scripts/keys.test.mjs
//
// The module imports svelte/reactivity only, so Node runs it with its type stripping. The test gives a
// navigator of macOS or of Windows, and keydown events as plain objects with the fields that the parser
// reads. A text field is a stub of HTMLElement with isContentEditable.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { compareDefaults, defaultKeys, RICH_TEXT, DEFAULTS, DATA } from './keys.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

class Element {
	localName = 'div';
	shadowRoot = null;
	closest() {
		return null;
	}
	matches() {
		return false;
	}
	hasAttribute() {
		return false;
	}
}
class HTMLElement extends Element {
	isContentEditable = false;
}
class HTMLInputElement extends HTMLElement {}
class HTMLTextAreaElement extends HTMLElement {}
class HTMLSelectElement extends HTMLElement {}
Object.assign(globalThis, { Element, HTMLElement, HTMLInputElement, HTMLTextAreaElement, HTMLSelectElement });

const keys = await import('../preview/src/lib/stack/behaviour/keys.ts');

function system(name) {
	const platform = name === 'mac' ? 'MacIntel' : 'Win32';
	Object.defineProperty(globalThis, 'navigator', { value: { platform, userAgent: '' }, configurable: true, writable: true });
}

/** A keydown as the parser reads it. */
function down(key, code, mods = {}, target = null) {
	const { meta = false, ctrl = false, alt = false, shift = false, altGraph = false } = mods;
	return { key, code, metaKey: meta, ctrlKey: ctrl, altKey: alt, shiftKey: shift, isComposing: false, target, composedPath: () => (target ? [target] : []), getModifierState: (m) => m === 'AltGraph' && altGraph };
}

test('parseKey gives the base and each modifier', () => {
	assert.deepEqual(keys.parseKey('Cmd+Shift+Z'), { base: 'Z', cmd: true, ctrl: false, shift: true, alt: false });
	assert.deepEqual(keys.parseKey('Alt+F10'), { base: 'F10', cmd: false, ctrl: false, shift: false, alt: true });
	assert.deepEqual(keys.parseKey('Down'), { base: 'Down', cmd: false, ctrl: false, shift: false, alt: false });
});

test('Cmd is Command on macOS and Ctrl elsewhere, and the modifiers match exactly', () => {
	system('mac');
	assert.equal(keys.isKey(down('b', 'KeyB', { meta: true }), 'Cmd+B'), true);
	assert.equal(keys.isKey(down('b', 'KeyB', { ctrl: true }), 'Cmd+B'), false);
	assert.equal(keys.isKey(down('B', 'KeyB', { meta: true, shift: true }), 'Cmd+B'), false);
	assert.equal(keys.isKey(down('b', 'KeyB', { ctrl: true }), 'Ctrl+B'), true);
	system('windows');
	assert.equal(keys.isKey(down('b', 'KeyB', { ctrl: true }), 'Cmd+B'), true);
	assert.equal(keys.isKey(down('b', 'KeyB', { meta: true }), 'Cmd+B'), false);
});

test('a digit matches the physical key too, and [ ] \\ - = take it with Shift or with Option on macOS', () => {
	system('mac');
	assert.equal(keys.isKey(down('&', 'Digit7', { meta: true, shift: true }), 'Cmd+Shift+7'), true, 'Shift+7 gives "&"');
	assert.equal(keys.isKey(down('¡', 'Digit1', { meta: true, alt: true }), 'Cmd+Alt+1'), true, 'Option+1 gives "¡"');
	assert.equal(keys.isKey(down('7', 'Digit7', { meta: true }), 'Cmd+Shift+7'), false);
	assert.equal(keys.isKey(down('ü', 'BracketLeft', { meta: true }), 'Cmd+['), false, 'with Cmd and no Shift or Option the character counts');
	assert.equal(keys.isKey(down('[', 'Minus', { meta: true }), 'Cmd+['), true, 'a layout with "[" on another key');
	assert.equal(keys.isKey(down('“', 'BracketLeft', { meta: true, alt: true }), 'Cmd+Alt+['), true, 'Option+[ gives "“"');
	assert.equal(keys.isKey(down('\\', 'Backslash', { meta: true }), 'Cmd+\\'), true);
	system('windows');
	assert.equal(keys.isKey(down('3', 'Digit3', { ctrl: true, alt: true }), 'Cmd+Alt+3'), true);
});

test('matches keeps the result of before for Cmd or Ctrl with a punctuation key, and takes the physical key only where the character cannot match', () => {
	system('mac');
	// A German layout has "-" on the key Slash and "ß" on the key Minus, where a US layout has "-".
	assert.equal(keys.matches(down('-', 'Slash', { meta: true }), 'Cmd+-'), true, 'German "-"');
	assert.equal(keys.matches(down('ß', 'Minus', { meta: true }), 'Cmd+-'), false, 'German "ß"');
	assert.equal(keys.matches(down('=', 'Equal', { meta: true }), 'Cmd+='), true);
	// A digit: the character, as before, and the physical key, such as "&" on the key of 1 in a French layout.
	assert.equal(keys.matches(down('1', 'Digit1', { meta: true }), 'Cmd+1'), true);
	assert.equal(keys.matches(down('&', 'Digit1', { meta: true }), 'Cmd+1'), true, 'French "&"');
	assert.equal(keys.matches(down('1', 'Numpad1', { meta: true }), 'Cmd+1'), true, 'the 1 of the number pad');
	assert.equal(keys.matches(down('!', 'Digit1', { meta: true, shift: true }), 'Cmd+1'), false);
	// Option on macOS gives another character.
	assert.equal(keys.matches(down('–', 'Minus', { alt: true }), 'Alt+-'), true, 'Option+- gives "–"');
	assert.equal(keys.matches(down('¡', 'Digit1', { alt: true }), 'Alt+1'), true, 'Option+1 gives "¡"');
	assert.equal(keys.matches(down('∫', 'KeyB', { alt: true }), 'Alt+B'), true, 'Option+B gives "∫"');
	// Shift gives another character on a digit or a punctuation key.
	assert.equal(keys.matches(down('&', 'Digit7', { meta: true, shift: true }), 'Cmd+Shift+7'), true, 'US "&"');
	assert.equal(keys.matches(down('/', 'Digit7', { meta: true, shift: true }), 'Cmd+Shift+7'), true, 'German "/"');
	assert.equal(keys.matches(down('_', 'Minus', { meta: true, shift: true }), 'Cmd+Shift+-'), true, 'Shift+- gives "_"');
	system('windows');
	// Alt off macOS keeps the character of the key, so the character counts, as before.
	assert.equal(keys.matches(down('-', 'Slash', { alt: true }), 'Alt+-'), true, 'German "-" with Alt');
	assert.equal(keys.matches(down('ß', 'Minus', { alt: true }), 'Alt+-'), false, 'German "ß" with Alt');
	assert.equal(keys.matches(down('-', 'Slash', { ctrl: true }), 'Cmd+-'), true, 'German "-" with Ctrl');
	assert.equal(keys.matches(down('&', 'Digit1', { ctrl: true }), 'Cmd+1'), true, 'French "&" with Ctrl');
});

test('a function key is F1 to F24', () => {
	assert.equal(keys.isFunctionKey('F2'), true);
	assert.equal(keys.isFunctionKey('f24'), true);
	assert.equal(keys.isFunctionKey('F25'), false);
	assert.equal(keys.isFunctionKey('F0'), false);
	assert.equal(keys.isFunctionKey('F'), false);
});

test('actionKeys gives the keys that the person chose, else DEFAULT_KEYS', () => {
	assert.deepEqual(keys.actionKeys('submit'), ['Cmd+Enter']);
	keys.provideKeys((a) => (a === 'submit' ? ['Alt+S'] : a === 'undo' ? [] : undefined));
	assert.deepEqual(keys.actionKeys('submit'), ['Alt+S']);
	assert.deepEqual(keys.actionKeys('undo'), []);
	assert.deepEqual(keys.actionKeys('escape'), ['Esc']);
	keys.provideKeys(() => undefined);
	assert.deepEqual(keys.actionKeys('submit'), ['Cmd+Enter']);
});

test('a letter matches the character, and the physical key for a character outside ASCII or with Option on macOS', () => {
	system('mac');
	assert.equal(keys.isKey(down('ξ', 'KeyJ'), 'J'), true, 'Greek');
	assert.equal(keys.isKey(down('˙', 'KeyH', { meta: true, alt: true }), 'Cmd+Alt+H'), true, 'Option+H');
	assert.equal(keys.isKey(down('@', 'KeyL', { meta: true, alt: true }), 'Cmd+Alt+L'), true, 'Option+L of a layout that gives "@"');
	assert.equal(keys.isKey(down('j', 'KeyH'), 'J'), true, 'a layout that puts J on another key');
	assert.equal(keys.isKey(down('h', 'KeyJ'), 'J'), false);
});

test('a bare character matches the character, and Shift does not count', () => {
	system('mac');
	assert.equal(keys.isKey(down('?', 'Slash', { shift: true }), '?'), true);
	assert.equal(keys.isKey(down('[', 'BracketLeft'), '['), true);
	assert.equal(keys.isKey(down('ü', 'BracketLeft'), '['), false, 'no modifier: the character counts');
	assert.equal(keys.isKey(down('1', 'Digit1'), '1'), true);
	assert.equal(keys.isKey(down('!', 'Digit1', { shift: true }), '1'), false);
});

test('a named key and a function key match their KeyboardEvent.key', () => {
	system('mac');
	assert.equal(keys.isKey(down('Escape', 'Escape'), 'Esc'), true);
	assert.equal(keys.isKey(down('Escape', 'Escape'), 'Escape'), true);
	assert.equal(keys.isKey(down('F10', 'F10', { alt: true }), 'Alt+F10'), true);
	assert.equal(keys.isKey(down('F10', 'F10'), 'Alt+F10'), false);
	assert.equal(keys.isKey(down('ArrowDown', 'ArrowDown', { shift: true }), 'Shift+Down'), true);
	assert.equal(keys.isKey(down('Enter', 'Enter', { meta: true }), 'Cmd+Enter'), true);
});

test('AltGr off macOS, a sequence and a composition match no key', () => {
	system('windows');
	assert.equal(keys.isKey(down('e', 'KeyE', { ctrl: true, alt: true, altGraph: true }), 'Ctrl+Alt+E'), false);
	assert.equal(keys.isKey(down('e', 'KeyE', { ctrl: true, alt: true }), 'Ctrl+Alt+E'), true);
	assert.equal(keys.isKey(down('g', 'KeyG'), 'G, then a letter'), false);
	assert.equal(keys.isKey({ ...down('b', 'KeyB', { ctrl: true }), isComposing: true }, 'Cmd+B'), false);
});

test('matches adds the rule of a text field to isKey', () => {
	system('mac');
	const text = Object.assign(new HTMLElement(), { isContentEditable: true });
	assert.equal(keys.matches(down('b', 'KeyB', { meta: true }, text), 'Cmd+B'), false);
	assert.equal(keys.matches(down('k', 'KeyK', { meta: true }, text), 'Cmd+K'), true);
	assert.equal(keys.matches(down('j', 'KeyJ', {}, text), 'J'), false);
	assert.equal(keys.matches(down('j', 'KeyJ', {}, new HTMLElement()), 'J'), true);
	assert.equal(keys.isKey(down('b', 'KeyB', { meta: true }, text), 'Cmd+B'), true);
});

test('ariaKey and keyHint give the form of aria-keyshortcuts', () => {
	system('mac');
	assert.equal(keys.ariaKey('Cmd+Shift+Z'), 'Meta+Shift+Z');
	assert.equal(keys.ariaKey('Esc'), 'Escape');
	assert.equal(keys.ariaKey('Space'), 'Space');
	assert.equal(keys.ariaKey('Alt+F10'), 'Alt+F10');
	assert.equal(keys.keyHint('next-row'), 'J ArrowDown');
	system('windows');
	assert.equal(keys.ariaKey('Cmd+Alt+1'), 'Control+Alt+1');
	assert.equal(keys.keyHint('undo'), 'Control+Z');
});

test('the key check reads RICH_TEXT_KEYS, also a key with "]" or a backslash, and compares the ids "rich-text."', () => {
	const source = readFileSync(join(ROOT, RICH_TEXT), 'utf8');
	const rich = defaultKeys(source, 'RICH_TEXT_KEYS', RICH_TEXT);
	assert.deepEqual(rich.indent, ['Cmd+]']);
	assert.deepEqual(rich['clear-formatting'], ['Cmd+\\']);
	assert.deepEqual(rich.quote, []);
	const data = JSON.parse(readFileSync(join(ROOT, DATA), 'utf8'));
	const defaults = defaultKeys(readFileSync(join(ROOT, DEFAULTS), 'utf8'));
	assert.deepEqual(compareDefaults(defaults, data, rich), []);
	const moved = compareDefaults(defaults, data, { ...rich, bold: ['Cmd+Shift+B'] });
	assert.equal(moved.length, 1);
	assert.match(moved[0], /"bold" the keys Cmd\+Shift\+B, and the entries .* "rich-text\.bold" give Cmd\+B/);
	const unknown = compareDefaults(defaults, [...data, { key: 'Cmd+Q', action: 'quit', scope: 'Inside', owner: 'rich-text-field', id: 'rich-text.quit' }], rich);
	assert.match(unknown[0] ?? '', /"rich-text\.quit", and RICH_TEXT_KEYS .* has no such command/);
});
