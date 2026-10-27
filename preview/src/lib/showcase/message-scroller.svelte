<script lang="ts">
	import * as MessageScroller from '#lib/components/ui/message-scroller/index.js';
	import * as Message from '#lib/components/ui/message/index.js';
	import * as Bubble from '#lib/components/ui/bubble/index.js';

	const turns = Array.from({ length: 12 }, (_, i) => ({
		id: `turn-${i + 1}`,
		mine: i % 2 === 1,
		text: `Message ${i + 1} of a transcript that is taller than the scroller.`
	}));
</script>

<section id="showcase-message-scroller" data-showcase="message-scroller" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">message-scroller</h2>
	<div class="h-72 max-w-lg rounded-lg border border-border">
		<MessageScroller.Provider defaultScrollPosition="start">
			<MessageScroller.Root>
				<MessageScroller.Viewport class="p-3">
					<MessageScroller.Content>
						{#each turns as t (t.id)}
							<MessageScroller.Item messageId={t.id}>
								<Message.Root align={t.mine ? 'end' : 'start'}>
									<Message.Content>
										<Bubble.Root variant={t.mine ? 'default' : 'secondary'}><Bubble.Content>{t.text}</Bubble.Content></Bubble.Root>
									</Message.Content>
								</Message.Root>
							</MessageScroller.Item>
						{/each}
					</MessageScroller.Content>
				</MessageScroller.Viewport>
				<MessageScroller.Button />
			</MessageScroller.Root>
		</MessageScroller.Provider>
	</div>
</section>
