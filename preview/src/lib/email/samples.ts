// The four content kinds of "## Email", with invented data: no real client and no real person.
// The dates, the times, the numbers and the amounts are the text that Intl writes for en-GB in the
// time zone Europe/Belgrade, written out, so that the preview and DESIGN.md show the same text.
import type { Email } from './email.js';

const product = 'Docline';
const workspace = 'Northfield Ltd';
const sender = 'Docline Ltd · 12 Mill Lane · Riverton 4100';
// formatRange of en-GB puts a thin space on each side of the dash.
const WEEK = '19 – 25 October 2026';

export const request: Email = {
	lang: 'en-GB',
	dir: 'ltr',
	subject: 'Approve quote Q-0093 for Miller Ltd',
	preheader: 'Open the page, check the quote and approve it by 31 October 2026.',
	product,
	workspace,
	heading: 'Approve quote Q-0093',
	body: [
		{ kind: 'text', text: 'Northfield Ltd sent you a quote. Open the page to see it, and approve it there.' },
		{
			kind: 'facts',
			facts: [
				{ label: 'Quote', value: 'Q-0093', strong: true },
				{ label: 'Client', value: 'Miller Ltd' },
				{ label: 'Amount', value: '€3,400.00' },
				{ label: 'Valid until', value: '31 October 2026' }
			]
		}
	],
	action: { label: 'Approve quote', url: 'https://docline.example/link/quotes/9f3c41d0e21a4b7c8d2e5f6a7b8c9d0e' },
	after: [
		'The link works once, until 31 October 2026 at 14:30 CEST.',
		'Opening the link changes nothing. The quote is approved only when you press Approve quote on the page. If you did not expect this email, ignore it.'
	],
	links: [],
	why: 'You get this email because Northfield Ltd asked ana@example.org to approve the quote Q-0093.',
	sender
};

export const notification: Email = {
	lang: 'en-GB',
	dir: 'ltr',
	subject: 'Miller Ltd paid INV-0042',
	preheader: '€1,240.00 on 24 October 2026 at 14:20 CEST. Docline closed the invoice.',
	product,
	workspace,
	heading: 'Miller Ltd paid INV-0042',
	body: [
		{ kind: 'text', text: 'The payment covers the full amount, so Docline closed the invoice.' },
		{
			kind: 'facts',
			facts: [
				{ label: 'Invoice', value: 'INV-0042', strong: true },
				{ label: 'Client', value: 'Miller Ltd' },
				{ label: 'Amount', value: '€1,240.00' },
				{ label: 'Paid', value: '24 October 2026 at 14:20 CEST' },
				{ label: 'Status', value: 'Paid' }
			]
		}
	],
	action: { label: 'Open INV-0042', url: 'https://docline.example/northfield/invoices/INV-0042' },
	after: [],
	links: [{ label: 'Open the invoices paid in October', url: 'https://docline.example/northfield/invoices?status=paid&month=2026-10' }],
	why: 'You get this email because you follow INV-0042 in Northfield Ltd.',
	stop: { label: 'Turn off the emails about paid invoices', url: 'https://docline.example/northfield/settings/email' },
	sender
};

export const digest: Email = {
	lang: 'en-GB',
	dir: 'ltr',
	subject: `Weekly report of Northfield Ltd, ${WEEK}`,
	preheader: '128 documents sent, 12 more than last week. 3 invoices are overdue.',
	product,
	workspace,
	heading: `Weekly report, ${WEEK}`,
	body: [
		{ kind: 'text', text: 'Northfield Ltd sent more documents than last week, and received less money.' },
		{
			kind: 'figures',
			figures: [
				{ label: 'Documents sent', value: '128', change: '12 more than last week' },
				{ label: 'Paid', value: '€12,480', change: '€1,050 less than last week' },
				{ label: 'Open invoices', value: '41', change: 'The same as last week' },
				{ label: 'Overdue invoices', value: '3', change: '2 more than last week' }
			]
		},
		{
			kind: 'table',
			table: {
				heading: 'Largest open invoices',
				columns: [{ label: 'Invoice' }, { label: 'Client' }, { label: 'Amount', numeric: true }],
				rows: [
					['INV-0051', 'Miller Ltd', '€3,400.00'],
					['INV-0049', 'Smith and Sons', '€2,150.00'],
					['INV-0048', 'Dawn Bakery', '€1,980.00'],
					['INV-0046', 'Linden Ltd', '€1,240.00'],
					['INV-0045', 'North Freight', '€990.00']
				],
				more: 'And 36 more open invoices.'
			}
		}
	],
	action: { label: 'Open the weekly report', url: 'https://docline.example/northfield/reports/2026-w43' },
	after: [],
	links: [{ label: 'Open the 3 overdue invoices', url: 'https://docline.example/northfield/invoices?status=overdue' }],
	why: 'You get this email because you turned on the weekly report of Northfield Ltd.',
	stop: { label: 'Turn off the weekly report', url: 'https://docline.example/northfield/settings/email' },
	sender
};

export const alert: Email = {
	lang: 'en-GB',
	dir: 'ltr',
	subject: 'Failed: the nightly import of bank statements',
	preheader: 'It stopped at 03:12 CEST after 3 of 3 attempts. Docline has no statement after 21 October.',
	product,
	workspace,
	heading: 'The nightly import failed',
	body: [
		{ kind: 'state', role: 'destructive', word: 'Failed', rest: '22 October 2026 at 03:12 CEST' },
		{
			kind: 'text',
			text: 'The import of the bank statements stopped after 3 of 3 attempts. Docline has no statement after 21 October, so the balances of 22 October can be wrong.'
		},
		{
			kind: 'facts',
			facts: [
				{ label: 'Job', value: 'Nightly import of bank statements' },
				{ label: 'Started', value: '22 October 2026 at 03:00 CEST' },
				{ label: 'Failed', value: '22 October 2026 at 03:12 CEST' },
				{ label: 'Attempts', value: '3 of 3' },
				{ label: 'Next run', value: '23 October 2026 at 03:00 CEST' }
			]
		},
		{
			kind: 'log',
			caption: 'The last lines of the log, in Europe/Belgrade time',
			lines: [
				'2026-10-22 03:11:58 Attempt 3 of 3: the bank returned 503 Service Unavailable.',
				'2026-10-22 03:12:04 The import stopped. No attempt is left.'
			]
		}
	],
	action: { label: 'Open the import', url: 'https://docline.example/northfield/imports/bank-statements/2026-10-22' },
	after: [],
	links: [],
	why: 'You get this email because you are an owner of Northfield Ltd. Docline sends each alert about a failed import to every owner.',
	sender
};

/** The kinds in the order of "### Content kinds". */
export const KINDS = [
	{ id: 'request', title: 'A request for an action or a confirmation', email: request },
	{ id: 'notification', title: 'A notification of an event', email: notification },
	{ id: 'digest', title: 'A digest or a weekly report', email: digest },
	{ id: 'alert', title: 'An alert', email: alert }
];
