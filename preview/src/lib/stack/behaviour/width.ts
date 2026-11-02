// The width bands of the parts ("### Width bands" in DESIGN.md). A part that picks its layout in script
// reads the line of its band here, such as bands.md.current, and builds no width query of its own. Each
// band is a ScreenQuery, so in print it answers as at the column of the paper ("A layout that a script
// picks" in "### A screen page in print" in DESIGN.md). The lines are the breakpoints of the front matter
// of DESIGN.md, which scripts/theme.mjs writes into design-values.ts, so "npm run theme -- --check"
// covers them.
//
// isPrinting is here too, for a page that kept the print state of the old screen query.
import { breakpoints } from '../design-values.js';
import { ScreenQuery } from '../screen-query.svelte.js';

export { ScreenQuery, isPrinting } from '../screen-query.svelte.js';

const from = (px: number) => new ScreenQuery(`min-width: ${px / 16}rem`);

/** The lines of breakpoints in DESIGN.md: md 768, lg 1024, xl 1280 and 2xl 1440 px. The bands are in rem (px / 16), as the CSS breakpoints are, so a band and the md: classes start at the same width. Each is true from its line up. */
export const bands: Readonly<Record<'md' | 'lg' | 'xl' | '2xl', ScreenQuery>> = Object.freeze({
	md: from(breakpoints.md),
	lg: from(breakpoints.lg),
	xl: from(breakpoints.xl),
	'2xl': from(breakpoints['2xl'])
});
