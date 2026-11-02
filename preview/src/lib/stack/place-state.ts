// The state of the places of the frame ("### selection-bar" in DESIGN.md), which behaviour/place.ts,
// FramePlace and SelectionBar share. The package exports no path to this file, so a product reaches
// the places only through FramePlace and through claimPlace and announce of behaviour/place.
//
// Only $effect writes this state, so only the browser writes it, and no request of the server sees a
// claim. A Svelte map keeps the state, because a plain .ts file compiles no runes.
import { untrack, type Snippet } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import type { PlaceName } from './behaviour/place.js';

export type Claim = { readonly content: Snippet };

/** How many FramePlace of each name the page holds. */
export const held = new SvelteMap<PlaceName, number>();
/** The claims of each name, oldest first. */
export const claims = new SvelteMap<PlaceName, readonly Claim[]>();
/** The text of the live region of each name. */
export const said = new SvelteMap<PlaceName, string>();

/**
 * For FramePlace: counts a place of the name until the returned function runs, so that claimPlace
 * gives a claim. FramePlace calls it in $effect. When the last place of the name leaves, its text goes too.
 */
export function holdPlace(name: PlaceName): () => void {
	untrack(() => held.set(name, (held.get(name) ?? 0) + 1));
	return () =>
		untrack(() => {
			const n = (held.get(name) ?? 1) - 1;
			if (n > 0) held.set(name, n);
			else {
				held.delete(name);
				said.delete(name);
			}
		});
}

/** True while the page holds a FramePlace of the name. Read it in $derived, $effect or the template. */
export function holdsPlace(name: PlaceName): boolean {
	return !!held.get(name);
}

/** For FramePlace: the newest claim of the name, or null, and the text of its live region. Read it in the template. */
export function placeOf(name: PlaceName): { readonly content: Snippet | null; readonly said: string } {
	return {
		get content() {
			return claims.get(name)?.at(-1)?.content ?? null;
		},
		get said() {
			return said.get(name) ?? '';
		}
	};
}
