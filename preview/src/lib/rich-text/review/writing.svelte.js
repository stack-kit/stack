// The state of the writing tools of one field (### rich-text-field in DESIGN.md, "Writing tools"). The
// product gives one function, run(request, signal); this module owns the rest: the states, the numbering
// of the changes, the open, taken and left state of each change, and the diff of a whole text. It runs on
// a text model (TextModel of engine/types.ts), which gives the words as lines, finds and marks a change,
// and makes a Take. RichTextField.svelte creates one on its engine when the page gives `writing`, and it
// loads in the review chunk.
// It is a .svelte.js file with its types in JSDoc, because the dev server of a product does not compile a
// .svelte.ts file inside a package (scripts/rune-types.mjs).
//
// - States: idle, running, changes, text, failed and stopped. A request runs while its result is on the
//   way, and also while the chunk of the diff loads for a whole text, so the text and Stop keep their
//   place until the diff shows.
// - Stop aborts the signal of the request, and so does the end of the field. Each request has a token,
//   and a result that comes after Stop or after a newer request has an old token, so it changes nothing.
// - pending is a request that this view did not start, such as one that another person asked for. Its
//   result is a promise or a value; Stop drops it, because the view has no signal of it. A new pending
//   never aborts a request of the person and never drops open changes or a waiting whole text: while a
//   request runs, a whole text waits or a change is open, the field holds the newest pending, and starts
//   it when the state comes back to idle, stopped, failed or each change decided, if the page still gives
//   it. When the page takes pending away, a request or a result that came from a pending ends, and one that
//   the person started stays.
// - editor.load() of the page ends the request and the result of the content before it (reset).
// - A result that the field does not take, or an error while the field shows it, fails the request.
// - A whole text comes as html. A field that sets `plain` in its WritingField also takes it as plain
//   (PlainResult of plain.ts), which becomes HTML with each line a line of its own, so the diff and Take
//   all read it as the lines of a text with no format. A result that gives both takes html. The rich text
//   field does not set `plain`, so a plain whole text fails there as before.
// - A change that the person left stays in Left out, and Take after all takes it while its words stand.
// - ondecide gives each decision to the product, for its log, after the field set the new state.
import { untrack } from 'svelte';
import { plainHtml } from './plain.js';
import { WRITING_WORDS } from './words.js';

/** @typedef {import('#lib/stack/rich-text.js').RichTextFailure} RichTextFailure */
/** @typedef {import('#lib/stack/rich-text.js').RichTextPreset} RichTextPreset */
/** @typedef {import('#lib/stack/rich-text.js').RichTextWriting} RichTextWriting */
/** @typedef {import('#lib/stack/rich-text.js').TextRange} TextRange */
/** @typedef {import('#lib/stack/rich-text.js').WritingChange} WritingChange */
/** @typedef {import('#lib/stack/rich-text.js').WritingKind} WritingKind */
/** @typedef {import('#lib/stack/rich-text.js').WritingRequest} WritingRequest */
/** @typedef {import('#lib/stack/rich-text.js').WritingResult} WritingResult */
/** @typedef {import('#lib/stack/rich-text.js').WritingWords} WritingWords */
/** @typedef {import('./plain.js').PlainResult} PlainResult */
/**
 * @template R
 * @typedef {import('../engine/types.js').FoundChange<R>} FoundChange
 */
/**
 * @template R
 * @typedef {import('../engine/types.js').TextModel<R>} TextModel
 */

/**
 * A result that the writing tools take: a WritingResult, or a whole text as plain, which only a field
 * with `plain` takes. It is no public type.
 * @typedef {WritingResult | PlainResult} ReviewResult
 */

/**
 * The writing prop of a field, with run() and pending that can give a ReviewResult. A RichTextWriting is
 * one, so the rich text field gives its prop as it is.
 * @typedef {Omit<RichTextWriting, 'run' | 'pending'> & {
 *   run: (request: WritingRequest, signal: AbortSignal) => Promise<ReviewResult>;
 *   pending?: { kind: WritingKind; asked?: { by: string; at: string } | undefined; result: Promise<ReviewResult> | ReviewResult } | undefined;
 * }} ReviewWriting
 */
/** @typedef {NonNullable<ReviewWriting['pending']>} Pending */

/**
 * A line of the diff of a whole text, as diff.ts gives it.
 * @typedef {ReturnType<typeof import('./diff.js').diffBlocks>[number]} DiffLine
 */

/**
 * A change of a result: numbered from 1 in the order of the text, with its state.
 * @typedef {WritingChange & { n: number; state: 'open' | 'taken' | 'left' }} Change
 */

/**
 * Who asked for a request that this view did not start, and when.
 * @typedef {{ by: string; at: string } | null} Asked
 */

/**
 * @typedef {{ kind: 'idle' }
 *   | { kind: 'running'; request: WritingRequest; asked: Asked }
 *   | { kind: 'stopped'; request: WritingRequest; asked: Asked }
 *   | { kind: 'failed'; request: WritingRequest; asked: Asked; words: string | null }
 *   | { kind: 'changes'; request: WritingRequest; asked: Asked; changes: readonly Change[]; note: string | null }
 *   | { kind: 'text'; request: WritingRequest; asked: Asked; html: string; plain: string | null; title: string; note: string | null; lines: DiffLine[]; count: number }} WritingState
 */

/**
 * What the writing tools read from their field.
 * @typedef {object} WritingField
 * @property {RichTextPreset} preset
 * @property {(src: string) => boolean} picture
 * @property {() => boolean} readonly True while the page makes the text read-only.
 * @property {(words: string) => void} alert Shows the words of the page for a chunk that did not load, in the line with role="alert" above the text.
 * @property {boolean} [plain] True when the field takes a whole text as plain (PlainResult), such as a field of a plain text. The rich text field takes html only.
 */

/**
 * The part that shows the diff of a whole text (Proposal.svelte).
 * @typedef {import('svelte').Component<{ lines: DiffLine[]; title: string; preset: RichTextPreset; words: WritingWords }>} ProposalPart
 */

/**
 * Every writing tool, in the order of the toolbar.
 * @type {readonly WritingKind[]}
 */
export const WRITING_KINDS = ['check', 'rewrite', 'instruction', 'structure'];

/**
 * True for a change with a line number and four texts.
 * @param {unknown} c
 * @returns {c is WritingChange}
 */
function isChange(c) {
	if (!c || typeof c !== 'object') return false;
	const { block, old, new: now, rule, reason } = /** @type {Record<string, unknown>} */ (c);
	return Number.isInteger(block) && Number(block) >= 0 && [old, now, rule, reason].every((t) => typeof t === 'string');
}

/** @param {unknown} t */
const optionalText = (t) => t === undefined || typeof t === 'string';

/**
 * Why a result of the service is no result that the field takes, or null for a result that the field can
 * show. A whole text as plain passes only when `plain` is true.
 * @param {unknown} result
 * @param {boolean} plain
 * @returns {string | null}
 */
function malformed(result, plain) {
	if (!result || typeof result !== 'object') return 'The writing service gave no result object.';
	const r = /** @type {Record<string, unknown>} */ (result);
	if (!optionalText(r.note)) return 'The note of the result is not a string.';
	if (r.kind === 'changes') {
		if (!Array.isArray(r.changes)) return 'The changes of the result are not an array.';
		const bad = r.changes.findIndex((c) => !isChange(c));
		return bad < 0 ? null : `Change ${bad} of the result needs block as a whole number from 0, and old, new, rule and reason as strings.`;
	}
	if (r.kind === 'text') {
		const text = typeof r.html === 'string' || (plain && r.html === undefined && typeof r.plain === 'string');
		if (text && optionalText(r.title)) return null;
		return plain ? 'A whole text needs html or plain as a string, and its title is a string or undefined.' : 'A whole text needs html as a string, and its title is a string or undefined.';
	}
	return 'The writing service gave a result that is neither changes nor a text.';
}

/**
 * A whole text that malformed() passed, as HTML, and the plain text that the service gave, or null for a
 * text that it gave as HTML. html wins when the result gives both.
 * @param {Extract<ReviewResult, { kind: 'text' }>} result
 * @returns {{ html: string; plain: string | null }}
 */
function wholeText(result) {
	if ('html' in result && typeof result.html === 'string') return { html: result.html, plain: null };
	const { plain } = /** @type {{ plain: string }} */ (result);
	return { html: plainHtml(plain), plain };
}

/**
 * The changes in the order of the text, by line and then by the place of the old words in the line, numbered from 1.
 * @param {readonly WritingChange[]} list
 * @param {string} words
 * @returns {Change[]}
 */
function numbered(list, words) {
	const lines = words.split('\n');
	return list
		.map((c, k) => ({ c, k, col: lines[c.block]?.indexOf(c.old) ?? -1 }))
		.sort((p, q) => p.c.block - q.c.block || p.col - q.col || p.k - q.k)
		.map(({ c }, i) => ({ block: c.block, old: c.old, new: c.new, rule: c.rule, reason: c.reason, n: i + 1, state: /** @type {const} */ ('open') }));
}

/**
 * The writing tools on one text model.
 * @template [R=unknown] The handle of a part of a line of the model, such as a DOM Range of the engine.
 */
export class Writing {
	/** The state of the last request. */
	state = $state.raw(/** @type {WritingState} */ ({ kind: 'idle' }));
	/** The selected words that a rewrite or an instruction is for, or null for the whole text. */
	scope = $state.raw(/** @type {TextRange | null} */ (null));
	/** Where each change that is not taken stands in the text. A change that is not found is old. */
	found = $state.raw(/** @type {ReadonlyMap<number, FoundChange<R>>} */ (new Map()));
	/** The part that shows the diff of a whole text, from the chunk of the diff. */
	Proposal = $state.raw(/** @type {ProposalPart | null} */ (null));

	/** @type {TextModel<R>} */
	#model;
	/** @type {() => ReviewWriting} */
	#config;
	/** @type {(failure: RichTextFailure) => string | null} */
	#fail;
	/** @type {WritingField} */
	#field;
	#token = 0;
	/** @type {AbortController | null} */
	#abort = null;
	/**
	 * The pending object that the state came from, or null for a request of the person.
	 * @type {Pending | null}
	 */
	#from = null;
	/**
	 * The last pending value of the page, so that the same value acts once.
	 * @type {Pending | undefined}
	 */
	#offered = undefined;
	/**
	 * The newest pending that waits until the state can take it.
	 * @type {Pending | null}
	 */
	#held = null;
	/**
	 * Each pending object that started: the same object starts once.
	 * @type {WeakSet<Pending>}
	 */
	#started = new WeakSet();
	/** @type {number | null} */
	#active = null;

	/**
	 * @param {TextModel<R>} model
	 * @param {() => ReviewWriting} config
	 * @param {(failure: RichTextFailure) => string | null} fail
	 * @param {WritingField} field
	 */
	constructor(model, config, fail, field) {
		this.#model = model;
		this.#config = config;
		this.#fail = fail;
		this.#field = field;
	}

	/** @returns {WritingWords} */
	get words() {
		return { ...WRITING_WORDS, ...this.#config().words };
	}

	/**
	 * True while a request runs or a whole text waits: the words must not change under them.
	 * @returns {boolean}
	 */
	get locks() {
		return this.state.kind === 'running' || this.state.kind === 'text';
	}

	/** @returns {readonly Change[]} */
	get changes() {
		return this.state.kind === 'changes' ? this.state.changes : [];
	}

	/**
	 * The number of each change that is not taken and whose words no longer stand in their line.
	 * @returns {ReadonlySet<number>}
	 */
	get stale() {
		return new Set(this.changes.filter((c) => c.state !== 'taken' && !this.found.has(c.n)).map((c) => c.n));
	}

	/** @param {TextRange | null} range */
	setScope(range) {
		this.scope = range;
	}

	/**
	 * Starts a request of a tool; false when it cannot start, such as while another runs.
	 * @param {WritingKind} kind
	 * @param {{ mode?: string; instruction?: string }} [extra]
	 * @returns {boolean}
	 */
	run(kind, extra = {}) {
		const m = this.#model;
		if (this.locks || this.#field.readonly() || m.empty()) return false;
		const scope = kind === 'rewrite' || kind === 'instruction' ? this.scope : null;
		/** @type {WritingRequest} */
		const request = { kind, html: m.html(), words: m.words(), scope, ...extra };
		this.#start(request, null, null, (signal) => this.#config().run(request, signal));
		return true;
	}

	/**
	 * Takes the pending value of the page: a request that this view did not start, or undefined.
	 * - A pending object starts at once while the state can take it (#busy), and else the field holds the
	 *   newest one until it can. So a pending never aborts a request of the person and never drops open
	 *   changes or a waiting whole text.
	 * - The same object starts once.
	 * - undefined ends a request or a result that came from a pending, and keeps one that the person started.
	 * @param {Pending | undefined} pending
	 */
	offer(pending) {
		if (pending === this.#offered) return;
		this.#offered = pending;
		this.#held = null;
		if (!pending) {
			if (this.#from && this.state.kind !== 'idle') {
				this.#end();
				this.#set({ kind: 'idle' });
			}
			return;
		}
		if (this.#started.has(pending)) return;
		if (this.#busy()) this.#held = pending;
		else this.#adopt(pending);
	}

	/** @param {Pending} pending */
	#adopt(pending) {
		this.#started.add(pending);
		const m = this.#model;
		/** @type {WritingRequest} */
		const request = { kind: pending.kind, html: m.html(), words: m.words(), scope: null };
		this.#start(request, pending.asked ?? null, pending, () => Promise.resolve(pending.result));
	}

	/**
	 * True while the state cannot take a pending: a request runs, a whole text waits or a change is open.
	 * @returns {boolean}
	 */
	#busy() {
		const s = this.state;
		return s.kind === 'running' || s.kind === 'text' || (s.kind === 'changes' && s.changes.some((c) => c.state === 'open'));
	}

	/** Starts the held pending once the state can take it, if the page still gives it. */
	#release() {
		const p = this.#held;
		if (!p || this.#busy()) return;
		this.#held = null;
		if (this.#config().pending === p) this.#adopt(p);
	}

	stop() {
		const s = this.state;
		if (s.kind !== 'running') return;
		this.#end();
		this.#set({ kind: 'stopped', request: s.request, asked: s.asked });
	}

	/**
	 * The page loaded another content (editor.load): the request that runs aborts, and a result and a held
	 * pending of the content before it go.
	 */
	reset() {
		this.#end();
		this.#held = null;
		this.#set({ kind: 'idle' });
	}

	/** The end of the field, or of writing: the request that runs aborts, a late result changes nothing, and no mark stays in the text. */
	destroy() {
		this.#end();
		this.#held = null;
		this.#model.mark([], null);
	}

	#end() {
		this.#token++;
		this.#abort?.abort();
		this.#abort = null;
	}

	/** @param {WritingState} state */
	#set(state) {
		this.state = state;
		this.#active = null;
		this.locate();
		this.#release();
	}

	/**
	 * Runs a request. A rejection of `get`, a result that the field does not take and an error while the field
	 * shows the result each fail the request, with the kind writing, and unlock the text.
	 * @param {WritingRequest} request
	 * @param {Asked} asked
	 * @param {Pending | null} from The pending object of the request, or null for a request of the person.
	 * @param {(signal: AbortSignal) => Promise<ReviewResult>} get
	 */
	#start(request, asked, from, get) {
		this.#end();
		const token = this.#token;
		const abort = new AbortController();
		this.#abort = abort;
		this.#from = from;
		this.#set({ kind: 'running', request, asked });
		Promise.resolve()
			.then(() => get(abort.signal))
			.then((result) => this.#accept(token, request, asked, result))
			.catch(
				/** @param {unknown} error */
				(error) => {
					if (token !== this.#token) return;
					this.#abort = null;
					this.#set({ kind: 'failed', request, asked, words: this.#fail({ kind: 'writing', request, error }) });
				}
			);
	}

	/**
	 * @param {number} token
	 * @param {WritingRequest} request
	 * @param {Asked} asked
	 * @param {ReviewResult} result
	 */
	async #accept(token, request, asked, result) {
		if (token !== this.#token) return;
		const why = malformed(result, this.#field.plain === true);
		if (why) throw new TypeError(why);
		if (result.kind === 'changes') {
			this.#abort = null;
			this.#set({ kind: 'changes', request, asked, changes: numbered(result.changes, this.#model.words()), note: result.note || null });
			return;
		}
		// The request runs on while the chunk of the diff loads, so Stop keeps the focus until the diff shows.
		/** @type {typeof import('./text.js')} */
		let chunk;
		try {
			chunk = await import('./text.js');
		} catch (error) {
			if (token !== this.#token) return;
			console.error('The rich text field did not load the diff of its writing tools:', error);
			this.#abort = null;
			// The words of a chunk that did not load go to the line above the text, as for each chunk of the field.
			const words = this.#fail({ kind: 'load', part: 'review', error });
			if (words) this.#field.alert(words);
			this.#set({ kind: 'failed', request, asked, words: null });
			return;
		}
		if (token !== this.#token) return;
		const { html, plain } = wholeText(result);
		const { lines, count } = chunk.linesOf(this.#model.html(), html, { preset: this.#field.preset, picture: this.#field.picture }, this.words);
		this.#abort = null;
		this.Proposal = chunk.Proposal;
		const title = result.title || this.words.title[request.kind];
		this.#set({ kind: 'text', request, asked, html, plain, title, note: result.note || null, lines, count });
	}

	// ---- The changes

	/** Finds each change that is not taken in the text again, after an edit, and marks the open ones. */
	locate() {
		// The field calls it from its effects too, so it reads no state into them.
		untrack(() => {
			const spots = this.changes.filter((c) => c.state !== 'taken').map(({ n, block, old }) => ({ n, block, old }));
			this.found = spots.length > 0 ? this.#model.find(spots) : new Map();
			this.#paint();
		});
	}

	/**
	 * The change whose row the person looks at, or null: its words take the strong mark.
	 * @param {number | null} n
	 */
	look(n) {
		this.#active = n;
		untrack(() => this.#paint());
	}

	#paint() {
		const marks = this.changes.flatMap((c) => (c.state === 'open' ? (this.found.get(c.n)?.range ?? []) : []));
		const active = this.#active !== null ? (this.found.get(this.#active)?.range ?? null) : null;
		this.#model.mark(marks, active);
	}

	/**
	 * @param {readonly number[]} ns
	 * @param {'taken' | 'left'} state
	 * @param {boolean} [afterAll]
	 */
	#decide(ns, state, afterAll = false) {
		const s = this.state;
		if (s.kind !== 'changes' || ns.length === 0) return;
		this.#set({ ...s, changes: s.changes.map((c) => (ns.includes(c.n) ? { ...c, state } : c)) });
		const ondecide = this.#config().ondecide;
		for (const n of ns) ondecide?.({ request: s.request, change: n, taken: state === 'taken', ...(afterAll ? { afterAll: true } : {}) });
	}

	/**
	 * Makes the changes `ns` whose words stand, as one undo step. A change in Left out takes `afterAll`.
	 * Two changes whose words overlap cannot both stand, so the first in the text wins, and the other
	 * stays open and turns old.
	 * @param {readonly number[]} ns
	 * @param {'open' | 'left'} from
	 */
	#make(ns, from) {
		if (this.locks || this.#field.readonly()) return;
		/** @type {{ range: R; text: string }[]} */
		const parts = [];
		/** @type {{ line: number; from: number; to: number }[]} */
		const spans = [];
		/** @type {number[]} */
		const made = [];
		for (const c of this.changes) {
			const f = ns.includes(c.n) && c.state === from ? this.found.get(c.n) : undefined;
			if (!f) continue;
			const span = { line: f.line, from: f.at, to: f.at + c.old.length };
			if (spans.some((s) => s.line === span.line && s.from < span.to && span.from < s.to)) continue;
			spans.push(span);
			parts.push({ range: f.range, text: c.new });
			made.push(c.n);
		}
		if (parts.length === 0) return;
		this.#model.replace(parts);
		this.#decide(made, 'taken', from === 'left');
	}

	/** @param {readonly number[]} ns */
	take(ns) {
		this.#make(ns, 'open');
	}

	/** @param {number} n */
	takeAfterAll(n) {
		this.#make([n], 'left');
	}

	/** @param {readonly number[]} ns */
	leave(ns) {
		this.#decide(
			this.changes.filter((c) => ns.includes(c.n) && c.state === 'open').map((c) => c.n),
			'left'
		);
	}

	// ---- Take all and Leave all: of a whole text while one waits, else of the open changes.

	takeAll() {
		const s = this.state;
		if (s.kind === 'text') {
			// The state goes back to idle before ondecide, so a second Take all of the same text does nothing,
		// also when ondecide of the page throws.
			if (this.#field.readonly()) return;
			this.#model.replaceAll(s.html, s.plain);
			this.#set({ kind: 'idle' });
			this.#config().ondecide?.({ request: s.request, change: 'text', taken: true });
			return;
		}
		this.take(this.changes.filter((c) => c.state === 'open' && !this.stale.has(c.n)).map((c) => c.n));
	}

	leaveAll() {
		const s = this.state;
		if (s.kind === 'text') {
			this.#set({ kind: 'idle' });
			this.#config().ondecide?.({ request: s.request, change: 'text', taken: false });
			return;
		}
		this.leave(this.changes.filter((c) => c.state === 'open').map((c) => c.n));
	}
}

/**
 * The writing tools of a field, on its text model, such as the engine of the rich text field, with the
 * `writing` prop of the page and the onfailure of the field.
 * @template R
 * @param {TextModel<R>} model
 * @param {() => ReviewWriting} config
 * @param {(failure: RichTextFailure) => string | null} fail
 * @param {WritingField} field
 * @returns {Writing<R>}
 */
export function createWriting(model, config, fail, field) {
	return new Writing(model, config, fail, field);
}
