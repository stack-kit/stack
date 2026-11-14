// The list column of each ListSplit, which close() of behaviour/item searches when the list holds no row
// of the item ("Esc and Close" in ### Detail pane of DESIGN.md). ListSplit and behaviour/item share it.
// The package exports no path to this file, so only ListSplit gives a list column.
import type { ItemInAddress } from './behaviour/item.js';

/** For the item in the address of each ListSplit, the function that gives its list column. */
export const listColumns = new WeakMap<ItemInAddress, () => HTMLElement | null | undefined>();
