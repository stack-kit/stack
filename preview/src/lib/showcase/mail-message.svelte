<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import ActivityLines, { type ActivityLine } from '#lib/stack/ActivityLines.svelte';
	import CommentBox from '#lib/stack/CommentBox.svelte';
	import CommentItem, { type CommentData } from '#lib/stack/CommentItem.svelte';
	import ItemColumns from '#lib/stack/ItemColumns.svelte';
	import ListSplit, { itemDocks } from '#lib/stack/ListSplit.svelte';
	import MailMessage, { type Mail } from '#lib/stack/MailMessage.svelte';
	import MailThread, { placeAfter } from '#lib/stack/MailThread.svelte';
	import { undoToast } from '#lib/stack/behaviour/undo.js';
	import RichTextField from '#lib/stack/RichTextField.svelte';
	import { ScreenQuery } from '#lib/stack/screen-query.svelte.js';
	import SplitRow from '#lib/stack/SplitRow.svelte';
	import Gmail from '#lib/service-icons/Gmail.svelte';
	import Instagram from '#lib/service-icons/Instagram.svelte';
	import Messenger from '#lib/service-icons/Messenger.svelte';
	import Signal from '#lib/service-icons/Signal.svelte';
	import Telegram from '#lib/service-icons/Telegram.svelte';
	import Viber from '#lib/service-icons/Viber.svelte';
	import WhatsApp from '#lib/service-icons/WhatsApp.svelte';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleDashedIcon from '@lucide/svelte/icons/circle-dashed';
	import LockIcon from '@lucide/svelte/icons/lock';
	import MailIcon from '@lucide/svelte/icons/mail';
	import MessageSquareTextIcon from '@lucide/svelte/icons/message-square-text';
	import ReplyIcon from '@lucide/svelte/icons/reply';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import UserIcon from '@lucide/svelte/icons/user';
	import UserMinusIcon from '@lucide/svelte/icons/user-minus';
	import XIcon from '@lucide/svelte/icons/x';

	// A shared inbox in the work form: a list of cases, and the mail thread of a case in the item
	// column. A row with an unread message takes the unread mark. Opening a case reads it, and each
	// message that was unread keeps its mark while the case shows. The thread shows the oldest message
	// first, and each read message but the last folds to one line. The thread holds a reply that a
	// person sent, a quote that folds, a message in German with the translation of an agent, files
	// with a photo that opens large, and a reply that the agent sent for a person. Each message shows
	// Sent or Received before its time. A signature and an address keep their line breaks. The second
	// case is a notice to many suppliers, so its To and its Cc end with the count of the people that
	// the product left out. Under it, a second thread holds a message in Arabic with a picture that
	// does not load and a reply that did not go out. A third thread holds a message in Italian that the
	// team reads in its translation, and a fourth thread holds a reply that waits to go out, with Undo
	// and Send now. A fifth thread holds a newsletter that shows as its sender designed it, with Show
	// as text, and the line of its remote pictures with Load pictures. A sixth thread holds the events
	// and the comments of the team in their place among the messages, and a reply and a comment share
	// one place at its end. A seventh thread collects the mail of two inboxes for one lead, with the
	// channel of each message, New, Delete and the reply of another reader that waits. Last, the
	// messages of one client on seven services and in a text message show the icon of each channel in
	// the channel line. Below 768 px the case is its own screen. Every person, address and case is
	// invented.
	const ZONE = 'Europe/Belgrade';
	const now = new Date('2026-11-18T14:20:00+01:00');
	const at = (s: string) => new Date(`${s}+01:00`);
	const support = { name: 'Support', address: 'support@example.com' };
	// A product gives the address of a picture on the host of the content that it did not write. The
	// preview has no such host, so the photo of the box is a PNG of 640 by 480 px in a data address,
	// and the receipt is a picture that does not load.
	const PHOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAHgCAIAAAC6s0uzAAALLUlEQVR42u3dsW3CUBSFYUbyGKk8QIZwlSkYgDprpKdKRUWZKg1b0NGgWIkU3+f3zid9C3Ak7l8A5vD1fQMAih1MAAACDAACDAAIMAAIMAAgwAAgwACAAAOAAAMAAgwAAgwAAgwACDAACDAAIMAAIMAAgAADgAADAAIMAAIMAAIMAAgwAAgwACDAACDAAIAAA4AAAwACDAACDAACDAAIMAAIMAAgwAAgwACAAAOAAAMAAgwAAgwAAgwACDAACDAAIMAAIMAAgAADgAADAAIMAAIMAAIMAAgwAAgwACDAACDAAIAAA4AAAwACDAACDAACDAAIMAAIMAAgwAAgwACAAAOAAAMAAgwAAgwAAgwACDAACDAAIMAAIMAAgAADgAADAAIMAAIMAAIMAAgwAAgwACDAACDAAIAAA4AAAwACDAACDAACbAUAEGAAEGAAQIABQIABAAEGAAEGAAQYAAQYABBgABBgABBgAECAAUCAAQABBgABBgAEGAAEGAAQYAAQYAAQYABAgAFAgAEAAQYAAQYABBgABBgAEGAAEGAAEGAAQIABQIABAAEGAAEGAAQYAAQYABDgGO9vL3Tkej5tysJ9ccEEGAFGgBFgBBgBFmABFmAEGAFGgBFgBBgBFmABFmAEGAFGgBFgBFiAEWALCzACjAAjwAiwACPACDACjAAjwAIswAiwACPACDACjAAjwAIswAKMACPACDACjAAjwAIswAKMACPACDACjAALMAIswAKMACPACDACLMBWEGAEGAFGgBFgARZgBFiAEWAEGAFGgBFgARZgAUaAEWAEGAFGgBFgARZgAUaAEWAEGAFGgAUYARZgAUaAEWAEGAFGgAUYAUaAEWAEWIAFGAEWYAQYAUaAEWAEWIAFWIARYAQYAUaAEWAEWIAFWIARYAQYAUaAEWABRoAFWIARYAQYAUaAEWABRoARYAQYAUaAEWABRoARYAQYAUaABViABRgBRoARYAQYAWbNx/GVjmwd4D28Ru9KEGABRoA1GAQYASYmwBoMAizACLAGgwAjwAKcFGANRoCtIMAIsAaDACPAApwUYA1GgBFgBFiDQYARYAFOCrAGI8AIMAKswSDACLAAJwVYgxFgBBgB1mAQYARYgJMCrMEIMAKMAGswCDACLMBJAdZgBBgBRoA1GAQYARbgpABrMAKMACPAGgwCjAALcFKANRgBRoARYA0GAUaABTgpwBqMACPACLAGgwAjwAKcFGANRoARYARYg0GAEWABTgqwBiPACDACrMEgwAiwACcFWIMRYAQYAdZgEGAEWICTAqzBCDACjABrMAgwAizASQHWYAQYAUaANRgEWIBVTYCTAqzBCDACjABrMAiwACPASQHWYAQYAUaANRgEWIAR4LA9XQAEGAFGgDUYBFiAEWANBgFGgBFgDUaAEWAEWINBgBFgARZgDUaAEWAEWINBgBFgARZgDUaAEWAEWINBgBFgARZgDUaAEWAEWINBgAUYAUaDEWAEGAHWYAQYAUaANRgEGAEWYAHWYAQYAUaANRgEGAEWYAHWYAQYAUaANRgEGAEWYAHWYAQYAUaANRgEWIARYDQYAUaAEWANRoARYAQYDUaAEWABFmANRoARYARYg0GAEWABFmANRoARYARYg0GAEWABFmANRoARYARYg0GABRgBNrIGI8AIMAKswQgwAowAo8EIMAIswAKswQgwAowAo8EIMAIswAKswQgwAowAo8EIMAIswAKswQgwAowAazAIsAAjwAKswQgwAowAazACbAUBRoDRYAQYARZgAdZgBBgBRoDRYAQYARZgAdZgBBgB/tkyT46vAKPBCLAAt2mwDAswGowAC7AMC7AAazACTNhnwDIswDhHCLAAy7AAo8EIMHnfgpZhAdZgEGABlmEBRoMRYPJ+ByzDAqzBCDACLMMCjAYjwOQ9CUuGBViDEWAEWIYFGA1GgMl7FnRshgVYgxFgBFiGBRgNRoCJDHBghgVYgxFgBFiGBRgNRoCJD3BIhgVYgxFgBFiGBRgNRoAR4IwMCzAaLMAIsAwLMBqMACPAGRkWYDRYgBFgGRZgNBgBRoAzMizACLAAI8AyLMAIMAKMAGdkWIARYAFGgGVYgBFgBBgBzsiwACPAAowAy7AAI8AIMAKckWEBRoAFGAGWYQFGgBFgBDgjwwKMAAswAizDAowAI8AIcEaGBRgBFmAEWIYFGAFGgBHgjAwLMAIswAgwDTIswAiwACPANMiwACPAAowA0yDDAowACzACTIMMCzACLMAIMA0yLMAIsAAjwDTIsAAjwAKMAPOHDAswAowAI8AdE2AEWIARYAQYAUaAEWABFmABRoARYAQYAUaAEWABFmABRoARYAQYAUaAccIEWIAFGAFGgBFgBBgBFmAEGAFGgBFgBBgBFmAEGAFGgBFgBFiABViAEWAEGAFGgBFgBFiABViAEWAEGAFGgBFgBFiABViAEWAEGAFGgBFgAUaAEWAEGAFGgBFgAUaAEeA9WuZpmScBRoARYAS4rrtp6RVgAUaAEWDdFWAEGAEW4NEDrLsCLMAIMAKsuwKMACPAAjxigHVXgAUYAUaAdVeAEWAEWIBHDLDuCjACLMAIsO4KMAKMADNigHVXgBFgAUaA6wKsuwKMACPAAlwXYN0VYAQYARbgugDrrgAjwAiwANcFWHcFGAFGgAW4LsC6K8AIMAIswHUB1l0BRoARYAGuC7DuCjACjAALcF2AdVeAEWAEWIDrAqy7AowAI8ACXBdg3RVgBBgBpi7AuivACDACTF2AdVeAEWAEmLoA664AI8AIMHUBfnR3J/8HjAAjwALMyAF+7q4ACzACjACzVYBXuivAAowAI8D8c4B/010BFmAEGAFmhH9DQoARYARYgAVYgBFgBBgBRoARYARYgAVYgBFgBBgBRoARYAFGgBFgBBgBRoARYAFGgBFgBBgBRoAFWIAFGAFGgBFgBBgBRoAFWIAFGAFGgBFgBBgBRoAFWIAFmF0H+Px5YWBOmAALcL9csLEJsAAjwAgwAowAC7AAI8ACjAAjwAgwAowAC7AACzACjAAjwAgwAowAC7AACzACjAAjwAgwAizACLAACzACjAAjwAgwAizACDACjAAjwAIswAiwACPACDACjAAjwAIswAKMACPACDACjAAjwAIswAKMACPACDACjAALsCsmwAIswAgwAowAI8AIsAAjwAgwAowAI8AIsAAjwAgwAowAI8ACLMACjAAjwAgwAowAI8ACLMACjAAjwAgwAowAI8ACLMACjAAjwAgwAowACzACjAAjwAgwAowACzACjAAjwAgwAizAAizACDACjAAjwAgwAizAAizACDACjAAjwAgwAizAAizACDACjAAjwAiwACPACDACjAAjwAiwACPACDACjAADgAADAAIMAAIMAAgwAAgwACDAACDAACDAAIAAA4AAAwACDAACDAAIMAAIMAAgwAAgwAAgwACAAAOAAAMAAgwAAgwACDAACDAAIMAAIMAAIMAAgAADgAADAAIMAAIMAAgwAAgwACDAACDAACDAAIAAA4AAAwACDAACDAAIMAAIMAAgwAAgwAAgwCYAAAEGAAEGAAQYAAQYABBgABBgAECAAUCAAQABBgABBgABBgAEGAAEGAAQYAAQYABAgAFAgAEAAQYAAQYAAQYABBgABBgAEGAAEGAAQIABQIABAAEGAAEGAAEGAAQYAAQYABBgABBgAECAAUCAAQABBgABBgABBgAEGAAEGAAQYAAQYABAgAFAgAEAAQYAAQYAAQYABBgABBgAEGAAEGAAQIABQIABAAEGAAEGgFB3xAXFRJymTQAAAAAASUVORK5CYII=';
	const ana = { name: 'Ana Turner', address: 'ana.turner@example.org' };

	type Case = { key: string; subject: string; thread: Mail[] };
	let cases = $state<Case[]>([
		{
			key: 'CASE-0142',
			subject: 'Refund for order 8841',
			thread: [
				{
					id: 'm1',
					direction: 'in',
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
						{ name: 'photo-of-the-box.jpg', size: '1.2 MB', image: true, picture: PHOTO },
						{ name: 'invoice-8841.pdf', size: '182 KB' }
					]
				},
				{
					id: 'm2',
					direction: 'out',
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
					direction: 'in',
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
					direction: 'out',
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
					direction: 'in',
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
					direction: 'in',
					from: { address: 'orders@example.net' },
					to: [support],
					at: at('2026-11-17T08:15:00'),
					body: ['Please deliver order 8790 to the warehouse at the back of the building.']
				},
				{
					id: 'k2',
					direction: 'out',
					from: support,
					to: [{ address: 'orders@example.net' }],
					at: at('2026-11-17T09:40:00'),
					sentBy: 'Sent by Ana Turner',
					body: ['We changed the address of order 8790. The courier delivers it on Thursday.']
				}
			]
		}
	]);

	let states = $state<Mail[]>([
		{
			id: 's1',
			direction: 'in',
			from: { name: 'Layla Haddad', address: 'layla@example.com' },
			to: [support],
			at: at('2026-11-18T12:05:00'),
			lang: 'ar',
			dir: 'rtl',
			body: ['شكراً لكم.', 'وصلني المبلغ اليوم.'],
			files: [{ name: 'receipt.jpg', size: '840 KB', image: true, picture: 'data:image/png;base64,' }],
			unread: true
		},
		{
			id: 's2',
			direction: 'out',
			from: support,
			to: [{ address: 'h.weber@exmaple.de' }],
			bcc: [{ address: 'archive@example.com' }],
			at: at('2026-11-18T14:02:00'),
			sentBy: 'Sent by Marko Ellis',
			body: ['Thank you for the report. We sent the claim form back today.'],
			failed: 'The address h.weber@exmaple.de does not exist.'
		}
	]);
	// Retry sends the reply again. The preview has no server, so the reply goes out at once, and its badge then says Sent.
	const retry = (m: Mail) => (states = states.map((x) => (x.id === m.id ? { ...x, failed: undefined } : x)));

	// A message in Italian, which the team reads in its translation: the translation comes first, and
	// the original folds behind a button. The message is read, so it folds, and its folded line shows
	// the first words of the translation. The team wrote the reply in English, and the reply went out
	// in Italian. Its English text stays inside the team, so it stands first in the internal mark, and
	// the mail as sent folds behind a button.
	const italian: Mail[] = [
		{
			id: 't1',
			direction: 'in',
			from: { name: 'Claire Morton', address: 'claire.morton@example.it' },
			to: [support],
			at: at('2026-11-18T08:40:00'),
			lang: 'it',
			body: [
				'Buongiorno,',
				"il pacco dell'ordine 8917 è arrivato senza la fattura. Potete inviarla a questo indirizzo?",
				'Grazie e cordiali saluti,\nClaire Morton'
			],
			translation: {
				by: 'Mail agent',
				lang: 'en-GB',
				body: ['Good morning,', 'The parcel of order 8917 came without the invoice. Can you send it to this address?', 'Thank you and kind regards,\nClaire Morton']
			},
			translationFirst: true
		},
		{
			id: 't2',
			direction: 'out',
			from: support,
			to: [{ name: 'Claire Morton', address: 'claire.morton@example.it' }],
			at: at('2026-11-18T09:15:00'),
			sentBy: 'Sent by Ana Turner',
			lang: 'it',
			body: ['Gentile Claire,', "alleghiamo la fattura dell'ordine 8917.", 'Ana Turner\nSupport'],
			source: { lang: 'en-GB', body: ['Dear Claire,', 'We attach the invoice of order 8917.', 'Ana Turner\nSupport'] },
			sourceFirst: true,
			files: [{ name: 'invoice-8917.pdf', size: '176 KB' }]
		}
	];

	// A reply that waits to go out for 20 seconds after Send, so that the person can undo it. The page
	// sets the time when it mounts, so that the static build holds no time of its own.
	const question: Mail = {
		id: 'w1',
		direction: 'in',
		from: { name: 'Priya Nair', address: 'priya.nair@example.org' },
		to: [support],
		at: at('2026-11-18T13:55:00'),
		body: ['Hello,', 'Can you send the invoice for order 8902 to our accounts address?', 'Priya']
	};
	const answer: Mail = {
		id: 'w2',
		direction: 'out',
		from: support,
		to: [{ name: 'Priya Nair', address: 'priya.nair@example.org' }],
		at: now,
		sentBy: 'Sent by Marko Ellis',
		body: ['Dear Priya,', 'We sent the invoice for order 8902 to accounts@example.org today.', 'Marko Ellis\nSupport']
	};
	let reply = $state<Mail | undefined>();
	let goesOut: ReturnType<typeof setTimeout> | undefined;
	function send() {
		clearTimeout(goesOut);
		reply = { ...answer, sendsAt: new Date(Date.now() + 20_000) };
		goesOut = setTimeout(sendNow, 20_000);
	}
	function sendNow() {
		clearTimeout(goesOut);
		reply = answer;
	}
	function undo() {
		clearTimeout(goesOut);
		reply = undefined;
	}
	onMount(() => {
		send();
		return () => clearTimeout(goesOut);
	});

	// A lead that collects the mail of two shared inboxes. Each message names its channel, with the
	// icon of mail before the words, and its subject, because the lead holds two threads. The second
	// conversation joined the lead by a rule, so its messages show New. Each message has one action,
	// Delete, which takes it out of the thread. The page shows Undo in a toast, because the part shows no
	// toast. The reply of another reader waits to go out, and its line gives the words of the page in
	// place of the time left, with no Undo and no Send now.
	const evelyn = { name: 'Evelyn Price', address: 'evelyn.price@example.org' };
	const sales = { name: 'Sales', address: 'sales@example.com' };
	let lead = $state<Mail[]>([
		{
			id: 'l1',
			direction: 'in',
			channel: 'Mail · Sales',
			channelIcon: MailIcon,
			subject: 'Price for 40 cups and 40 bowls',
			from: evelyn,
			to: [sales],
			at: at('2026-11-16T10:20:00'),
			body: ['Hello,', 'Can you send us a price for 40 cups and 40 bowls in Kiln Blue?', 'Evelyn']
		},
		{
			id: 'l2',
			direction: 'out',
			channel: 'Mail · Sales',
			channelIcon: MailIcon,
			subject: 'Re: Price for 40 cups and 40 bowls',
			from: sales,
			to: [evelyn],
			at: at('2026-11-16T15:05:00'),
			sentBy: 'Sent by Riley Shaw',
			body: ['Dear Evelyn,', 'We attach the price for 40 cups and 40 bowls. It holds for 30 days.', 'Riley Shaw\nSales']
		},
		{
			id: 'l3',
			direction: 'in',
			fresh: true,
			channel: 'Mail · Support · Spam',
			channelIcon: MailIcon,
			subject: 'A cracked bowl',
			from: evelyn,
			to: [support],
			at: at('2026-11-18T09:12:00'),
			body: ['Hello,', 'Our order of last year came with one cracked bowl. Can you send a new one with the next order?', 'Evelyn']
		},
		{
			id: 'l4',
			direction: 'out',
			fresh: true,
			channel: 'Mail · Support',
			channelIcon: MailIcon,
			subject: 'Re: A cracked bowl',
			from: support,
			to: [evelyn],
			at: at('2026-11-18T14:10:00'),
			sentBy: 'Sent by Morgan Lee',
			body: ['Dear Evelyn,', 'We put a new bowl into your next order, at no cost.', 'Morgan Lee\nSupport'],
			sendsAt: at('2026-11-18T14:21:00'),
			waitingNote: "Morgan Lee's reply waits to go out. Only Morgan Lee can undo it."
		}
	]);
	// One client writes on seven services, and once in a text message. Each message names its channel,
	// with the icon of its service before the words: an icon that STACK ships, or the Lucide icon of a
	// text message, which has no mark. The phone numbers are in the ranges for drama of the UK.
	const nora = { name: 'Nora Quinn', address: '+44 7700 900123' };
	const desk = { name: 'Support', address: '+44 20 7946 0000' };
	const service = (id: string, channel: string, channelIcon: Mail['channelIcon'], time: string, body: string): Mail => ({ id, direction: 'in', channel, channelIcon, from: nora, to: [desk], at: at(time), body: [body] });
	const services: Mail[] = [
		service('s1', 'WhatsApp · Support', WhatsApp, '2026-11-18T08:02:00', 'Hello, did my order of 40 cups leave the store?'),
		service('s2', 'Viber · Support', Viber, '2026-11-18T08:30:00', 'I sent the same question here too, sorry.'),
		service('s3', 'Telegram · Support', Telegram, '2026-11-18T09:05:00', 'Can you send the tracking number?'),
		service('s4', 'Messenger · Support', Messenger, '2026-11-18T09:40:00', 'The page of the store says the cups are back in stock.'),
		service('s5', 'Instagram · Support', Instagram, '2026-11-18T10:15:00', 'I love the new glaze in your last post.'),
		service('s6', 'Signal · Support', Signal, '2026-11-18T11:00:00', 'My new address is in the mail that I sent today.'),
		{ id: 's7', direction: 'in', channel: 'Gmail · Support', channelIcon: Gmail, from: { name: 'Nora Quinn', address: 'nora.quinn@example.org' }, to: [support], at: at('2026-11-18T11:20:00'), body: ['Please send the next order to my new address.'] },
		service('s8', 'Text message · Support', MessageSquareTextIcon, '2026-11-18T12:10:00', 'Thank you, the parcel came today.')
	];
	const sender = (m: Mail) => m.from.name ?? m.from.address;
	function trash(m: Mail) {
		lead = lead.filter((x) => x.id !== m.id);
		undoToast(`Mail from ${sender(m)} moved to the Trash`, {
			undo: () => {
				lead = [...lead, m].sort((a, b) => a.at.getTime() - b.at.getTime());
			}
		});
	}

	// A newsletter with an HTML part. A product gives frame, the signed address of the page of the
	// message on the host of the content that it did not write. The preview has no such host, so the
	// address is a sample page of its own origin (src/routes/frames/). body is the plain text part,
	// which Show as text shows. The page names 2 remote pictures, and Load pictures gives the address
	// of the page with the copies, which names none.
	let newsletter = $state<Mail[]>([
		{
			id: 'h1',
			direction: 'in',
			from: { name: 'Larkfield Ceramics', address: 'news@example.net' },
			to: [support],
			at: at('2026-11-18T07:30:00'),
			body: [
				'The winter glazes are here',
				'Dear Ana,',
				'Our glazes for the winter are ready: Ash Grey, Kiln Blue and Ember. We make each cup and each bowl by hand in our workshop.',
				'See the winter glazes: https://example.com/winter',
				'Kind regards,\nMira Holt\nLarkfield Ceramics'
			],
			frame: '/frames/remote.html'
		}
	]);
	function loadPictures(m: Mail) {
		newsletter = newsletter.map((x) => (x.id === m.id ? { ...x, frame: '/frames/pictures.html' } : x));
	}

	// The events and the comments of the team between the messages. The page gives each entry to the last
	// mail at or before its time, and a run of events is one stretch, which a comment ends. The second
	// stretch has nine events, so it folds to its last three. A comment that the box adds stands after the
	// last mail, by its time.
	const jordan = { name: 'Jordan Hale', address: 'jordan.hale@example.net' };
	const team: Mail[] = [
		{
			id: 'r1',
			direction: 'in',
			from: jordan,
			to: [support],
			at: at('2026-11-17T08:50:00'),
			body: ['Hello,', 'The invoice INV-0042 names our old address. Can you send it again with the new one?', 'Jordan']
		},
		{
			id: 'r2',
			direction: 'out',
			from: support,
			to: [jordan],
			at: at('2026-11-17T11:30:00'),
			sentBy: 'Sent by Riley Shaw',
			body: ['Dear Jordan,', 'We sent the invoice INV-0042 again, with the new address.', 'Riley Shaw\nSupport']
		},
		{
			id: 'r3',
			direction: 'in',
			from: jordan,
			to: [support],
			at: at('2026-11-18T09:40:00'),
			body: ['Thank you, the new invoice is correct.', 'Jordan']
		}
	];
	const teamEvents: ActivityLine[] = [
		{ id: 'v1', at: at('2026-11-17T08:55:00'), text: 'Riley Shaw took the conversation', icon: UserIcon },
		{ id: 'v2', at: at('2026-11-17T09:10:00'), text: 'Riley Shaw set the status to Waiting', icon: CircleDashedIcon },
		{ id: 'v3', at: at('2026-11-17T10:40:00'), text: 'Riley Shaw set the status to Open', icon: CircleIcon },
		{ id: 'v4', at: at('2026-11-17T11:35:00'), text: 'Riley Shaw released the conversation', icon: UserMinusIcon },
		{ id: 'v5', at: at('2026-11-17T11:50:00'), text: 'Morgan Lee took the conversation', icon: UserIcon },
		{ id: 'v6', at: at('2026-11-17T12:30:00'), text: 'Morgan Lee set the status to Waiting', icon: CircleDashedIcon },
		{ id: 'v7', at: at('2026-11-17T14:00:00'), text: 'Morgan Lee released the conversation', icon: UserMinusIcon },
		{ id: 'v8', at: at('2026-11-17T14:05:00'), text: 'Casey Brooks took the conversation', icon: UserIcon },
		{ id: 'v9', at: at('2026-11-17T16:00:00'), text: 'Casey Brooks set the status to Open', icon: CircleIcon },
		{ id: 'v10', at: at('2026-11-17T16:20:00'), text: 'Casey Brooks set the status to Waiting', icon: CircleDashedIcon },
		{ id: 'v11', at: at('2026-11-18T08:00:00'), text: 'Morgan Lee took over the conversation from Casey Brooks', icon: UserIcon },
		{ id: 'v12', at: at('2026-11-18T08:30:00'), text: 'Morgan Lee set the status to Open', icon: CircleIcon },
		{ id: 'v13', at: at('2026-11-18T09:45:00'), text: 'Morgan Lee marked the conversation as done', icon: CircleCheckIcon }
	];
	let teamComments = $state<CommentData[]>([
		{
			id: 'n1',
			author: { name: 'Riley Shaw' },
			at: at('2026-11-17T09:30:00'),
			html: '<div>Our records still hold the old address. I asked Billing to change it before we send the invoice again.</div>'
		}
	]);
	const teamEntries = $derived(placeAfter(team, teamEvents, teamComments));
	let answerTab = $state('comment');
	const addComment = (html: string) =>
		new Promise<void>((resolve) =>
			setTimeout(() => {
				teamComments = [...teamComments, { id: `n${teamComments.length + 1}`, author: { name: 'Morgan Lee' }, at: new Date(now), html }];
				resolve();
			}, 500)
		);

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
		click opens it. A quote folds behind a button, and a photo opens large. The German message shows the translation of an agent, and the last reply names the agent and
		the person. Each message shows Sent or Received. A signature and an address keep their line breaks. The second case is a notice to many
		suppliers, so its lists end with a count. A message in Italian shows its translation first, with the original behind a button, and the reply in Italian shows the English text of the team first, in the internal mark, with the mail as sent behind a button. A newsletter
		shows as its sender designed it, in the frame of its content host, with a line about its remote pictures and Load pictures, and Show as text shows its plain text part. A thread of a lead names the
		channel of each message with its icon, gives the subject of each message, because the lead holds two threads, marks the messages that joined the lead by a rule as New, and gives each message Delete. The last thread shows the events
		and the comments of the team in their place among the messages, and a reply and a comment share one place at its end. Last, the messages of one client on seven services show the icon of each service that STACK ships in the channel line, and a text message takes the Lucide icon of its kind.
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

	<h3 class="text-xs font-medium text-muted-foreground">A message in Arabic with a picture that does not load, and a reply that did not go out, with Bcc</h3>
	<div class="max-w-3xl rounded-lg border border-border p-4">
		<MailThread mails={states} {now} timeZone={ZONE} headingLevel={3} onretry={retry} />
	</div>

	<h3 class="text-xs font-medium text-muted-foreground">A message in Italian that the team reads in its translation, with the original behind a button, and a reply that went out in Italian, with the English text of the team first</h3>
	<div class="max-w-3xl rounded-lg border border-border p-4">
		<MailThread mails={italian} {now} timeZone={ZONE} headingLevel={3} />
	</div>

	<h3 class="text-xs font-medium text-muted-foreground">A reply that waits 20 seconds to go out, with Undo and Send now</h3>
	<div class="flex max-w-3xl flex-col items-start gap-3 rounded-lg border border-border p-4">
		<MailThread class="self-stretch" mails={reply ? [question, reply] : [question]} {now} timeZone={ZONE} headingLevel={3} onundo={undo} onsendnow={sendNow} />
		{#if !reply}<Button variant="outline" size="sm" class="print:hidden" onclick={send}>Send the reply</Button>{/if}
	</div>

	<h3 class="text-xs font-medium text-muted-foreground">The mail of two inboxes for one lead: the channel of each message with its icon, its subject, New, Delete, and the reply of another reader that waits</h3>
	<div class="max-w-3xl rounded-lg border border-border p-4">
		<MailThread
			mails={lead}
			{now}
			timeZone={ZONE}
			headingLevel={3}
			actions={(m) => [{ id: 'delete', label: `Delete the mail from ${sender(m)}`, icon: Trash2Icon, destructive: true, run: () => trash(m) }]}
			actionsLabel={(m) => `Actions of the mail from ${sender(m)}`}
		/>
	</div>

	<h3 class="text-xs font-medium text-muted-foreground">A newsletter as its sender designed it, with Show as text, and the line of its remote pictures with Load pictures. A product serves the page from its content host, and the preview serves a sample page.</h3>
	<div class="max-w-3xl rounded-lg border border-border p-4">
		<MailThread mails={newsletter} {now} timeZone={ZONE} headingLevel={3} onloadpictures={loadPictures} />
	</div>

	<h3 class="text-xs font-medium text-muted-foreground">The events and the comments of the team in their place, and a reply and a comment at the end</h3>
	<!-- The box of the comment-box showcase owns the C key of this page, so this box takes none. -->
	<div class="flex max-w-3xl flex-col gap-4 rounded-lg border border-border p-4">
		<MailThread mails={team} {now} timeZone={ZONE} headingLevel={3} note="Comments and changes stand in their place.">
			{#snippet after(mail)}
				{#each teamEntries.get(mail.id) ?? [] as e (e.key)}
					{#if e.kind === 'lines'}
						<ActivityLines lines={e.lines} {now} timeZone={ZONE} />
					{:else}
						<CommentItem comment={e.comment} {now} timeZone={ZONE} internal headingLevel={4} />
					{/if}
				{/each}
			{/snippet}
		</MailThread>
		<Tabs.Root bind:value={answerTab}>
			<Tabs.List aria-label="Answer">
				<Tabs.Trigger value="reply" class="text-muted-foreground"><ReplyIcon data-icon="inline-start" />Reply · goes out</Tabs.Trigger>
				<Tabs.Trigger value="comment" class="text-muted-foreground"><LockIcon data-icon="inline-start" />Comment · internal</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="reply" class="flex flex-col gap-1.5">
				<RichTextField aria-label="Reply to Jordan Hale" placeholder="Write the reply" />
				<Button size="sm" class="self-end">Reply</Button>
			</Tabs.Content>
			<Tabs.Content value="comment">
				<CommentBox internal primary caretKeys={[]} onsend={addComment} onreveal={() => (answerTab = 'comment')} />
			</Tabs.Content>
		</Tabs.Root>
	</div>

	<h3 class="text-xs font-medium text-muted-foreground">One client on seven services and in a text message: the icon of each channel before its words in the channel line</h3>
	<div class="grid max-w-5xl gap-4 rounded-lg border border-border p-4 lg:grid-cols-2">
		{#each services as m (m.id)}
			<MailMessage mail={m} {now} timeZone={ZONE} headingLevel={4} />
		{/each}
	</div>
</section>
