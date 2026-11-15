// The keys of the rich text field (### rich-text-field in DESIGN.md). The field reads and matches each
// key with the parser of behaviour/keys (parseKey and isKey), the one parser of the keys of STACK, so a
// key of the field and a shared key follow the same rules. "Cmd+B" is Command on macOS and Ctrl
// elsewhere. matches() of behaviour/keys refuses each Cmd key in a text field except Cmd+K, Cmd+S and
// Cmd+Enter, so the field matches its own keys with isKey(), which has no rule of the place of the focus.
import { isFunctionKey, onMac, parseKey } from '#lib/stack/behaviour/keys.js';

export { ariaKey, isKey } from '#lib/stack/behaviour/keys.js';

/**
 * The keys that the browser runs as an edit of an editable text by itself: bold, italic, underline, undo
 * and redo. When no command of the field takes such a key, the field stops that edit, and the key goes on
 * to the page, so a key that the page took from a command does not still format the text.
 */
export const NATIVE_KEYS: readonly string[] = ['Cmd+B', 'Cmd+I', 'Cmd+U', 'Cmd+Z', 'Cmd+Shift+Z', 'Cmd+Y'];

/**
 * True for a key that a command of the field can take: a key with Cmd, Ctrl or Alt, or a function key.
 * Any other key types a character or moves in the text, so a single key never fires in a text field
 * (web-app.md, "### Rules").
 */
export function usable(key: string): boolean {
	const k = parseKey(key);
	return k.base !== '' && !key.includes(', then ') && (k.cmd || k.ctrl || k.alt || isFunctionKey(k.base));
}

/** A key that two or more commands get, and the commands in the order in which they claim it. The first one takes it. */
export type SharedKey = { key: string; commands: readonly string[] };

/** One text for the keys that isKey cannot tell apart: the base in any case, and the modifiers, with Cmd as Ctrl off macOS. */
function sameKey(key: string, mac: boolean): string {
	const k = parseKey(key);
	const base = k.base.toLowerCase() === 'escape' ? 'esc' : k.base.toLowerCase();
	return [k.cmd && mac, k.ctrl || (k.cmd && !mac), k.alt, k.shift, base].join('|');
}

/**
 * The keys of each command of `order`, the first command first: each command keeps its keys except a key
 * that a command before it took. `shared` gives each key that two or more commands got.
 */
export function claimKeys<C extends string>(order: readonly C[], keysOf: (command: C) => readonly string[]): { keys: Record<string, readonly string[]>; shared: SharedKey[] } {
	const mac = onMac();
	const owners = new Map<string, SharedKey & { commands: C[] }>();
	const keys: Record<string, readonly string[]> = {};
	for (const command of order) {
		keys[command] = keysOf(command).filter((key) => {
			const id = sameKey(key, mac);
			const owner = owners.get(id);
			if (!owner) owners.set(id, { key, commands: [command] });
			else if (!owner.commands.includes(command)) owner.commands.push(command);
			return !owner || owner.commands[0] === command;
		});
	}
	return { keys, shared: [...owners.values()].filter((o) => o.commands.length > 1) };
}

/** The words of the warning of development for keys that two or more commands get, in the form of the warning of a paper. */
export function sharedKeysWarning(shared: readonly SharedKey[]): string {
	const list = shared.map((s) => `${s.key}: ${s.commands.join(', ')}`).join('; ');
	return `The keys of the rich text field give one key to two or more commands (${list}). The first command of each key takes it, in the order of the toolbar, and the other commands show no key. Give each command a key of its own.`;
}

const GLYPHS = { ctrl: '⌃', alt: '⌥', shift: '⇧', cmd: '⌘' } as const;

/** The parts of a key as a kbd shows them: glyphs on macOS, words elsewhere. */
export function keyParts(key: string): string[] {
	const k = parseKey(key);
	const base = /^[a-z]$/i.test(k.base) ? k.base.toUpperCase() : k.base;
	if (onMac()) return [...(['ctrl', 'alt', 'shift', 'cmd'] as const).filter((m) => k[m]).map((m) => GLYPHS[m]), base];
	return [...(k.ctrl || k.cmd ? ['Ctrl'] : []), ...(k.alt ? ['Alt'] : []), ...(k.shift ? ['Shift'] : []), base];
}

/** The key as one short text, for the shortcut of a menu item. */
export const keyLabel = (key: string): string => keyParts(key).join(onMac() ? '' : '+');
