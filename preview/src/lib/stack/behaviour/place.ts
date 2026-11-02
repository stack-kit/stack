// The places of the frame of a product ("### selection-bar" in DESIGN.md). The frame wraps the content
// of its top bar and of its phone header in FramePlace, with the name of the place. A part, such as
// SelectionBar, claims a place in $effect, and the place then shows the claim in the place of its
// content, so that no row of the page moves. The live region of the place says the text of announce.
//
//   $effect(() => claimPlace('top-bar', bar) ?? undefined);
//
// claimPlace returns null while the page holds no FramePlace of the name, and the part then renders
// where it stands, such as in a card. It reads the places in the effect, so the effect runs again when a
// FramePlace of the name comes or goes. The newest claim of a name shows.
//
// The state of the places is in ../place-state.ts, which FramePlace reads and the package does not export.
import { untrack, type Snippet } from 'svelte';
import { claims, held, said, type Claim } from '../place-state.js';

/** A place of the frame: the content of the top bar from 768 px, and of the phone header below. */
export type PlaceName = 'top-bar' | 'phone-header';

/**
 * Shows content in the FramePlace of the name, in the place of its content, until the returned function
 * runs. Call it in $effect, and end the claim in the teardown of the effect. null: the page holds no
 * FramePlace of the name, so the part renders where it stands.
 */
export function claimPlace(name: PlaceName, content: Snippet): (() => void) | null {
	if (!held.get(name)) return null;
	const claim: Claim = { content };
	untrack(() => claims.set(name, [...(claims.get(name) ?? []), claim]));
	return () =>
		untrack(() => {
			const list = claims.get(name) ?? [];
			if (list.includes(claim)) claims.set(name, list.filter((c) => c !== claim));
		});
}

/** The live region of the FramePlace of the name says the text, such as "2 selected". Call it in $effect. */
export function announce(name: PlaceName, text: string): void {
	untrack(() => said.set(name, text));
}
