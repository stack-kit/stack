<script lang="ts" module>
	import type { HTMLIframeAttributes } from 'svelte/elements';

	/** The state of a page, as the server of the host writes it in data-stack-frame-state. */
	export type FrameState = 'html' | 'text' | 'too-large';

	/** The facts that the page names, from its height message. A fact that the page does not name is absent. */
	export type FramePage = {
		/** html: the page holds the HTML. text: the content has no HTML, so the page holds its text. too-large: the content passes a limit of the host, so the page does not hold it. */
		state?: FrameState;
		/** The count of the remote resources, such as pictures, that the host removed from the content. */
		remote?: number;
	};

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
		/** Called with the facts of the page when a message that passes the checks names a fact, and again when a fact changes. A new src starts again. When the last call named a fact and the page of a new src names none, called once with {} at its first message that passes. */
		onpage?: (page: FramePage) => void;
		/** Called once for each src when no message passed the checks 2 s after the load of the page, or 15 s after the mount when no load came. The frame keeps its height. */
		onfailure?: () => void;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';
	import { FRAME_HEIGHT_TYPE, FRAME_MODE_TYPE } from './frame-height.js';
	import { readFrameMessage } from './frame-message.js';

	// The HTML frame (### html-frame in DESIGN.md) shows HTML that the product did not write, such as a
	// report from an agent or the HTML part of a mail. It is an <iframe> that loads one page from the
	// host of the content that the product did not write, with a sandbox that gives the page a special
	// origin, runs only the height script that the policy of the host allows, and opens a link in a new
	// tab. The part sets the sandbox, the referrer policy, the address, the title, the class and
	// data-slot itself, and it adds its height to the style of the product. Before it spreads the rest
	// attributes, it drops each key whose lowercase form is src, title, sandbox, referrerpolicy, class,
	// style, data-slot, height, srcdoc, allow, allowfullscreen, webkitallowfullscreen,
	// mozallowfullscreen, allowpaymentrequest, name or csp, so that no attribute of the product changes
	// or adds them. Only the key style itself stays, because Svelte merges it with the height. The part
	// compares the lowercase form because Svelte writes a spread key in lowercase: srcDoc and SANDBOX
	// give srcdoc and sandbox. On the server, Svelte writes the attribute of the product before the
	// attribute of the part, and the parser of the browser keeps the first of two attributes with one
	// name. The types of the part omit srcdoc, sandbox, allow and referrerpolicy. They still accept
	// allowfullscreen and name, and a product can pass any other key at run time. srcdoc wins over src
	// and would run its HTML with allow-scripts. The part renders no frame for an address whose
	// protocol is not https:, such as javascript: or data:. A key such as SRC never reaches the frame,
	// so this check holds for each address. Only localhost and 127.0.0.1 may use http:, for a dev
	// server. The height follows the page: the part takes a message only from the window of this frame,
	// with the origin "null" of a sandboxed page, the type tag of the script and a finite height of 0
	// or more, and a state and a remote count that are absent or pass their own checks
	// (frame-message.ts). It takes a height over maxHeight as maxHeight, and it reads only the height,
	// the state and the count. It gives the state and the count to onpage as data, and never renders
	// them. When the last call of onpage named a fact and the page of a new src names none, it calls
	// onpage once with {}. A page that sends no height keeps the fixed height. When no message passed
	// 2 s after the load of the page, or 15 s after the mount with no load, the part calls onfailure
	// once for that src. The app posts only the mode to the frame, because a link can load another
	// page into it: at the start, at each load of the page and at each change of the class dark on
	// <html>. The script answers each mode with its height. A new src gets a new <iframe>, so a
	// message of the page of the old src, which can post until the new page commits, comes from
	// another window and does not count.
	let { src, title, height = 320, maxHeight = 25_000, onpage, onfailure, ref = $bindable(null), class: className, ...rest }: HtmlFrameProps = $props();

	/** The height that the script of the page gave last, in px. A new src resets it, so the new page starts at height. */
	let fitted = $derived.by<number | undefined>(() => {
		void src;
		return undefined;
	});

	/** The ms that the part waits for a message after the load of the page, and after the mount when no load came. */
	const LOAD_WAIT = 2_000;
	const MOUNT_WAIT = 15_000;

	/** The src of the last message that passed the checks, and the src of the last call of onfailure. */
	let passed: string | undefined;
	let failed: string | undefined;
	/** The facts of the last call of onpage, with their src. */
	let told: { src: string; page: FramePage } | undefined;

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

	/** The attributes that the part sets or removes. The types of an iframe do not name csp, so a spread sets it. */
	const OWNED = new Set(['src', 'title', 'sandbox', 'referrerpolicy', 'class', 'style', 'data-slot', 'height', 'srcdoc', 'allow', 'allowfullscreen', 'webkitallowfullscreen', 'mozallowfullscreen', 'allowpaymentrequest', 'name', 'csp']);

	/**
	 * The rest attributes with no key whose lowercase form is in OWNED. Svelte merges the key style with
	 * style:height, so that key stays, and only another case of it, such as STYLE, goes. A symbol key,
	 * such as an attachment, stays.
	 */
	const attributes = $derived.by(() => {
		const kept = { ...rest };
		for (const key of Object.keys(kept)) if (key !== 'style' && OWNED.has(key.toLowerCase())) Reflect.deleteProperty(kept, key);
		return kept;
	});

	/** True when the facts name a state or a count. */
	const named = (page: FramePage) => page.state !== undefined || page.remote !== undefined;

	function receive(event: MessageEvent) {
		if (!ref || event.source !== ref.contentWindow || event.origin !== 'null') return;
		const message = readFrameMessage(event.data, FRAME_HEIGHT_TYPE, maxHeight);
		if (!message) return;
		fitted = message.height;
		passed = src;
		const { page } = message;
		// A page that names no fact calls onpage only on a new src after a call that named a fact, with
		// {}, so that the product drops the facts of the old src.
		if (!named(page) && !(told && told.src !== src && named(told.page))) return;
		if (told && told.src === src && told.page.state === page.state && told.page.remote === page.remote) return;
		told = { src, page };
		onpage?.({ ...page });
	}

	// The wait for the first message of each src. A load of the page starts the wait of 2 s again, and
	// a new src or a new frame starts the wait of 15 s again. The effect runs only in the browser, and
	// its cleanup stops the timer.
	$effect(() => {
		const frame = ref;
		const address = src;
		const fail = () => {
			if (passed === address || failed === address) return;
			failed = address;
			onfailure?.();
		};
		let timer = setTimeout(fail, MOUNT_WAIT);
		const loaded = () => {
			clearTimeout(timer);
			timer = setTimeout(fail, LOAD_WAIT);
		};
		frame?.addEventListener('load', loaded);
		return () => {
			clearTimeout(timer);
			frame?.removeEventListener('load', loaded);
		};
	});

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
	<!-- A new src gets a new <iframe>, so the page of the old src posts from another window, which receive refuses. -->
	{#key src}
		<iframe
			{...attributes}
			bind:this={ref}
			data-slot="html-frame"
			class={cn('block w-full', className)}
			style:height="{fitted ?? height}px"
			{src}
			{title}
			sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
			referrerpolicy="no-referrer"
		></iframe>
	{/key}
{/if}
