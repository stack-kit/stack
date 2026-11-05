<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import ItemColumns from '#lib/stack/ItemColumns.svelte';
	import ListSplit, { itemDocks } from '#lib/stack/ListSplit.svelte';
	import type { Mail } from '#lib/stack/MailMessage.svelte';
	import MailThread from '#lib/stack/MailThread.svelte';
	import { ScreenQuery } from '#lib/stack/screen-query.svelte.js';
	import SplitRow from '#lib/stack/SplitRow.svelte';
	import XIcon from '@lucide/svelte/icons/x';

	// A shared inbox in the work form: a list of cases, and the mail thread of a case in the item
	// column. A row with an unread message takes the unread mark. Opening a case reads it, and each
	// message that was unread keeps its mark while the case shows. The thread shows the oldest
	// message first, and each read message but the last folds to one line. The thread holds a reply
	// that a person sent, a quote that folds, a message in German with the translation of an agent,
	// files, and a reply that the agent sent for a person. A signature and an address keep their
	// line breaks. The second case is a notice to many suppliers, so its To and its Cc end with the
	// count of the people that the product left out. Under it, a second thread holds a message in
	// Arabic and a reply that did not go out. Below 768 px the case is its own screen. Every person,
	// address and case is invented.
	const ZONE = 'Europe/Belgrade';
	const now = new Date('2026-11-18T14:20:00+01:00');
	const at = (s: string) => new Date(`${s}+01:00`);
	const support = { name: 'Support', address: 'support@example.com' };
	const ana = { name: 'Ana Turner', address: 'ana.turner@example.org' };

	type Case = { key: string; subject: string; thread: Mail[] };
	let cases = $state<Case[]>([
		{
			key: 'CASE-0142',
			subject: 'Refund for order 8841',
			thread: [
				{
					id: 'm1',
					from: ana,
					to: [support],
					at: at('2026-11-12T09:14:00'),
					body: [
						'Hello,',
						'The parcel of order 8841 came damaged, and two of the three cups are broken. I attach a photo of the box and the invoice.',
						'Can you send me a refund for the two cups?',
						'Ana'
					],
					files: [
						{ name: 'photo-of-the-box.jpg', size: '1.2 MB', image: true },
						{ name: 'invoice-8841.pdf', size: '182 KB' }
					]
				},
				{
					id: 'm2',
					from: support,
					to: [ana],
					cc: [{ name: 'Billing', address: 'billing@example.com' }],
					at: at('2026-11-12T11:02:00'),
					sentBy: 'Sent by Marko Ellis',
					body: [
						'Dear Ana,',
						'Thank you for the photo, and we are sorry about the cups. We asked the courier for a report, and we answer within two working days.',
						'Marko Ellis\nSupport'
					],
					quote: ['On 12 Nov 2026 at 09:14, Ana Turner wrote:', 'The parcel of order 8841 came damaged, and two of the three cups are broken. I attach a photo of the box and the invoice.']
				},
				{
					id: 'm3',
					from: { name: 'Hans Weber', address: 'h.weber@example.de' },
					to: [support],
					at: at('2026-11-18T10:05:00'),
					lang: 'de',
					body: [
						'Guten Tag,',
						'die Sendung 8841 wurde am 11. November beschädigt zugestellt. Der Schaden ist auf dem Foto unseres Fahrers zu sehen.',
						'Sie können die Erstattung beantragen. Das Formular liegt bei.',
						'Mit freundlichen Grüßen\nHans Weber'
					],
					translation: {
						by: 'Mail agent',
						lang: 'en-GB',
						body: [
							'Good day,',
							'The parcel 8841 was delivered damaged on 11 November. The photo of our driver shows the damage.',
							'You can ask for the refund. The form is attached.',
							'Kind regards\nHans Weber'
						]
					},
					files: [{ name: 'claim-form.pdf', size: '96 KB' }],
					unread: true
				},
				{
					id: 'm4',
					from: support,
					to: [ana],
					at: at('2026-11-18T13:40:00'),
					sentBy: 'Sent by Mail agent for Marko Ellis',
					body: [
						'Dear Ana,',
						'The courier confirmed the damage. We sent a refund of €24.00 for the two cups to your card today, and it shows in your account within five working days.',
						'Marko Ellis\nSupport'
					],
					quote: ['On 12 Nov 2026 at 11:02, Support wrote:', 'Thank you for the photo, and we are sorry about the cups.', 'Marko Ellis\nSupport']
				}
			]
		},
		{
			key: 'CASE-0141',
			subject: 'The invoice address for 2027',
			thread: [
				{
					id: 'n1',
					from: { name: 'Jelena Brandt', address: 'jelena@example.net' },
					// A notice to every supplier. The product gave only the first people of each list, and the counts of the others.
					to: [support, { name: 'Sales', address: 'sales@example.org' }],
					toMore: 90,
					cc: [{ name: 'Accounts', address: 'accounts@example.net' }],
					ccMore: 1,
					at: at('2026-11-18T12:30:00'),
					body: ['Hello,', 'From January our invoices go to the new office. Please change the address for 2027:', 'Brandt & Cole Ltd\n14 Mill Lane\nRiverton', 'Jelena Brandt'],
					unread: true
				}
			]
		},
		{
			key: 'CASE-0139',
			subject: 'Change of the delivery address',
			thread: [
				{
					id: 'k1',
					from: { address: 'orders@example.net' },
					to: [support],
					at: at('2026-11-17T08:15:00'),
					body: ['Please deliver order 8790 to the warehouse at the back of the building.']
				},
				{
					id: 'k2',
					from: support,
					to: [{ address: 'orders@example.net' }],
					at: at('2026-11-17T09:40:00'),
					sentBy: 'Sent by Ana Turner',
					body: ['We changed the address of order 8790. The courier delivers it on Thursday.']
				}
			]
		}
	]);

	const states: Mail[] = [
		{
			id: 's1',
			from: { name: 'Layla Haddad', address: 'layla@example.com' },
			to: [support],
			at: at('2026-11-18T12:05:00'),
			lang: 'ar',
			dir: 'rtl',
			body: ['شكراً لكم.', 'وصلني المبلغ اليوم.'],
			unread: true
		},
		{
			id: 's2',
			from: support,
			to: [{ address: 'h.weber@exmaple.de' }],
			bcc: [{ address: 'archive@example.com' }],
			at: at('2026-11-18T14:02:00'),
			sentBy: 'Sent by Marko Ellis',
			body: ['Thank you for the report. We sent the claim form back today.'],
			failed: 'The address h.weber@exmaple.de does not exist.'
		}
	];

	const phone = new ScreenQuery('max-width: 767px');
	const uid = $props.id();
	const time = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, hour: '2-digit', minute: '2-digit' });
	const date = new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
	const last = (c: Case) => c.thread[c.thread.length - 1];
	const when = (d: Date) => (d.toDateString() === now.toDateString() ? time.format(d) : date.format(d));

	/** The case that the person opened, '' after Close, and undefined before any choice. */
	let opened = $state<string | undefined>(undefined);
	/** The messages that were unread when the case opened. They keep their mark while it shows. */
	let marked = $state<string[]>([]);
	const shownKey = $derived(opened === undefined ? (itemDocks.current || phone.current ? cases[0].key : undefined) : opened || undefined);
	const shown = $derived(cases.find((c) => c.key === shownKey));
	const thread = $derived(shown ? shown.thread.map((m) => ({ ...m, unread: m.unread || marked.includes(m.id) })) : []);

	function open(key: string) {
		const c = cases.find((x) => x.key === key);
		if (!c) return;
		marked = c.thread.filter((m) => m.unread).map((m) => m.id);
		for (const m of c.thread) m.unread = false;
		opened = key;
	}
</script>

{#snippet caseHead(c: Case)}
	<div class="flex items-center gap-2">
		<span class="text-base font-semibold tabular-nums">{c.key}</span>
		<span class="min-w-0 flex-1 truncate">{c.subject}</span>
		<span class="text-xs text-muted-foreground tabular-nums">{cases.indexOf(c) + 1} / {cases.length}</span>
		{#if !phone.current}<Button variant="ghost" size="icon-sm" aria-label="Close" class="print:hidden" onclick={() => (opened = '')}><XIcon /></Button>{/if}
	</div>
{/snippet}

<section id="showcase-mail-message" data-showcase="mail-message" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">mail-message</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		A shared inbox in the work form, with the mail thread of a case in the item column. Each read message but the last folds to one line, and a
		click opens it. A quote folds behind a button. The German message shows the translation of an agent, and the last reply names the agent and
		the person. A signature and an address keep their line breaks. The second case is a notice to many suppliers, so its lists end with a count.
	</p>

	<div class="flex h-[40rem] flex-col overflow-hidden rounded-lg border border-border print:h-auto">
		{#if phone.current}
			{#if shown}
				<div class="min-h-0 flex-1 overflow-y-auto p-4 print:overflow-visible">
					<div class="flex flex-col gap-4">{@render caseHead(shown)}<MailThread mails={thread} {now} timeZone={ZONE} /></div>
				</div>
			{/if}
		{:else}
			<div class="flex min-h-0 flex-1 print:block">
				<ListSplit open={!!shown} key={shown?.key} listLabel="Cases" itemLabel={shown ? `Case ${shown.key}` : 'Case'}>
					{#snippet list()}
						<ul role="list" aria-label="Cases">
							{#each cases as c (c.key)}
								<SplitRow id="{uid}-{c.key}" current={c.key === shownKey} unread={c.thread.some((m) => m.unread)} onopen={() => open(c.key)}>
									{#snippet line1()}<span class="mr-1.5 inline-block font-medium tabular-nums">{c.key}</span>{c.subject}{/snippet}
									{#snippet end1()}<time datetime={last(c).at.toISOString()}>{when(last(c).at)}</time>{/snippet}
									{#snippet line2()}<bdi>{c.thread[0].from.name ?? c.thread[0].from.address}</bdi><span class="text-muted-foreground">{' '}· {c.thread.length} {c.thread.length === 1 ? 'message' : 'messages'}</span>{/snippet}
								</SplitRow>
							{/each}
						</ul>
					{/snippet}
					{#snippet item()}
						{#if shown}
							{@const c = shown}
							<ItemColumns>
								{#snippet header()}{@render caseHead(c)}{/snippet}
								{#snippet content()}{#key c.key}<MailThread mails={thread} {now} timeZone={ZONE} />{/key}{/snippet}
							</ItemColumns>
						{/if}
					{/snippet}
				</ListSplit>
			</div>
		{/if}
	</div>

	<h3 class="text-xs font-medium text-muted-foreground">A message in Arabic, and a reply that did not go out, with Bcc</h3>
	<div class="max-w-3xl rounded-lg border border-border p-4">
		<MailThread mails={states} {now} timeZone={ZONE} headingLevel={3} />
	</div>
</section>

