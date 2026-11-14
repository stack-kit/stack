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
// The script holds no backslash, no backtick and no dollar sign, so that the value of the string is
// the text between the backticks. npm run frame (scripts/frame-height.mjs) fails when FRAME_HEIGHT_HASH
// or the hash in DESIGN.md differs from the SHA-256 of the script. A change of the script changes its
// hash, so the change log of that release names the new hash.

/** The type tag of the message that the script posts to the app. */
export const FRAME_HEIGHT_TYPE: string = 'stack-frame-height';

/** The type tag of the message that the app posts to the frame. */
export const FRAME_MODE_TYPE: string = 'stack-frame-mode';

/** The height script, character for character. The host puts it between <script> and </script>, first in <head>. */
export const FRAME_HEIGHT_SCRIPT: string = `(() => {
	const root = document.documentElement;
	const fit = (element) => {
		element.style.setProperty('height', 'auto', 'important');
		element.style.setProperty('min-height', '0', 'important');
		element.style.setProperty('max-height', 'none', 'important');
	};
	let last = -1;
	const send = () => {
		const body = root.querySelector('body');
		if (body) fit(body);
		const height = Math.ceil(root.getBoundingClientRect().height);
		if (height === last) return;
		last = height;
		parent.postMessage({ type: 'stack-frame-height', height }, '*');
	};
	addEventListener('message', (event) => {
		if (event.source !== parent || !event.data || event.data.type !== 'stack-frame-mode') return;
		root.classList.toggle('dark', event.data.mode === 'dark');
		last = -1;
		send();
	});
	fit(root);
	new ResizeObserver(send).observe(root);
})();`;

/** The source of the script for script-src: the SHA-256 of its UTF-8 bytes in base64, with its quotes. */
export const FRAME_HEIGHT_HASH: string = "'sha256-2BfSgBcw0ftsnn9SepeAClM9mEN+hl50Yug9m2hvADA='";
