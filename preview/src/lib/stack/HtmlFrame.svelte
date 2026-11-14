<script lang="ts" module>
	import type { HTMLIframeAttributes } from 'svelte/elements';

	export type HtmlFrameProps = Omit<HTMLIframeAttributes, 'children' | 'src' | 'srcdoc' | 'sandbox' | 'allow' | 'referrerpolicy' | 'height' | 'title'> & {
		/** The root element, the <iframe>. */
		ref?: HTMLIFrameElement | null;
		/** The address of one page on the host of the content that the product did not write, such as the page of one mail: a signed link for that page with a short expiry. The part renders no frame when the protocol is not https:, except http: on localhost and 127.0.0.1. */
		src: string;
		/** The name of the frame for a screen reader, such as "The message from Ana Turner, as the sender designed it". */
		title: string;
		/** The height in px until the height script of the page gives one. A page with no script keeps it, and scrolls inside the frame. */
		height?: number;
		/** The largest height in px that the frame takes from the script. A larger height gives the cap, and the page scrolls inside the frame. */
		maxHeight?: number;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';
	import { FRAME_HEIGHT_TYPE, FRAME_MODE_TYPE } from './frame-height.js';

	// The HTML frame (### html-frame in DESIGN.md) shows HTML that the product did not write, such as a
	// report from an agent or the HTML part of a mail. It is an <iframe> that loads one page from the
	// host of the content that the product did not write, with a sandbox that gives the page a special
	// origin, runs only the height script that the policy of the host allows, and opens a link in a new tab. The part sets the sandbox, the
	// referrer policy, the address and the title after the rest attributes, so that no attribute of the
	// product changes them. It also removes srcdoc, allow, name and csp after them: the types omit them,
	// but a product can still pass them at run time, and srcdoc wins over src and would run its HTML
	// with allow-scripts. The part renders no frame for an address whose protocol is not https:, such
	// as javascript: or data:. Only localhost and 127.0.0.1 may use http:, for a dev server. The height
	// follows the page: the part takes a message only from the window of this frame, with the origin
	// "null" of a sandboxed page, the type tag of the script and a finite height of 0 or more. It takes
	// a height over maxHeight as maxHeight, and it reads only that number. A page that sends no height
	// keeps the fixed height. The app posts only the mode to the frame, because a link can load another
	// page into it: at the start, at each load of the page and at each change of the class dark on
	// <html>. The script answers each mode with its height.
	let { src, title, height = 320, maxHeight = 25_000, ref = $bindable(null), class: className, ...rest }: HtmlFrameProps = $props();

	/** The height that the script of the page gave last, in px. */
	let fitted = $state<number>();

	/**
	 * True when the browser loads src with https:, or with http: on localhost or 127.0.0.1. The part
	 * resolves src as the browser does, against the address of the document. A relative address takes
	 * the protocol of the page, and on the server the part has no page, so it reads that protocol as https:.
	 */
	function secure(address: string): boolean {
		let url: URL;
		try {
			url = new URL(address, typeof document === 'undefined' ? 'https://relative.invalid/' : document.baseURI);
		} catch {
			return false;
		}
		return url.protocol === 'https:' || (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1'));
	}

	const shown = $derived(secure(src));

	/** The attributes that the part removes after the rest attributes. The types of an iframe do not name csp, so a spread sets it. */
	const REMOVED = { srcdoc: undefined, allow: undefined, name: undefined, csp: undefined };

	function receive(event: MessageEvent) {
		if (!ref || event.source !== ref.contentWindow || event.origin !== 'null') return;
		const data: unknown = event.data;
		if (typeof data !== 'object' || data === null) return;
		const { type, height: next } = data as { type?: unknown; height?: unknown };
		if (type !== FRAME_HEIGHT_TYPE || typeof next !== 'number' || !Number.isFinite(next) || next < 0) return;
		fitted = Math.ceil(Math.min(next, maxHeight));
	}

	$effect(() => {
		const frame = ref;
		if (!frame) return;
		const root = document.documentElement;
		const tell = () => frame.contentWindow?.postMessage({ type: FRAME_MODE_TYPE, mode: root.classList.contains('dark') ? 'dark' : 'light' }, '*');
		const watch = new MutationObserver(tell);
		watch.observe(root, { attributes: true, attributeFilter: ['class'] });
		frame.addEventListener('load', tell);
		tell();
		return () => {
			watch.disconnect();
			frame.removeEventListener('load', tell);
		};
	});
</script>

<svelte:window onmessage={receive} />

{#if shown}
	<iframe
		{...rest}
		{...REMOVED}
		bind:this={ref}
		data-slot="html-frame"
		class={cn('block w-full', className)}
		style:height="{fitted ?? height}px"
		{src}
		{title}
		sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
		referrerpolicy="no-referrer"
	></iframe>
{/if}
