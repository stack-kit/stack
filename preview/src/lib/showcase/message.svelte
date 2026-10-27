<script lang="ts">
	import * as Message from '#lib/components/ui/message/index.js';
	import * as Bubble from '#lib/components/ui/bubble/index.js';
	import * as Avatar from '#lib/components/ui/avatar/index.js';
</script>

<section id="showcase-message" data-showcase="message" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">message</h2>
	<Message.Group class="max-w-lg">
		<Message.Root>
			<Message.Avatar><Avatar.Root size="sm"><Avatar.Fallback>AN</Avatar.Fallback></Avatar.Root></Message.Avatar>
			<Message.Content>
				<Message.Header>Ana, 10:02</Message.Header>
				<Bubble.Root variant="secondary"><Bubble.Content>Align start, with an avatar, a header and a footer.</Bubble.Content></Bubble.Root>
				<Message.Footer>Read</Message.Footer>
			</Message.Content>
		</Message.Root>
		<Message.Root align="end">
			<Message.Content>
				<Bubble.Root><Bubble.Content>Align end, with no avatar.</Bubble.Content></Bubble.Root>
				<Message.Footer>Sent</Message.Footer>
			</Message.Content>
		</Message.Root>
		<Message.Root>
			<Message.Content>
				<Message.Header>Assistant</Message.Header>
				<Bubble.Root variant="ghost"><Bubble.Content>A ghost bubble: the header and footer lose their inset.</Bubble.Content></Bubble.Root>
				<Message.Footer>Just now</Message.Footer>
			</Message.Content>
		</Message.Root>
	</Message.Group>
</section>
