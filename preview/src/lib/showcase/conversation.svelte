<script lang="ts">
	import Conversation, { type ChatMessage } from '#lib/stack/Conversation.svelte';
	import type { ActivityLine } from '#lib/stack/ActivityLines.svelte';
	import type { CommentData } from '#lib/stack/CommentItem.svelte';
	import type { Mail } from '#lib/stack/MailMessage.svelte';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import MailIcon from '@lucide/svelte/icons/mail';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import MessageSquareTextIcon from '@lucide/svelte/icons/message-square-text';
	import UserIcon from '@lucide/svelte/icons/user';

	// One client on three channels over two days: a chat before the first mail, a run of one author that
	// ends at a change of channel, a read mail that folds, the messages of the person at the end with
	// their send state, one of them failed, an event, an internal comment, and the last mail open. The
	// second conversation is the view of one channel, where a tab names the channel. Every person, record
	// and channel is invented, and each channel takes a Lucide icon.
	const zone = 'Europe/London';
	const now = new Date('2026-11-18T15:00:00Z');
	const at = (day: number, hm: string) => new Date(`2026-11-${day}T${hm}:00Z`);
	const support = { name: 'Support', address: 'support@example.com' };
	const ana = { name: 'Ana Turner', address: 'ana.turner@example.org' };
	const web = { channel: 'Web chat', channelIcon: MessageCircleIcon };
	const sms = { channel: 'SMS', channelIcon: MessageSquareTextIcon };
	const mails: Mail[] = [
		{ id: 'm1', direction: 'in', channel: 'Mail · Support', channelIcon: MailIcon, from: ana, to: [support], at: at(17, '09:40'), body: ['The photos of the box are below.'] },
		{ id: 'm2', direction: 'in', channel: 'Mail · Support', channelIcon: MailIcon, from: ana, to: [support], at: at(18, '14:10'), body: ['The new cup came today. Thank you for the quick help.'] }
	];
	const messages: ChatMessage[] = [
		{ id: 's1', at: at(17, '09:02'), from: { name: 'Ana Turner' }, body: ['Hello, my order 4411 did not arrive.'], ...web },
		{ id: 's2', at: at(17, '09:03'), from: { name: 'Ana Turner' }, body: ['It was due on Friday.'], ...web },
		{ id: 's3', at: at(17, '09:05'), from: { name: 'Ana Turner' }, body: ['I sent the same question by text.'], ...sms },
		{ id: 's4', at: at(17, '09:12'), from: { name: 'Riley Shaw' }, own: true, body: ['Hello Ana, I am checking the order now.'], ...web, steps: [{ state: 'sent', at: at(17, '09:12') }, { state: 'delivered', at: at(17, '09:12') }, { state: 'seen', at: at(17, '09:14') }] },
		{ id: 's5', at: at(18, '10:20'), from: { name: 'Morgan Gray' }, body: ['Morgan here, a new cup goes out today.'], ...sms, steps: [{ state: 'sent', at: at(18, '10:20') }, { state: 'delivered', at: at(18, '10:21') }] },
		{ id: 's6', at: at(18, '10:30'), from: { name: 'Riley Shaw' }, own: true, body: ['Sorry about the cup.'], ...web, failed: 'The service did not answer.' }
	];
	const events: ActivityLine[] = [{ id: 'e1', at: at(17, '09:10'), text: 'Riley Shaw took the conversation', icon: UserIcon }, { id: 'e2', at: at(18, '14:30'), text: 'Riley Shaw set the status to Done', icon: CircleCheckIcon }];
	const comments: CommentData[] = [{ id: 'c1', author: { name: 'Morgan Gray' }, at: at(18, '10:15'), html: '<p>The cup broke in the parcel. I asked the depot.</p>' }];
</script>

<section id="showcase-conversation" data-showcase="conversation" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">conversation</h2>
	<div class="flex max-w-3xl flex-col gap-10">
		<Conversation {mails} {messages} {events} {comments} {now} timeZone={zone} headingLevel={3} onretry={() => {}} note="Comments and changes stand in their place." />
		<Conversation messages={messages.filter((m) => m.channel === 'Web chat')} {now} timeZone={zone} headingLevel={3} label="Web chat" showChannel={false} />
	</div>
</section>
