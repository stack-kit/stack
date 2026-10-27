// The pages outside the shell that the preview shows, with their states and their invented
// records. "### Page outside the shell" in DESIGN.md defines the parts and the states, and
// "Pages with no session" in architecture/web-app.md the behavior.

/** The product of the head line. A placeholder, because the page belongs to no product. */
export const PRODUCT = { name: 'Product', mark: 'P' } as const;

export const PAGES = {
	link: {
		label: 'Link page',
		states: ['ready', 'working', 'done', 'expired', 'used', 'changed', 'failed', 'not-valid']
	},
	'read-only': { label: 'Read-only link', states: ['ready'] },
	'sign-in': {
		label: 'Sign-in page',
		states: [
			'ready',
			'waiting',
			'failed',
			'cancelled',
			'code-wrong',
			'code-expired',
			'no-script',
			'app',
			'app-wrong',
			'app-used',
			'app-paused',
			'app-paused-100',
			'app-no-script'
		]
	},
	recovery: {
		label: 'Recovery page',
		states: ['ready', 'code-wrong', 'paused', 'paused-100', 'setup-wrong', 'setup-used']
	}
} as const;

export type PageKind = keyof typeof PAGES;
export type LinkState = (typeof PAGES)['link']['states'][number];
export type SignInState = (typeof PAGES)['sign-in']['states'][number];
export type RecoveryState = (typeof PAGES)['recovery']['states'][number];

/** The page and the state of an address, such as ?page=sign-in&state=waiting. */
export function addressOf(url: { searchParams: { get(name: string): string | null } }): { kind: PageKind; state: string } {
	const p = url.searchParams.get('page');
	const kind: PageKind = p !== null && Object.hasOwn(PAGES, p) ? (p as PageKind) : 'link';
	const s = url.searchParams.get('state');
	const states: readonly string[] = PAGES[kind].states;
	return { kind, state: s !== null && states.includes(s) ? s : 'ready' };
}

export const viewHref = (kind: PageKind, state: string) => `/outside/view?page=${kind}&state=${state}`;

const LOCALE = 'en-GB';
const money = (n: number) => new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR' }).format(n);
const day = (iso: string) => new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long' }).format(new Date(iso));

/** The quote of the link page: the facts that the approval fixes. */
export const QUOTE = {
	id: 'QUO-0042',
	client: 'Lipa Studio',
	amount: money(1250),
	amountNow: money(1400),
	validUntil: day('2026-11-08'),
	sent: day('2026-10-20'),
	expired: day('2026-10-24'),
	linkDays: 4,
	usedOn: '23 October at 16:05',
	changedOn: '24 October at 11:30',
	doneAt: '14:20',
	requestId: '7f3a9c2e'
} as const;

/** The visits of the read-only link, one row for each page of a site. */
export const VISITS = {
	month: 'October 2026',
	until: day('2026-10-31'),
	rows: [
		{ page: '/pricing', visits: 4812, change: 0.12 },
		{ page: '/', visits: 3907, change: -0.04 },
		{ page: '/docs/start', visits: 2240, change: 0.31 },
		{ page: '/contact', visits: 618, change: 0 }
	]
} as const;

export const count = (n: number) => new Intl.NumberFormat(LOCALE).format(n);
export const percent = (n: number) =>
	new Intl.NumberFormat(LOCALE, { style: 'percent', signDisplay: 'exceptZero' }).format(n);

/** The address that the sign-in states Code wrong and Code expired hold, and the placeholder of the field. */
export const SAMPLE_ADDRESS = 'ana@example.org';

/** The code that the sign-in states Code wrong and Code expired hold: 8 symbols of Crockford base32. */
export const CODES = { wrong: '7K4QX2MD', expired: 'R8F3W6PN' } as const;

/**
 * The characters that the code field takes: the 32 symbols of Crockford base32 in both cases, and
 * I, L and O, which Crockford reads as 1, 1 and 0. U is not a symbol.
 */
export const CODE_PATTERN = '^[0-9A-TV-Za-tv-z]+$';

/** The code as Crockford base32 reads it: upper case, O as 0, and I and L as 1. The server reads it the same way. */
export const readCode = (code: string) => code.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');

/** A pasted code without the hyphens and the spaces between its groups, which the pattern refuses. */
export const pasteCode = (text: string) => text.replace(/[\s-]/g, '');

/**
 * The codes of an authenticator app that the sign-in states App code wrong and App code used hold: 6 digits,
 * which the field shows in two groups of three.
 */
export const APP_CODES = { wrong: '482915', used: '730264' } as const;

/**
 * The codes that the states of the recovery page hold: a saved recovery code of 16 characters in four groups of
 * four, and a setup code of 26 characters in groups of four, as an administrator reads it.
 */
export const RECOVERY_CODES = { saved: '7K4Q-X2MD-R8F3-W6PN', setup: '7K4Q X2MD R8F3 W6PN 3HJA 9BTC 5E' } as const;

/** The number of characters of a typed code, without the spaces and the hyphens, which the server ignores. */
export const codeLength = (text: string) => pasteCode(text).length;
