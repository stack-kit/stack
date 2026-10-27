import { error } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';

// Each file of themes/ in the repository root, unchanged, at the fixed path /themes/<name>.css.
// The script in <head> of src/app.html links that path before the first paint, as "Pick a theme"
// in README.md gives it. An imported file gets a hashed URL from Vite, which that script cannot
// know. The route is prerendered, so the static build writes each file to dist-static/themes/.
const files = import.meta.glob<string>('../../../../../themes/*.css', {
	query: '?raw',
	import: 'default',
	eager: true
});

const themes = new Map(
	Object.entries(files).map(([path, css]) => [path.slice(path.lastIndexOf('/') + 1, -'.css'.length), css])
);

export const prerender = true;

export const entries: EntryGenerator = () => [...themes.keys()].map((name) => ({ name }));

export const GET: RequestHandler = ({ params }) => {
	const css = themes.get(params.name);
	if (css === undefined) error(404, `No theme "${params.name}". The themes are: ${[...themes.keys()].join(', ')}.`);
	return new Response(css, { headers: { 'content-type': 'text/css; charset=utf-8' } });
};
