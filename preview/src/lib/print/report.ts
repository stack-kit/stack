// The sample report of the page /print: the invoices of one month of an invented workspace, with
// its facts, its key figures, the amount of each service for the chart, and the totals. Every name
// and every number is invented, and the data is the same on each load. The css block of
// "### Print template" in DESIGN.md holds the strings of the margin boxes, so the title, the number
// and the issuer here are the same strings.

const LOCALE = 'en-GB';
const ZONE = 'Europe/Belgrade';

const money = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR' });
const wholeMoney = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const day = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric', timeZone: ZONE });
const longDay = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: ZONE });
const issuedAt = new Intl.DateTimeFormat(LOCALE, {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	timeZone: ZONE,
	timeZoneName: 'short'
});

export type Status = 'Paid' | 'Open' | 'Overdue';
export type Invoice = {
	prefix: string;
	digits: string;
	client: string;
	service: string;
	issued: string;
	due: string;
	status: Status;
	amount: number;
};

const CLIENTS = [
	'Miller Ltd',
	'Smith and Sons',
	'Dawn Bakery',
	'Linden Ltd',
	'Złoty Łan',
	'Øresund Bøger',
	'Őrség Kőfaragó',
	'North Freight',
	'River Lab',
	'Şahin Kuruyemiş',
	'Bridge Ltd',
	'Řeka Mlýnář'
];
export const SERVICES = ['Consulting', 'Development', 'Hosting', 'Support', 'Licences', 'Training'];

// Noon in Belgrade, so that the day of each date is the same in every time zone of the reader.
const at = (d: number) => new Date(Date.UTC(2026, 9, d, 10));
const MONTH_END = Date.UTC(2026, 10, 1, 0);

const invoices: Invoice[] = Array.from({ length: 64 }, (_, i) => {
	const issued = 1 + Math.floor((i * 31) / 64);
	const due = at(issued + 15);
	const paid = (i * 11) % 10 < 6;
	const amount = 180 + ((i * 7919) % 2600) + ((i * 37) % 100) / 100;
	return {
		prefix: 'INV-',
		digits: String(101 + i).padStart(4, '0'),
		client: CLIENTS[(i * 5) % CLIENTS.length],
		service: SERVICES[(i * 7 + Math.floor(i / 3)) % SERVICES.length],
		issued: day.format(at(issued)),
		due: day.format(due),
		status: paid ? 'Paid' : due.getTime() < MONTH_END ? 'Overdue' : 'Open',
		amount
	};
});

const sum = (list: Invoice[]) => Math.round(list.reduce((s, x) => s + x.amount * 100, 0)) / 100;
const of = (status: Status) => invoices.filter((x) => x.status === status);

// September, for the change of each key figure.
const SEPTEMBER = { count: 52, invoiced: 84_150.4 };

const invoiced = sum(invoices);
const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const change = (diff: number, unit: (n: number) => string) =>
	diff === 0 ? 'The same as September' : `${unit(Math.abs(diff))} ${diff > 0 ? 'more' : 'less'} than September`;

export const report = {
	title: 'Invoices of October 2026',
	number: 'REP-2026-10',
	issuer: { name: 'Northfield Ltd', address: '4 Grain Square · Riverton 4100 · VAT 108452317' },
	facts: [
		{ label: 'Report', value: 'REP-2026-10', id: true },
		{ label: 'Period', value: longDay.formatRange(at(1), at(31)) },
		{ label: 'Issued', value: issuedAt.format(new Date(Date.UTC(2026, 10, 1, 8))) },
		{ label: 'Currency', value: 'Euro (EUR)' }
	],
	figures: [
		{ label: 'Invoices issued', value: String(invoices.length), change: change(invoices.length - SEPTEMBER.count, String) },
		{
			label: 'Invoiced',
			value: money.format(invoiced),
			change: change(Math.round((invoiced - SEPTEMBER.invoiced) * 100) / 100, (n) => money.format(n))
		},
		{ label: 'Paid', value: money.format(sum(of('Paid'))), change: `${count(of('Paid').length, 'invoice')} of ${invoices.length}` },
		{ label: 'Overdue', value: money.format(sum(of('Overdue'))), change: `${count(of('Overdue').length, 'invoice')} of ${invoices.length}` }
	],
	byService: SERVICES.map((label) => ({
		label,
		value: Math.round(sum(invoices.filter((x) => x.service === label)))
	})),
	invoices,
	totals: [
		...(['Paid', 'Open', 'Overdue'] as const).map((s) => ({
			label: `${count(of(s).length, `${s.toLowerCase()} invoice`)}`,
			amount: money.format(sum(of(s)))
		})),
		{ label: `Total of ${count(invoices.length, 'invoice')}`, amount: money.format(invoiced) }
	],
	money: (n: number) => money.format(n),
	wholeMoney: (n: number) => wholeMoney.format(n)
};
