// The attributes of the HTML frame (preview/src/lib/stack/HtmlFrame.svelte) on the server: the part
// drops each rest key whose lowercase form is an attribute that the part sets or removes, in any case,
// and it keeps the other attributes of the product.
//
//   node --test scripts/html-frame.test.mjs
//
// Svelte writes a spread key in lowercase, so a key such as srcDoc or SANDBOX gives the attribute
// srcdoc or sandbox. On the server, Svelte writes the attribute of the product before the attribute of
// the part, and the parser of a browser keeps the first of two attributes with one name. So a key of
// the product in another case gave the frame its srcdoc, its sandbox or its src before the page ran
// a script. The test compiles the part for the server with svelte/compiler, from the root node_modules
// or else from preview/node_modules, into a folder of the system for temporary files, and renders it
// with svelte/server. The part reads utils.ts, frame-height.ts and frame-message.ts, which Node runs with
// its type stripping.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const LIB = join(ROOT, 'preview/src/lib');

/** The require of the first node_modules that holds svelte. */
function svelteRequire() {
	for (const from of [join(ROOT, 'package.json'), join(ROOT, 'preview/package.json')]) {
		const require = createRequire(from);
		try {
			require.resolve('svelte/compiler');
			return require;
		} catch {}
	}
	throw new Error('svelte is not installed. Run "npm ci" in the root of the repository.');
}

async function load() {
	const require = svelteRequire();
	const file = join(LIB, 'stack/HtmlFrame.svelte');
	const { js } = require('svelte/compiler').compile(readFileSync(file, 'utf8'), { generate: 'server', dev: false, filename: 'HtmlFrame.svelte' });
	const url = (path) => pathToFileURL(path).href;
	const swaps = [
		["'svelte/internal/server'", `'${url(require.resolve('svelte/internal/server'))}'`],
		["'#lib/utils.js'", `'${url(join(LIB, 'utils.ts'))}'`],
		["'./frame-height.js'", `'${url(join(LIB, 'stack/frame-height.ts'))}'`],
		["'./frame-message.js'", `'${url(join(LIB, 'stack/frame-message.ts'))}'`]
	];
	let code = js.code;
	for (const [from, to] of swaps) {
		assert.ok(code.includes(from), `the compiled part holds ${from}`);
		code = code.replaceAll(from, to);
	}
	const dir = mkdtempSync(join(tmpdir(), 'stack-html-frame-'));
	try {
		writeFileSync(join(dir, 'HtmlFrame.mjs'), code);
		const { default: HtmlFrame } = await import(url(join(dir, 'HtmlFrame.mjs')));
		const { render } = await import(url(require.resolve('svelte/server')));
		return (props) => render(HtmlFrame, { props }).body;
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

const render = await load();

const SRC = 'https://content.example.net/mail/m1';
const TITLE = 'The message from Ana Turner, as the sender designed it';
/** Each attribute that the part sets, with its value. */
const SET = {
	'data-slot': 'html-frame',
	class: 'block w-full',
	src: SRC,
	title: TITLE,
	sandbox: 'allow-scripts allow-popups allow-popups-to-escape-sandbox',
	referrerpolicy: 'no-referrer',
	style: 'height: 320px;'
};
/** A value that a product could give each attribute that the part sets or removes, to change the frame. */
const HOSTILE = {
	'data-slot': 'another-slot',
	class: 'hidden',
	src: 'javascript:parent.postMessage(1)',
	title: 'A title of the product',
	sandbox: 'allow-scripts allow-same-origin allow-top-navigation',
	referrerpolicy: 'unsafe-url',
	style: 'height: 1px',
	height: '1',
	srcdoc: '<script>parent.postMessage(2)</script>',
	allow: 'camera; microphone',
	allowfullscreen: '',
	webkitallowfullscreen: '',
	mozallowfullscreen: '',
	allowpaymentrequest: '',
	name: 'app',
	csp: "script-src 'unsafe-inline'"
};
/**
 * The lowercase keys that the part takes in its own way: four are props, and style is the key that the
 * part merges with its height.
 */
const OWN_WAY = new Set(['src', 'title', 'class', 'height', 'style']);
/** The forms of a key: as it is, in capitals, with a capital first letter, and with every second letter a capital, as srcDoc. */
const FORMS = {
	lowercase: (k) => k,
	capitals: (k) => k.toUpperCase(),
	first: (k) => k[0].toUpperCase() + k.slice(1),
	alternate: (k) => [...k].map((c, i) => (i % 2 ? c.toUpperCase() : c)).join('')
};

/** The attributes of the <iframe> in the HTML of the server, in their order, as [name, value]. */
function frameAttributes(html) {
	const start = html.indexOf('<iframe');
	assert.notEqual(start, -1, `the part renders an <iframe>: ${html}`);
	const pattern = /\s+([^\s"'>/=]+)(?:="([^"]*)")?/y;
	let at = start + '<iframe'.length;
	const out = [];
	for (let m; (pattern.lastIndex = at), (m = pattern.exec(html)); at = pattern.lastIndex) out.push([m[1], m[2] ?? '']);
	assert.equal(html[at], '>', `the <iframe> tag ends after its attributes: ${html.slice(start, at + 1)}`);
	return out;
}

for (const [form, key] of Object.entries(FORMS)) {
	test(`the part drops each key in the form "${form}" of an attribute that it sets or removes`, () => {
		const given = Object.fromEntries(Object.entries(HOSTILE).filter(([k]) => form !== 'lowercase' || !OWN_WAY.has(k)).map(([k, v]) => [key(k), v]));
		const html = render({ src: SRC, title: TITLE, ...given });
		const found = frameAttributes(html);
		const names = found.map(([n]) => n);
		assert.deepEqual(names.filter((n, i) => names.indexOf(n) !== i), [], `each attribute comes once: ${JSON.stringify(found)}`);
		const attributes = Object.fromEntries(found);
		for (const removed of ['height', 'srcdoc', 'allow', 'allowfullscreen', 'webkitallowfullscreen', 'mozallowfullscreen', 'allowpaymentrequest', 'name', 'csp']) assert.equal(attributes[removed], undefined, `no ${removed}: ${JSON.stringify(found)}`);
		for (const [name, value] of Object.entries(SET)) assert.equal(attributes[name], value, `${name} is the value of the part: ${JSON.stringify(found)}`);
	});
}

test('the part keeps the other attributes of the product, also in another case', () => {
	const html = render({ src: SRC, title: TITLE, 'aria-describedby': 'note', 'Aria-Label': 'The mail', 'data-probe': 'frame', id: 'frame-1', loading: 'lazy' });
	const attributes = Object.fromEntries(frameAttributes(html));
	assert.deepEqual(
		{ 'aria-describedby': attributes['aria-describedby'], 'aria-label': attributes['aria-label'], 'data-probe': attributes['data-probe'], id: attributes.id, loading: attributes.loading },
		{ 'aria-describedby': 'note', 'aria-label': 'The mail', 'data-probe': 'frame', id: 'frame-1', loading: 'lazy' }
	);
});

test('the part merges the key style of the product with its height', () => {
	const attributes = Object.fromEntries(frameAttributes(render({ src: SRC, title: TITLE, style: 'max-width: 600px' })));
	assert.equal(attributes.style, 'max-width: 600px; height: 320px;');
});
