// The state of the writing tools of the rich text field (preview/src/lib/rich-text/review/writing.svelte.js)
// on a fake engine: the results that fail a request, the order of a decision and its state, the marks
// at the end, pending while the field is busy, a page that takes pending away, Take all of two changes
// whose words overlap, and editor.load().
//
//   node --test scripts/rich-text-writing.test.mjs
//
// The module uses runes, so the test compiles it with svelte/compiler first, from the root node_modules
// or else from preview/node_modules, into a folder of the system for temporary files. The chunk of the
// diff of a whole text needs a DOM, so the test gives its own chunk through globalThis.textChunk.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const REVIEW = join(ROOT, 'preview/src/lib/rich-text/review');

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
	const { js } = require('svelte/compiler').compileModule(readFileSync(join(REVIEW, 'writing.svelte.js'), 'utf8'), { generate: 'client', dev: false, filename: 'writing.svelte.js' });
	const url = (path) => pathToFileURL(path).href;
	const client = require.resolve('svelte/internal/client');
	// "svelte" resolves to its server build in Node, and the client build has the untrack that the module calls.
	const svelte = join(dirname(require.resolve('svelte/package.json')), 'src/index-client.js');
	const swaps = [
		["from './words.js'", `from '${url(join(REVIEW, 'words.ts'))}'`],
		["import('./text.js')", 'globalThis.textChunk()'],
		["'svelte/internal/client'", `'${url(client)}'`],
		["from 'svelte'", `from '${url(svelte)}'`]
	];
	let code = js.code;
	for (const [from, to] of swaps) {
		assert.ok(code.includes(from), `the compiled module holds ${from}`);
		code = code.replaceAll(from, to);
	}
	const dir = mkdtempSync(join(tmpdir(), 'stack-writing-'));
	try {
		writeFileSync(join(dir, 'writing.mjs'), code);
		return await import(url(join(dir, 'writing.mjs')));
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

const { createWriting } = await load();
const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async () => {
	for (let k = 0; k < 4; k++) await tick();
};

/** A chunk of the diff of a whole text with no DOM. */
const CHUNK = { linesOf: () => ({ lines: [{ kind: 'added', text: 'New', new: 1 }], count: 1 }), Proposal: {} };
globalThis.textChunk = async () => CHUNK;

/** An engine of the text "the cat sat on the mat" and a second line, which logs what the writing tools do to it. */
function fakeEngine() {
	const text = ['the cat sat on the mat', 'Second line'];
	const log = [];
	return {
		log,
		html: () => text.map((l) => `<div>${l}</div>`).join(''),
		words: () => text.join('\n'),
		empty: () => false,
		find(spots) {
			const out = new Map();
			for (const s of spots) {
				const line = text[s.block] ?? '';
				const at = line.indexOf(s.old);
				if (at >= 0 && line.indexOf(s.old, at + 1) < 0) out.set(s.n, { range: { line: s.block, from: at, to: at + s.old.length }, line: s.block, at });
			}
			return out;
		},
		mark: (ranges, active) => log.push(['mark', ranges.length, active]),
		replace: (parts) => log.push(['replace', parts.map((p) => [p.range.from, p.range.to, p.text])]),
		replaceAll: (html) => log.push(['replaceAll', html])
	};
}

/** The writing tools on a fake engine. `config` is the writing prop of the page, which a test changes as a page does. */
function setup(config = {}) {
	const engine = fakeEngine();
	const fails = [];
	const alerts = [];
	const decisions = [];
	const page = { run: () => new Promise(() => {}), ondecide: (d) => decisions.push(d), ...config };
	const w = createWriting(engine, () => page, (f) => (fails.push(f), f.kind === 'writing' ? 'The check did not finish.' : 'The diff did not load.'), {
		preset: 'full',
		picture: () => true,
		readonly: () => false,
		alert: (words) => alerts.push(words)
	});
	/** Gives the pending value of the page, as the field does when the prop changes. */
	const give = (pending) => {
		page.pending = pending;
		w.offer(pending);
	};
	return { w, engine, fails, alerts, decisions, page, give };
}

const C = (block, old, now) => ({ block, old, new: now, rule: 'Style', reason: 'A shorter word.' });
const changes = (...list) => ({ kind: 'changes', changes: list });
/** A service that keeps each request until the test answers it. */
function held() {
	const calls = [];
	const run = (request, signal) => new Promise((resolve, reject) => calls.push({ request, signal, resolve, reject }));
	return { calls, run };
}

test('a result that is no WritingResult fails the request with the kind writing, and the text unlocks', async () => {
	const bad = [changes(null), changes({ block: 0, old: 'cat', new: 'dog', reason: 'r' }), changes({ ...C(0, 'cat', 'dog'), block: -1 }), { kind: 'text' }, { kind: 'text', html: '<div>a</div>', title: 4 }, { kind: 'changes', changes: [], note: 3 }, { kind: 'other' }, null];
	for (const result of bad) {
		const { w, fails } = setup({ run: () => Promise.resolve(result) });
		assert.equal(w.run('check'), true);
		await settle();
		assert.equal(w.state.kind, 'failed', `failed for ${JSON.stringify(result)}`);
		assert.equal(w.locks, false, `unlocked for ${JSON.stringify(result)}`);
		assert.equal(w.state.words, 'The check did not finish.');
		assert.deepEqual(fails.map((f) => f.kind), ['writing']);
		assert.ok(fails[0].error instanceof TypeError);
	}
});

test('an error while the field shows a whole text fails the request, and the text unlocks', async () => {
	globalThis.textChunk = async () => ({ ...CHUNK, linesOf: () => { throw new Error('The diff broke.'); } });
	try {
		const { w, fails } = setup({ run: () => Promise.resolve({ kind: 'text', html: '<h2>New</h2>' }) });
		w.run('structure');
		await settle();
		assert.equal(w.state.kind, 'failed');
		assert.equal(w.locks, false);
		assert.deepEqual(fails.map((f) => [f.kind, f.error.message]), [['writing', 'The diff broke.']]);
	} finally {
		globalThis.textChunk = async () => CHUNK;
	}
});

test('a diff chunk that does not load gives the words of the page to the line above the text, and the request bar shows none', async () => {
	globalThis.textChunk = async () => {
		throw new Error('The chunk is gone.');
	};
	const error = console.error;
	console.error = () => {};
	try {
		const { w, fails, alerts } = setup({ run: () => Promise.resolve({ kind: 'text', html: '<h2>New</h2>' }) });
		w.run('structure');
		await settle();
		assert.deepEqual([w.state.kind, w.state.words, w.locks], ['failed', null, false]);
		assert.deepEqual(fails.map((f) => `${f.kind} ${f.part}`), ['load review']);
		assert.deepEqual(alerts, ['The diff did not load.']);
	} finally {
		console.error = error;
		globalThis.textChunk = async () => CHUNK;
	}
});

test('an ondecide that throws finds the state idle already, so a whole text is taken once and the text unlocks', async () => {
	for (const act of ['takeAll', 'leaveAll']) {
		const { w, engine } = setup({
			run: () => Promise.resolve({ kind: 'text', html: '<h2>New</h2>' }),
			ondecide: () => {
				throw new Error('The log is down.');
			}
		});
		w.run('structure');
		await settle();
		assert.equal(w.state.kind, 'text');
		assert.throws(() => w[act](), /The log is down/);
		assert.deepEqual([w.state.kind, w.locks], ['idle', false], act);
		w.takeAll();
		w.leaveAll();
		assert.equal(engine.log.filter((l) => l[0] === 'replaceAll').length, act === 'takeAll' ? 1 : 0, act);
	}
});

test('the end of the writing tools paints no mark in the text', async () => {
	const { w, engine } = setup({ run: () => Promise.resolve(changes(C(0, 'cat', 'dog'))) });
	w.run('check');
	await settle();
	assert.deepEqual(engine.log.filter((l) => l[0] === 'mark').at(-1), ['mark', 1, null]);
	w.destroy();
	assert.deepEqual(engine.log.at(-1), ['mark', 0, null]);
});

test('a new pending waits while a request of the person runs, and starts when the request fails, if the page still gives it', async () => {
	const service = held();
	const { w, give } = setup({ run: service.run });
	w.run('check');
	await settle();
	const pending = { kind: 'check', asked: { by: 'Morgan', at: '09:14' }, result: changes(C(1, 'Second', '2nd')) };
	give(pending);
	assert.equal(service.calls[0].signal.aborted, false, 'the pending does not abort the request of the person');
	assert.deepEqual([w.state.kind, w.state.asked], ['running', null]);
	service.calls[0].reject(new Error('The service is down.'));
	await settle();
	assert.equal(w.state.kind, 'changes', 'the held pending starts once the request failed');
	assert.deepEqual([w.state.asked, w.changes.map((c) => c.old)], [{ by: 'Morgan', at: '09:14' }, ['Second']]);
});

test('a new pending never drops open changes: it starts when the person decided the last open change', async () => {
	const { w, give, decisions } = setup({ run: () => Promise.resolve(changes(C(0, 'cat', 'dog'), C(1, 'Second', '2nd'))) });
	w.run('check');
	await settle();
	give({ kind: 'check', asked: { by: 'Sam', at: '10:02' }, result: changes(C(0, 'mat', 'rug')) });
	await settle();
	assert.deepEqual(w.changes.map((c) => c.old), ['cat', 'Second'], 'the open changes stay');
	w.take([1]);
	await settle();
	assert.deepEqual(w.changes.map((c) => `${c.old} ${c.state}`), ['cat taken', 'Second open']);
	w.leave([2]);
	await settle();
	assert.deepEqual([w.state.asked, w.changes.map((c) => c.old)], [{ by: 'Sam', at: '10:02' }, ['mat']]);
	assert.deepEqual(decisions.map((d) => `${d.change} ${d.taken}`), ['1 true', '2 false']);
});

test('a new pending never drops a waiting whole text, and the field starts the newest one that the page still gives', async () => {
	const { w, give, engine } = setup({ run: () => Promise.resolve({ kind: 'text', html: '<h2>Mine</h2>' }) });
	w.run('structure');
	await settle();
	const first = { kind: 'check', result: changes(C(0, 'cat', 'dog')) };
	const second = { kind: 'check', result: changes(C(0, 'mat', 'rug')) };
	give(first);
	give(second);
	await settle();
	assert.deepEqual([w.state.kind, w.locks], ['text', true], 'the whole text waits');
	w.takeAll();
	await settle();
	assert.deepEqual(engine.log.filter((l) => l[0] === 'replaceAll').map((l) => l[1]), ['<h2>Mine</h2>']);
	assert.deepEqual(w.changes.map((c) => c.old), ['mat'], 'the newest pending starts');
	// A held pending that the page took away does not start.
	w.run('structure');
	await settle();
	give({ kind: 'check', result: changes(C(0, 'cat', 'dog')) });
	give(undefined);
	w.leaveAll();
	await settle();
	assert.equal(w.state.kind, 'idle');
});

test('a page that takes pending away ends a request or a result of a pending, and keeps one of the person', async () => {
	// A pending result that never comes keeps the text locked until the page takes it away.
	const a = setup();
	a.give({ kind: 'check', result: new Promise(() => {}) });
	await settle();
	assert.deepEqual([a.w.state.kind, a.w.locks], ['running', true]);
	a.give(undefined);
	assert.deepEqual([a.w.state.kind, a.w.locks], ['idle', false]);
	// A whole text of a pending that waits goes.
	const b = setup();
	b.give({ kind: 'structure', result: { kind: 'text', html: '<h2>New</h2>' } });
	await settle();
	assert.equal(b.w.state.kind, 'text');
	b.give(undefined);
	assert.deepEqual([b.w.state.kind, b.w.locks], ['idle', false]);
	// A request of the person stays, and so does its result.
	const service = held();
	const c = setup({ run: service.run });
	c.give({ kind: 'check', result: changes(C(0, 'cat', 'dog')) });
	await settle();
	c.w.leave([1]);
	c.w.run('check');
	c.give(undefined);
	await settle();
	assert.deepEqual([c.w.state.kind, service.calls[0].signal.aborted], ['running', false]);
	service.calls[0].resolve(changes(C(1, 'Second', '2nd')));
	await settle();
	assert.deepEqual(c.w.changes.map((x) => x.old), ['Second']);
});

test('the same pending object starts once', async () => {
	const { w, give } = setup();
	const pending = { kind: 'check', result: changes(C(0, 'cat', 'dog')) };
	give(pending);
	await settle();
	w.leaveAll();
	give(undefined);
	give(pending);
	await settle();
	assert.equal(w.state.kind, 'idle');
});

test('Take all of two changes whose words overlap takes the first in the text, and the other stays open', async () => {
	const { w, engine } = setup({ run: () => Promise.resolve(changes(C(0, 'cat sat', 'dog stood'), C(0, 'the cat', 'a dog'), C(1, 'Second', '2nd'))) });
	w.run('check');
	await settle();
	w.takeAll();
	assert.deepEqual(engine.log.filter((l) => l[0] === 'replace').map((l) => l[1]), [[[0, 7, 'a dog'], [0, 6, '2nd']]]);
	assert.deepEqual(w.changes.map((c) => `${c.n} ${c.old} ${c.state}`), ['1 the cat taken', '2 cat sat open', '3 Second taken']);
});

test('reset, the editor.load() of the page, ends the request and the result of the content before it', async () => {
	const service = held();
	const { w } = setup({ run: service.run });
	w.run('check');
	await settle();
	w.reset();
	assert.deepEqual([w.state.kind, w.locks, service.calls[0].signal.aborted], ['idle', false, true]);
	service.calls[0].resolve(changes(C(0, 'cat', 'dog')));
	await settle();
	assert.equal(w.state.kind, 'idle', 'a late result for the content before changes nothing');
	w.run('structure');
	service.calls.length = 0;
	await settle();
	service.calls[0].resolve({ kind: 'text', html: '<h2>Old record</h2>' });
	await settle();
	assert.equal(w.state.kind, 'text');
	w.reset();
	assert.deepEqual([w.state.kind, w.locks], ['idle', false], 'a waiting whole text of the content before goes');
});
