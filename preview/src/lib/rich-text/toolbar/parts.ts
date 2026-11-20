// The parts of the toolbar of the rich text field that load when a field first needs them (### rich-text-field
// in DESIGN.md): the menus, the drawer of More below 768 px, the forms with the color picker, and the bar
// over selected text. Each loads once, in a chunk of its own, so a field loads at its mount only what it
// mounts: the simple preset loads no menu, no drawer, no form and no bar over selected text until a
// person needs one. The fields of a page share each chunk, and `now` gives it at once after the first load.
// A load that fails, such as in a short break of the network, is forgotten, so the next use loads again.
export type LazyPart<T> = {
	/** The part once it loaded, else null. */
	readonly now: T | null;
	/** Loads the part once, and gives it. A failed load rejects, and the next call loads again. */
	load(): Promise<T>;
};

export function lazy<T>(get: () => Promise<{ default: T }>): LazyPart<T> {
	let now: T | null = null;
	let loading: Promise<T> | null = null;
	return {
		get now() {
			return now;
		},
		load: () =>
			(loading ??= get().then(
				(m) => {
					now = m.default;
					return now;
				},
				(error: unknown) => {
					loading = null;
					throw error;
				}
			))
	};
}

export const menu = lazy(() => import('./Menu.svelte'));
export const drawer = lazy(() => import('./MoreDrawer.svelte'));
export const forms = lazy(() => import('./Forms.svelte'));
export const selectionBar = lazy(() => import('./SelectionBar.svelte'));
/** The slash menu, a menu of the field that no toolbar holds, in its own chunk too: a failed load reaches the page as a load of the toolbar. */
export const slashMenu = lazy(() => import('../slash/SlashMenu.svelte'));
