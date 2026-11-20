// The height script of an HTML frame (### html-frame in DESIGN.md), for the server of the host of the
// content that the product did not write. The host puts FRAME_HEIGHT_SCRIPT, character for character,
// between <script> and </script> as the first element of <head> of each page. It names
// FRAME_HEIGHT_HASH in script-src of the Content-Security-Policy of that page, and no other script, so
// this script runs and no script of the content does.
//
// The script sets height: auto, min-height: 0 and max-height: none with !important on <html> and
// <body>, so that the height of the page does not follow the height of the frame. It posts
// { type: FRAME_HEIGHT_TYPE, height } to the app at its first layout and at each change of the height,
// with the height of <html> rounded up to a whole pixel. The app posts { type: FRAME_MODE_TYPE, mode }
// when the page loads and when the mode changes. The script then sets the class dark on <html> in dark
// mode, and posts its height again, so that the app gets the height also when the page posted it
// before the app listened.
//
// The server can write five attributes on its own <html> start tag, and the script reads each of them
// once, at its start, before the parser reaches the content. So an <html> tag inside the content, whose
// attributes the parser adds to the root, cannot give one. data-stack-frame-state and
// data-stack-frame-remote are facts about the page, and the script adds each one that the page names
// to every height message, as state (the word as it is) and remote (the count as a number, or NaN when
// it is not a whole number in decimal digits). data-stack-frame-fold and data-stack-frame-unfold are
// the words of a closed and of an open fold: with both, the script puts each outermost quote of an
// earlier mail into a <details> element whose <summary> takes the words with textContent and the lang
// of <html>. It matches a quote by a class, an id or an attribute, never by words, and it keeps its
// folds in a list of its own. A fold with no text before it opens. querySelectorAll gives the quotes
// in document order, and the folds are separate ranges in that order, so the script compares each
// quote with the last fold only. A later fold has the summary of the first fold before it, so only the
// first fold can open. Thus the fold takes one step for each quote. data-stack-frame-fit turns on the
// scale: when the content at scale 1 is wider than the frame, the script sets zoom on <html> to the
// width of the frame over the width of the content, never below 0.5, and it never posts the scale. A
// page with none of the five attributes gets the same page and the same messages as before.
//
// The script holds no backslash, no backtick and no dollar sign, so that the value of the string is
// the text between the backticks. npm run frame (scripts/frame-height.mjs) fails when FRAME_HEIGHT_HASH
// or the hash in DESIGN.md differs from the SHA-256 of the script, and when the script holds a way to
// parse a text as HTML or code, or a second postMessage. A change of the script changes its hash, so
// the change log of that release names the new hash.

/** The type tag of the message that the script posts to the app. */
export const FRAME_HEIGHT_TYPE: string = 'stack-frame-height';

/** The type tag of the message that the app posts to the frame. */
export const FRAME_MODE_TYPE: string = 'stack-frame-mode';

/** The height script, character for character. The host puts it between <script> and </script>, first in <head>. */
export const FRAME_HEIGHT_SCRIPT: string = `(() => {
	const root = document.documentElement;
	const state = root.getAttribute('data-stack-frame-state');
	const remote = root.getAttribute('data-stack-frame-remote');
	const fold = root.getAttribute('data-stack-frame-fold');
	const unfold = root.getAttribute('data-stack-frame-unfold');
	const wide = root.hasAttribute('data-stack-frame-fit');
	const lang = root.getAttribute('lang');
	const facts = {};
	if (state !== null) facts.state = state;
	if (remote !== null) facts.remote = String(Number(remote)) === remote ? Number(remote) : NaN;
	const loose = (element) => {
		element.style.setProperty('height', 'auto', 'important');
		element.style.setProperty('min-height', '0', 'important');
		element.style.setProperty('max-height', 'none', 'important');
	};
	let last = -1;
	const send = () => {
		const body = root.querySelector('body');
		if (body) loose(body);
		const height = Math.ceil(root.getBoundingClientRect().height);
		if (height === last) return;
		last = height;
		parent.postMessage({ type: 'stack-frame-height', height, ...facts }, '*');
	};
	const folds = [];
	const before = (details) => {
		const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
		for (let node = walk.nextNode(); node; node = walk.nextNode()) {
			if (details.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) return false;
			if (node.data.trim() && !node.parentElement.closest('style, noscript')) return true;
		}
		return false;
	};
	const wrap = (nodes) => {
		const details = document.createElement('details');
		const summary = document.createElement('summary');
		if (lang !== null) summary.setAttribute('lang', lang);
		summary.style.setProperty('cursor', 'pointer', 'important');
		summary.style.setProperty('text-decoration', 'underline', 'important');
		const words = () => {
			summary.textContent = details.open ? unfold : fold;
		};
		nodes[0].before(details);
		details.append(summary, ...nodes);
		details.open = folds.length === 0 && !before(details);
		words();
		details.addEventListener('toggle', words);
		folds.push(details);
	};
	const quote = () => {
		if (!fold || !unfold) return;
		for (const node of document.body.querySelectorAll('div.gmail_quote, blockquote[type=cite], div.yahoo_quoted, #divRplyFwdMsg')) {
			if (folds.length && folds[folds.length - 1].contains(node)) continue;
			const nodes = [node];
			if (node.matches('#divRplyFwdMsg')) for (let next = node.nextSibling; next; next = next.nextSibling) nodes.push(next);
			wrap(nodes);
		}
	};
	let width = -1;
	const scale = (again) => {
		if (!wide || (!again && innerWidth === width)) return;
		width = innerWidth;
		root.style.setProperty('zoom', '1', 'important');
		const content = root.scrollWidth;
		if (content > width) root.style.setProperty('zoom', String(Math.max(0.5, Math.floor((width / content) * 1000) / 1000)), 'important');
		send();
	};
	addEventListener('message', (event) => {
		if (event.source !== parent || !event.data || event.data.type !== 'stack-frame-mode') return;
		root.classList.toggle('dark', event.data.mode === 'dark');
		last = -1;
		send();
	});
	document.addEventListener('DOMContentLoaded', () => {
		quote();
		scale(true);
	});
	addEventListener('load', () => scale(true));
	addEventListener('resize', () => scale(false));
	loose(root);
	new ResizeObserver(send).observe(root);
})();`;

/** The source of the script for script-src: the SHA-256 of its UTF-8 bytes in base64, with its quotes. */
export const FRAME_HEIGHT_HASH: string = "'sha256-mWNHcJ+OAWmcfxCLUlK7uC8LVATRgQ8VzB7W3npxHWM='";
