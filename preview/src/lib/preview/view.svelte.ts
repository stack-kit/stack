import { setMode } from 'mode-watcher';
import { listenForPrint } from '#lib/stack/behaviour/print.js';

// The theme and the mode of the preview. The theme is a <link> to the real file in themes/,
// the file that a product imports, so the preview never copies a theme value. The script in
// <head> of app.html adds the <link> (#stack-theme) to /themes/<name>.css and sets
// data-theme="<name>" and the mode before the first paint, as "A theme switch in a product" in
// ## Themes of DESIGN.md says. The route src/routes/themes/[name].css serves the files.

// One choice of the switch for each file in themes/. Only the keys of the glob are read, so no
// file loads through an import.
export const THEMES: string[] = Object.keys(import.meta.glob('../../../../themes/*.css', { query: '?raw' })).map(
	(path) => path.slice(path.lastIndexOf('/') + 1, -'.css'.length)
);

// app.html reads the same two keys before the first paint.
const THEME_KEY = 'stack-preview-theme';
const MODE_KEY = 'stack-preview-mode';

class View {
	// The script in app.html checked the stored name against its list of themes.
	theme = $state(document.documentElement.dataset.theme ?? 'default');
	dark = $state(document.documentElement.classList.contains('dark'));

	constructor() {
		document.documentElement.style.colorScheme = this.dark ? 'dark' : 'light';
		// The sonner component of the kit reads mode.current of mode-watcher, and mode-watcher then
		// writes color-scheme on <html> from its own stored choice, which is "system" by default. So
		// every mode of the preview also goes to mode-watcher, here and in setDark.
		setMode(this.dark ? 'dark' : 'light');
		// The print listeners of the package ("### A screen page in print" in ## Print of DESIGN.md): the
		// page prints in light mode, the width queries of the components answer as at the column of the
		// paper, the marks of each chart pattern become shapes, and each chart fits its column. The stored
		// mode stays, and afterprint restores it.
		listenForPrint();
	}

	/**
	 * The switch of "Pick a theme" in README.md: a new href on the <link>, and the attribute in
	 * its load event. The browser keeps the old file until the new one loads, so the attribute
	 * and the values of the new file change in the same frame.
	 */
	setTheme(name: string) {
		if (!THEMES.includes(name)) throw new Error(`No theme "${name}". The themes are: ${THEMES.join(', ')}.`);
		const link = document.getElementById('stack-theme') as HTMLLinkElement;
		link.onload = () => (document.documentElement.dataset.theme = name);
		link.href = `/themes/${name}.css`;
		localStorage.setItem(THEME_KEY, name);
		this.theme = name;
	}

	setDark(dark: boolean) {
		this.dark = dark;
		document.documentElement.classList.toggle('dark', dark);
		document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
		setMode(dark ? 'dark' : 'light');
		localStorage.setItem(MODE_KEY, dark ? 'dark' : 'light');
	}
}

export const view = new View();

/**
 * True when the URL forces this overlay open: /?open=<id>. An overlay showcase marks each
 * instance with data-open-id, on the trigger or on the root of the field that holds the trigger,
 * such as a time zone field. The measure probe loads each id.
 */
export function forcedOpen(id: string): boolean {
	return new URLSearchParams(location.search).get('open') === id;
}
