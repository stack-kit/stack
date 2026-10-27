import tailwindcss from '@tailwindcss/vite';
import nodeAdapter from '@sveltejs/adapter-node';
import staticAdapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// `npm run build:static` sets PREVIEW_STATIC=1 and writes a single-page app into dist-static/.
// Its index.html renders every route on the client, so a new route needs no change here.
// The pages are not prerendered, because the prerender option of +layout.ts would change the
// Node build too. Every other script uses the Node adapter.
const adapter =
	process.env.PREVIEW_STATIC === '1'
		? staticAdapter({ pages: 'dist-static', fallback: 'index.html' })
		: nodeAdapter();

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter
		})
	],
	server: {
		// The preview reads DESIGN.md, stack.css and themes/ from the repository root, one level up.
		fs: { allow: ['..'] }
	}
});
