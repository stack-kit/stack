// The keys of the parts ("## Keyboard model" in architecture/web-app.md). One keydown listener on the
// window, in the bubble phase, runs the newest binding of the action whose key the event matches. The
// listener comes with the first binding, and it reads the keys of the person at each keydown.
//
// A part binds a key in an $effect and returns the result, so that the binding ends with the part:
//   $effect(() => bindKey('next-row', () => step(1)));
// A binding that returns false declines the key. The listener then calls no preventDefault, and the
// next older binding of the key runs. A control keeps its own keys: Enter and Space never match on a
// button, a link or a summary, and the arrow keys never match on a range or radio input. A button with
// the attribute data-keys-enter, such as the row button of SplitRow, gives its Enter to the bindings
// first: when no binding takes the key, the button runs it by itself.
// A product that lets a person change a key calls provideKeys once, in onMount of its root layout.
// An action whose keys are [] has no key, and its binding never runs.
//
// Esc runs in this order: an open layer, then the selection, then the item column. Bits UI closes its
// layer first and calls preventDefault, and the listener skips an event that a handler prevented. A
// lifted card or row stops its own Esc in the same way. Then the newest 'selection' binding of
// onEscape runs, else the newest 'item' binding.
//
// scripts/keys.mjs compares DEFAULT_KEYS with the entries of architecture/keys.json that carry an id.
// Keep one line for each action in DEFAULT_KEYS, because the script reads the lines.
import { createSubscriber } from 'svelte/reactivity';

/** An action that a part binds. Each one is the id of entries in architecture/keys.json. */
export type KeyAction = 'undo' | 'escape' | 'next-row' | 'previous-row' | 'open-item' | 'submit';

/** The default keys of each action, as architecture/keys.json writes them. */
export const DEFAULT_KEYS: Readonly<Record<KeyAction, readonly string[]>> = Object.freeze({
	undo: ['Cmd+Z'],
	escape: ['Esc'],
	'next-row': ['J', 'Down'],
	'previous-row': ['K', 'Up'],
	'open-item': ['Enter'],
	submit: ['Cmd+Enter']
});

/** The keys that the person chose for an action. [] turns the action off, and undefined gives DEFAULT_KEYS. */
export type KeyOf = (action: KeyAction) => readonly string[] | undefined;

/** The actions in the order in which a keydown tries them. */
const ACTIONS = Object.keys(DEFAULT_KEYS) as KeyAction[];
/** The level of a binding of Esc: a higher level runs first. Every other action has level 0. */
const LEVEL = { selection: 2, item: 1 } as const;
/** The keys of a text field that a key with Cmd may use (web-app.md, "### Rules"). */
const CMD_IN_TEXT = new Set(['k', 's', 'enter']);
/** The input types that take no text. Every other input is a text field. */
const NO_TEXT = new Set(['button', 'checkbox', 'color', 'file', 'image', 'radio', 'range', 'reset', 'submit']);
/** The controls that run on Enter and on Space by themselves. An input of type button is a button too. */
const ACTIVATES =
	'button, input[type=button], input[type=submit], input[type=reset], input[type=image], a[href], summary, [role=button], [role=link]';
/** The KeyboardEvent.key of each arrow key, which a range or radio input uses by itself. */
const ARROWS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
/** The name of a key in architecture/keys.json, and its KeyboardEvent.key. F1 to F24 are named too (isFunctionKey). */
const NAMED: Readonly<Record<string, string>> = {
	esc: 'Escape',
	escape: 'Escape',
	up: 'ArrowUp',
	down: 'ArrowDown',
	left: 'ArrowLeft',
	right: 'ArrowRight',
	space: ' ',
	enter: 'Enter',
	tab: 'Tab',
	home: 'Home',
	end: 'End',
	'page up': 'PageUp',
	'page down': 'PageDown'
};
/** The physical key (KeyboardEvent.code) of a punctuation key, which a key with Shift, or with Option on macOS, matches. */
const CODES: Readonly<Record<string, string>> = { '[': 'BracketLeft', ']': 'BracketRight', '\\': 'Backslash', '-': 'Minus', '=': 'Equal' };

type Binding = { action: KeyAction; level: number; run: (e: KeyboardEvent) => void | false };

/** The bindings, oldest first. Only a part in $effect adds one, so only the browser writes this list. */
const bindings: Binding[] = [];
let listening = false;
let keyOf: KeyOf = (action) => DEFAULT_KEYS[action];
let keysChanged: (() => void) | undefined;
/** keyHint reads it, so that a hint renders again when provideKeys gives the keys of the person. */
const subscribe = createSubscriber((update) => {
	keysChanged = update;
	return () => (keysChanged = undefined);
});

/**
 * True on macOS and iOS. Cmd is the Command key there, and Ctrl on every other system. It reads the
 * navigator, so call it in the browser only: during server rendering it gives the system of the server,
 * and with no navigator it gives false.
 */
export function onMac(): boolean {
	return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

/**
 * The element that has the key. A listener on the window sees a web component as the target, so the
 * first element of the composed path counts: a text field inside the component stays a text field.
 */
function targetOf(e: Event): EventTarget | null {
	return e.composedPath()[0] ?? e.target;
}

/**
 * True when the event came from a text field, the rule that `matches` applies to a key with no Cmd and
 * no Ctrl. A frame that binds its own keys calls it before it acts on a single key:
 *   if (!inText(e)) jump();
 * The function reads the first element of the composed path itself, so a text field inside a web
 * component with an open shadow root counts. Call it in the handler, because composedPath() is empty
 * after the event ends. A text field is an input of every type except button, checkbox, color, file,
 * image, radio, range, reset and submit; a text area; a select; an element that is contenteditable; an
 * element inside the command palette ([data-slot=command]); and a custom element with no open shadow
 * root, because only its own code knows where the focus is.
 */
export function inText(e: Event): boolean {
	return textField(targetOf(e));
}

function textField(target: EventTarget | null): boolean {
	if (!(target instanceof Element)) return false;
	// The composed path stops at the host of a closed shadow root, so a text field inside it does not
	// show. A custom element with no open shadow root counts as a text field: only its own code knows
	// where the focus is. While it has the focus, a key with no Cmd and no Ctrl runs no binding.
	if (target.localName.includes('-') && target.shadowRoot === null) return true;
	if (target instanceof HTMLInputElement) return !NO_TEXT.has(target.type);
	if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
	if (target instanceof HTMLElement && target.isContentEditable) return true;
	return target.closest('[data-slot=command]') !== null;
}

/**
 * True when the control at the target runs the key by itself, so that no binding takes the key from it.
 * A control with data-keys-enter gives its Enter to the bindings first.
 */
function nativeKey(target: EventTarget | null, key: string | undefined): boolean {
	if (!(target instanceof Element) || key === undefined) return false;
	if (key === 'Enter' && target.hasAttribute('data-keys-enter')) return false;
	if (key === 'Enter' || key === ' ') return target.matches(ACTIVATES);
	return ARROWS.has(key) && target instanceof HTMLInputElement && (target.type === 'range' || target.type === 'radio');
}

/**
 * True when the event gives the letter. A layout such as Greek gives a letter outside ASCII, such as "ξ"
 * on the J key, and Option on macOS gives another character, such as "∫" for Option+B. The physical key
 * counts then, such as KeyJ.
 */
function sameLetter(e: KeyboardEvent, base: string, mac: boolean): boolean {
	if (e.key.toLowerCase() === base.toLowerCase()) return true;
	const other = e.key.length === 1 && (e.key.charCodeAt(0) > 0x7f || (mac && e.altKey));
	return other && e.code === `Key${base.toUpperCase()}`;
}

/** True for a function key, F1 to F24, such as the base "F10" of "Alt+F10". A function key types no character. */
export function isFunctionKey(base: string): boolean {
	return /^f(?:[1-9]|1[0-9]|2[0-4])$/i.test(base);
}

/** The KeyboardEvent.key of a named key, such as "Escape" for "Esc" or "F10" for "F10"; undefined for a character. */
function namedKey(base: string): string | undefined {
	return NAMED[base.toLowerCase()] ?? (isFunctionKey(base) ? base.toUpperCase() : undefined);
}

/** A key such as "Cmd+Shift+Z" in its parts: the base, such as "Z", and each modifier. */
export type ParsedKey = { base: string; cmd: boolean; ctrl: boolean; shift: boolean; alt: boolean };

/**
 * The parts of a key such as "Cmd+Z", "Shift+X", "Alt+F10" or "Down", as architecture/keys.json writes
 * it. This is the one parser of the keys of STACK: matches(), isKey(), ariaKey() and the rich text field
 * read each key through it.
 */
export function parseKey(key: string): ParsedKey {
	const parts = key.split('+');
	const base = parts.pop() ?? '';
	const mods = new Set(parts.map((p) => p.toLowerCase()));
	return { base, cmd: mods.has('cmd'), ctrl: mods.has('ctrl'), shift: mods.has('shift'), alt: mods.has('alt') };
}

/**
 * True when the event is the key, wherever the focus is: the rule of a text field and the rules of a
 * control that runs its own keys do not apply, as in a part that owns the key, such as the rich text
 * field. matches() adds those rules. A key matches its character, as matches() did before this function
 * came, and the physical key (event.code) counts only where the character cannot match:
 * - The modifiers match exactly. Cmd is the Command key on macOS and Ctrl elsewhere.
 * - A letter matches the character of the layout, and the physical key when the layout gives a character
 *   outside ASCII or Option on macOS gives another character (sameLetter).
 * - A digit matches the character and the physical key, such as Digit1 for "&" on the key of 1 in a
 *   French layout, and Digit7 for "&" of Shift+7. Shift counts.
 * - A punctuation key with Cmd or Ctrl and no Shift and no Alt, or with no modifier, matches the
 *   character only, such as "-" on the key Slash of a German layout. The keys [ ] \ - = with Shift, or
 *   with Option on macOS, also match the physical key, because Shift and Option change the character,
 *   such as "_" for Shift+- and "–" for Option+-. Alt on Windows and Linux keeps the character.
 * - Any other character matches the character, and Shift does not count, because a character such as
 *   "?" takes Shift on most keyboards. Shift counts on a letter, a digit and a named key.
 * - On Windows and Linux, Ctrl+Alt with AltGraph down is AltGr, which types a character on many layouts,
 *   so it matches no key.
 * - A sequence such as "G, then a letter" never matches, and no key matches while an input method composes.
 */
export function isKey(e: KeyboardEvent, key: string): boolean {
	if (e.isComposing || key.includes(', then ')) return false;
	const k = parseKey(key);
	const mac = onMac();
	if (e.metaKey !== (k.cmd && mac) || e.ctrlKey !== (k.ctrl || (k.cmd && !mac)) || e.altKey !== k.alt) return false;
	if (!mac && e.ctrlKey && e.altKey && e.getModifierState?.('AltGraph')) return false;
	const named = namedKey(k.base);
	if (named !== undefined) return e.key === named && e.shiftKey === k.shift;
	if (/^[a-z]$/i.test(k.base)) return sameLetter(e, k.base, mac) && e.shiftKey === k.shift;
	if (/^[0-9]$/.test(k.base)) return (e.key === k.base || e.code === `Digit${k.base}`) && e.shiftKey === k.shift;
	if (e.key === k.base) return true;
	const code = CODES[k.base];
	return code !== undefined && (k.shift || (k.alt && mac)) && e.code === code && e.shiftKey === k.shift;
}

/**
 * True when the event is the key, such as "Cmd+Z", "J" or "Down", and the place of the focus allows it.
 * The key matches its character: a punctuation key with Cmd or Ctrl and no Shift and no Alt compares the
 * character, as before, so "Cmd+-" is the key of "-" in each layout. The physical key counts only where
 * the character cannot match: with Option on macOS, with Shift on a digit or on [ ] \ - =, and for a
 * digit, such as "&" on the key of 1 in a French layout (isKey gives each rule). A key with no Cmd and
 * no Ctrl never matches in a text field, and a key with Cmd matches there only as Cmd+K, Cmd+S or
 * Cmd+Enter (web-app.md, "### Rules"). Enter and Space never match on a button, a link or a summary, and
 * the arrow keys never match on a range or radio input.
 */
export function matches(e: KeyboardEvent, key: string): boolean {
	if (!isKey(e, key)) return false;
	const k = parseKey(key);
	const target = targetOf(e);
	if (nativeKey(target, namedKey(k.base))) return false;
	if (!textField(target)) return true;
	return (k.cmd || k.ctrl) && CMD_IN_TEXT.has(k.base.toLowerCase());
}

/** The key in the form of aria-keyshortcuts, such as "Meta+Shift+Z", "Control+B" or "ArrowDown". */
export function ariaKey(key: string): string {
	const k = parseKey(key);
	const mac = onMac();
	const named = namedKey(k.base);
	const base = named === ' ' ? 'Space' : (named ?? k.base.toUpperCase());
	return [(k.ctrl || (k.cmd && !mac)) && 'Control', k.cmd && mac && 'Meta', k.alt && 'Alt', k.shift && 'Shift', base].filter(Boolean).join('+');
}

/**
 * The keys of the action: the keys that the person chose (provideKeys), else DEFAULT_KEYS; [] when the
 * key is off. A part that takes the key of an action on its own elements reads it at each keydown, such as
 * the rich text in place for the key of submit.
 */
export function actionKeys(action: KeyAction): readonly string[] {
	return keyOf(action) ?? DEFAULT_KEYS[action];
}

/** The bindings of the action in the order in which a keydown tries them: the higher level first, then the newer. */
function inOrder(action: KeyAction): Binding[] {
	return bindings
		.filter((b) => b.action === action)
		.reverse()
		.sort((a, b) => b.level - a.level);
}

function onKeydown(e: KeyboardEvent): void {
	if (e.defaultPrevented) return;
	for (const action of ACTIONS) {
		const queue = inOrder(action);
		if (queue.length === 0 || !actionKeys(action).some((key) => matches(e, key))) continue;
		for (const binding of queue) {
			if (binding.run(e) === false) continue;
			e.preventDefault();
			return;
		}
	}
}

function add(action: KeyAction, level: number, run: (e: KeyboardEvent) => void | false): () => void {
	const binding: Binding = { action, level, run };
	bindings.push(binding);
	if (!listening) {
		addEventListener('keydown', onKeydown);
		listening = true;
	}
	return () => {
		const at = bindings.indexOf(binding);
		if (at >= 0) bindings.splice(at, 1);
	};
}

/**
 * Gives the keys that the person chose. Call it once, in onMount of the root layout. The listener calls
 * keyOf at each keydown, so keyOf may read a state that the person changes. For an action that keyOf
 * does not know, it returns undefined, and the action keeps its DEFAULT_KEYS.
 */
export function provideKeys(next: KeyOf): void {
	keyOf = next;
	keysChanged?.();
}

/**
 * Runs run on a key of the action, while the binding lasts. Call it in $effect and return the result.
 * The newest binding of an action runs. When run returns false, it declines the key: the listener calls
 * no preventDefault, and the next older binding of the key runs. So give run a block body: an arrow
 * such as () => (open = false) returns false and declines. bindKey('escape', run) binds at the level
 * of onEscape('item', run).
 */
export function bindKey(action: KeyAction, run: (e: KeyboardEvent) => void | false): () => void {
	return add(action, action === 'escape' ? LEVEL.item : 0, run);
}

/**
 * Runs run on Esc, after an open layer: the newest 'selection' binding first, else the newest 'item'
 * binding. Bind 'selection' only while a row is selected, so that Esc reaches the item column after it.
 * run never declines Esc, also when it returns false, such as () => (selected = false).
 */
export function onEscape(level: 'selection' | 'item', run: () => void): () => void {
	return add('escape', LEVEL[level], () => {
		run();
	});
}

/**
 * Takes the rest of the press of a key that moves the focus into a text field, such as R that opens a
 * reply and puts the focus in its text ("### Rules" in web-app.md). A held key repeats its keydown, and
 * the field would type the letter. Call it only when the handler takes the key.
 * bindKey gives the event to run, so a binding calls it there. bindKey calls e.preventDefault() after
 * run returns, so a handler that takes the key needs no call of its own. Until the keyup of the same key, the
 * window stops each keydown, keypress and typed character of the key in the capture phase, before a
 * field or an editor sees it. The keyup ends it, and so does a window that loses the focus. A new press
 * of the key that is no repeat also ends it and goes through, because the window missed the keyup.
 */
export function takePress(e: KeyboardEvent): void {
	const { code } = e;
	const key = e.key.toLowerCase();
	// A soft keyboard can give an empty code, and then the key counts.
	const same = (next: KeyboardEvent) => (code ? next.code === code : next.key.toLowerCase() === key);
	const stop = (next: KeyboardEvent) => {
		if (!same(next)) return;
		if (next.type === 'keydown' && !next.repeat) return release();
		next.preventDefault();
		next.stopImmediatePropagation();
	};
	const typed = (next: InputEvent) => {
		if (next.inputType !== 'insertText' || next.data?.toLowerCase() !== key) return;
		next.preventDefault();
		next.stopImmediatePropagation();
	};
	const up = (next: KeyboardEvent) => {
		if (same(next)) release();
	};
	const release = () => {
		removeEventListener('keydown', stop, true);
		removeEventListener('keypress', stop, true);
		removeEventListener('beforeinput', typed, true);
		removeEventListener('keyup', up, true);
		removeEventListener('blur', release);
	};
	addEventListener('keydown', stop, true);
	addEventListener('keypress', stop, true);
	addEventListener('beforeinput', typed, true);
	addEventListener('keyup', up, true);
	addEventListener('blur', release);
}

/** The keys of the action in the form of aria-keyshortcuts, such as "Meta+Z" or "J ArrowDown". "" when the key is off. */
export function keyHint(action: KeyAction): string {
	subscribe();
	return actionKeys(action)
		.filter((key) => !key.includes(', then '))
		.map(ariaKey)
		.join(' ');
}
