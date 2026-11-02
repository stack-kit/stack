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
/** The name of a key in architecture/keys.json, and its KeyboardEvent.key. */
const NAMED: Readonly<Record<string, string>> = {
	esc: 'Escape',
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

/** Cmd is the Command key on macOS, and Ctrl on every other system. */
function onMac(): boolean {
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
 * True when the event gives the letter or the digit. A layout such as Greek gives a letter outside
 * ASCII, such as "ξ" on the J key, so for a letter the physical key counts there, such as KeyJ.
 */
function sameCharacter(e: KeyboardEvent, base: string): boolean {
	if (/^[a-z]$/i.test(base) && e.key.length === 1 && e.key.charCodeAt(0) > 0x7f) return e.code === `Key${base.toUpperCase()}`;
	return e.key.toLowerCase() === base.toLowerCase();
}

/** The modifiers and the base of a key such as "Cmd+Z", "Shift+X" or "Down". */
function parse(key: string) {
	const parts = key.split('+');
	const base = parts.pop() ?? '';
	const mods = new Set(parts.map((p) => p.toLowerCase()));
	const mac = onMac();
	return {
		base,
		meta: mods.has('cmd') && mac,
		ctrl: mods.has('ctrl') || (mods.has('cmd') && !mac),
		shift: mods.has('shift'),
		alt: mods.has('alt')
	};
}

/**
 * True when the event is the key, such as "Cmd+Z", "J" or "Down". A key with no Cmd and no Ctrl never
 * matches in a text field, and a key with Cmd matches there only as Cmd+K, Cmd+S or Cmd+Enter
 * (web-app.md, "### Rules"). A sequence such as "G, then a letter" never matches. Enter and Space never
 * match on a button, a link or a summary, and the arrow keys never match on a range or radio input.
 */
export function matches(e: KeyboardEvent, key: string): boolean {
	if (e.isComposing || key.includes(', then ')) return false;
	const k = parse(key);
	const named = NAMED[k.base.toLowerCase()];
	const letter = /^[a-z0-9]$/i.test(k.base);
	if (named !== undefined) {
		if (e.key !== named) return false;
	} else if (letter) {
		if (!sameCharacter(e, k.base)) return false;
	} else if (e.key !== k.base) return false;
	// A character such as "?" takes Shift on most keyboards, so Shift counts only on a letter or a named key.
	if ((named !== undefined || letter) && e.shiftKey !== k.shift) return false;
	if (e.metaKey !== k.meta || e.ctrlKey !== k.ctrl || e.altKey !== k.alt) return false;
	const target = targetOf(e);
	if (nativeKey(target, named)) return false;
	if (!textField(target)) return true;
	return (k.meta || k.ctrl) && CMD_IN_TEXT.has(k.base.toLowerCase());
}

/** The keys of the action: the keys that keyOf gives, else DEFAULT_KEYS. */
function keysOf(action: KeyAction): readonly string[] {
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
		if (queue.length === 0 || !keysOf(action).some((key) => matches(e, key))) continue;
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

/** The keys of the action in the form of aria-keyshortcuts, such as "Meta+Z" or "J ArrowDown". "" when the key is off. */
export function keyHint(action: KeyAction): string {
	subscribe();
	return keysOf(action)
		.filter((key) => !key.includes(', then '))
		.map((key) => {
			const k = parse(key);
			const named = NAMED[k.base.toLowerCase()];
			const base = named === ' ' ? 'Space' : (named ?? k.base.toUpperCase());
			return [k.ctrl && 'Control', k.meta && 'Meta', k.alt && 'Alt', k.shift && 'Shift', base].filter(Boolean).join('+');
		})
		.join(' ');
}
