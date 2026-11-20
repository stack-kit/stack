<script lang="ts">
	import * as Message from '#lib/components/ui/message/index.js';
	import * as Bubble from '#lib/components/ui/bubble/index.js';
	import * as Avatar from '#lib/components/ui/avatar/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import SendState, { type SendStep } from '#lib/stack/SendState.svelte';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';

	// The messages of the team in a chat with a customer. Each footer shows the furthest step that the
	// service reported: Sent, Delivered or Seen. The steps of the second message came out of order, and a
	// service that reports no delivery gives sent and seen only. A message that failed shows its failure
	// line and no send state. Every person and record is invented.
	const zone = 'Europe/London';
	const now = new Date('2026-11-18T12:00:00Z');
	const at = (hm: string) => new Date(`2026-11-18T${hm}:00Z`);
	const sent: SendStep[] = [{ state: 'sent', at: at('10:02') }];
	const seen: SendStep[] = [
		{ state: 'seen', at: at('10:31') },
		{ state: 'sent', at: at('10:02') },
		{ state: 'delivered', at: at('10:03') }
	];
	const noDelivery: SendStep[] = [
		{ state: 'sent', at: at('11:15') },
		{ state: 'seen', at: at('11:40') }
	];
	const delivered: SendStep[] = [
		{ state: 'sent', at: at('11:50') },
		{ state: 'delivered', at: at('11:51') }
	];
</script>

<section id="showcase-send-state" data-showcase="send-state" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">send-state</h2>
	<Message.Group class="max-w-lg">
		<Message.Root align="end">
			<Message.Content>
				<Message.Header>Riley Shaw, 10:02</Message.Header>
				<Bubble.Root><Bubble.Content>The courier collects the parcel this afternoon.</Bubble.Content></Bubble.Root>
				<Message.Footer><SendState steps={seen} {now} timeZone={zone} /></Message.Footer>
			</Message.Content>
		</Message.Root>
		<Message.Root align="end">
			<Message.Content>
				<Message.Header>Riley Shaw, 11:15</Message.Header>
				<Bubble.Root><Bubble.Content>This service reports no delivery, so the list holds two steps.</Bubble.Content></Bubble.Root>
				<Message.Footer><SendState steps={noDelivery} {now} timeZone={zone} /></Message.Footer>
			</Message.Content>
		</Message.Root>
		<Message.Root>
			<Message.Avatar><Avatar.Root size="sm"><Avatar.Fallback>MG</Avatar.Fallback></Avatar.Root></Message.Avatar>
			<Message.Content>
				<Message.Header>Morgan Gray, 11:50</Message.Header>
				<Bubble.Root variant="secondary"><Bubble.Content>A reply of another member of the team, at the start.</Bubble.Content></Bubble.Root>
				<Message.Footer><SendState steps={delivered} {now} timeZone={zone} /></Message.Footer>
			</Message.Content>
		</Message.Root>
		<Message.Root align="end">
			<Message.Content>
				<Message.Header>Riley Shaw, 10:02</Message.Header>
				<Bubble.Root><Bubble.Content>Only the step Sent so far.</Bubble.Content></Bubble.Root>
				<Message.Footer><SendState steps={sent} {now} timeZone={zone} /></Message.Footer>
			</Message.Content>
		</Message.Root>
		<Message.Root align="end">
			<Message.Content>
				<Message.Header>Riley Shaw, 11:58</Message.Header>
				<Bubble.Root><Bubble.Content>A message that failed shows no send state.</Bubble.Content></Bubble.Root>
				<Message.Footer class="gap-2 text-destructive">
					<CircleAlertIcon class="size-3.5" />Not sent.
					<Button variant="outline" size="xs">Retry</Button>
				</Message.Footer>
			</Message.Content>
		</Message.Root>
	</Message.Group>
</section>
