<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import CommentBox from '#lib/stack/CommentBox.svelte';
	import RichTextField from '#lib/stack/RichTextField.svelte';
	import type { OnFailure } from '#lib/stack/rich-text.js';
	import LockIcon from '@lucide/svelte/icons/lock';
	import ReplyIcon from '@lucide/svelte/icons/reply';

	// The end of a mail thread: a reply and a comment share one place as two tabs. Each panel stays in the
	// page, so each keeps its text, and the send of each panel is its one primary action. C puts the caret
	// in the comment from anywhere on this page outside a text field: the box shows its tab first. Under it,
	// a box with a limit of 140 characters and a send that can fail, beside the primary action of its view,
	// so its send is outline. Every person and record is invented.
	let tab = $state('reply');
	let failNext = $state(false);
	let sent = $state<string[]>([]);
	let dirty = $state(false);

	const store = (_html: string, words: string) =>
		new Promise<void>((resolve, reject) =>
			setTimeout(() => {
				if (failNext) {
					failNext = false;
					return reject(new Error('The server did not answer.'));
				}
				sent = [...sent, words];
				resolve();
			}, 600)
		);
	const onfailure: OnFailure = (f) => (f.kind === 'save' ? 'The comment did not go in. Press Comment to try again.' : undefined);
</script>

<section id="showcase-comment-box" data-showcase="comment-box" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">comment-box</h2>
	<div class="flex max-w-3xl flex-col gap-10 pt-2 text-sm">
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-semibold text-muted-foreground">A reply and a comment at the end of a thread</h3>
			<Tabs.Root bind:value={tab}>
				<Tabs.List aria-label="Answer">
					<Tabs.Trigger value="reply" class="text-muted-foreground"><ReplyIcon data-icon="inline-start" />Reply · goes out</Tabs.Trigger>
					<Tabs.Trigger value="comment" class="text-muted-foreground"><LockIcon data-icon="inline-start" />Comment · internal</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="reply" class="flex flex-col gap-1.5">
					<RichTextField aria-label="Reply to Ana Turner" placeholder="Write the reply" />
					<Button size="sm" class="self-end">Reply</Button>
				</Tabs.Content>
				<Tabs.Content value="comment">
					<CommentBox internal primary onsend={store} {onfailure} onreveal={() => (tab = 'comment')} bind:dirty />
				</Tabs.Content>
			</Tabs.Root>
		</div>
		<div class="flex flex-col gap-2">
			<h3 id="showcase-comment-box-limit" class="text-xs font-semibold text-muted-foreground">A limit of 140 characters, beside the primary action of the view</h3>
			<CommentBox limit={140} caretKeys={[]} aria-labelledby="showcase-comment-box-limit" onsend={store} {onfailure} />
			<div class="flex items-center gap-2 text-xs text-muted-foreground">
				<Switch id="showcase-comment-box-fail" bind:checked={failNext} />
				<label for="showcase-comment-box-fail">The next send fails</label>
				<span class="ml-auto">dirty of the tab: {dirty} · sent: {sent.length}</span>
			</div>
		</div>
	</div>
</section>
