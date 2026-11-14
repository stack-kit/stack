import { error } from '@sveltejs/kit';
import { FRAME_HEIGHT_HASH, FRAME_HEIGHT_SCRIPT } from '#lib/stack/frame-height.js';
import type { EntryGenerator, RequestHandler } from './$types';

// The sample pages of the HTML frames of the preview, at /frames/<name>.html. A product serves the
// page of each message from the host of the content that it did not write, with its policy in the
// headers of "Content that the product did not write" in architecture/web-app.md. The preview has no
// such host, so it serves the pages from its own origin. The sandbox of the frame still gives each
// page the special origin "null". The route is prerendered, and a static build keeps no header, so the
// page gives its policy in a meta element too. A meta element cannot hold frame-ancestors or sandbox,
// which the header of a product holds. The dev server sends the header too, with the sandbox
// directive, so a page that a person opens in a tab of its own has the same special origin there.
// "designed" holds the height script first in <head>, so the frame takes the height of the mail.
// "no-script" holds no script, so the frame keeps its fixed height. The mail is HTML that its sender
// designed, with its own colors. "reply" holds the script and the HTML part of a reply as it goes
// out, with the quote of the earlier mail, for the check of a send. Every name in it is invented.
const POLICY = [
	"default-src 'none'",
	`script-src ${FRAME_HEIGHT_HASH}`,
	"style-src 'unsafe-inline'",
	"img-src 'none'",
	"connect-src 'none'",
	"object-src 'none'",
	"base-uri 'none'",
	"form-action 'none'"
].join('; ');

/** The policy of the header: the policy of the meta element and the sandbox of the frame. */
const HEADER_POLICY = `${POLICY}; sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox`;

const MAIL = `<div style="background:#f4efe6;padding:24px 16px;font-family:Georgia,serif;color:#2b2420">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:6px;overflow:hidden">
<div style="background:#8a4b2f;color:#ffffff;padding:20px 24px;font-size:20px;letter-spacing:0.02em">Larkfield Ceramics</div>
<div style="padding:24px">
<h1 style="margin:0 0 12px;font-size:22px;font-weight:normal">The winter glazes are here</h1>
<p style="margin:0 0 12px;line-height:1.5">Dear Ana,</p>
<p style="margin:0 0 12px;line-height:1.5">Our glazes for the winter are ready: Ash Grey, Kiln Blue and Ember. We make each cup and each bowl by hand in our workshop.</p>
<p style="margin:0 0 20px"><a href="https://example.com/winter" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#8a4b2f;color:#ffffff;padding:10px 18px;border-radius:4px;text-decoration:none">See the winter glazes</a></p>
<p style="margin:0;line-height:1.5">Kind regards,<br>Mira Holt<br>Larkfield Ceramics</p>
</div>
<div style="padding:16px 24px;font-size:12px;color:#6b605a;border-top:1px solid #eadfd3">You get this mail because you ordered from Larkfield Ceramics, 4 Kiln Row, Larkfield.</div>
</div>
</div>`;

const REPLY = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#1f2933">
<p style="margin:0 0 12px">Dear Ana,</p>
<p style="margin:0 0 12px">The courier confirmed the damage. We sent a refund of <strong>&euro;24.00</strong> for the two cups to your card today. The refund note is attached.</p>
<p style="margin:0 0 16px">Marko Ellis<br>Support</p>
<p style="margin:0 0 8px;color:#52606d">On 12 Nov 2026 at 09:14, Ana Turner wrote:</p>
<blockquote style="margin:0;padding-left:12px;border-left:2px solid #cbd2d9;color:#52606d">The parcel of order 8841 came damaged, and two of the three cups are broken. I attach a photo of the box and the invoice.</blockquote>
</div>`;

const PAGES: Record<string, { script: boolean; mail: string }> = {
	designed: { script: true, mail: MAIL },
	'no-script': { script: false, mail: MAIL },
	reply: { script: true, mail: REPLY }
};

const page = ({ script, mail }: { script: boolean; mail: string }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${POLICY}">
<meta name="referrer" content="no-referrer">
${script ? `<script>${FRAME_HEIGHT_SCRIPT}</script>` : ''}
</head>
<body style="margin:0">
${mail}
</body>
</html>
`;

export const prerender = true;

export const entries: EntryGenerator = () => Object.keys(PAGES).map((name) => ({ name }));

export const GET: RequestHandler = ({ params }) => {
	if (!Object.hasOwn(PAGES, params.name)) error(404, `No sample page "${params.name}". The pages are: ${Object.keys(PAGES).join(', ')}.`);
	return new Response(page(PAGES[params.name]), {
		headers: { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': HEADER_POLICY, 'x-content-type-options': 'nosniff' }
	});
};
