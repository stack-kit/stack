<script lang="ts">
	import CommentBox from '#lib/stack/CommentBox.svelte';
	import CommentItem, { type CommentData } from '#lib/stack/CommentItem.svelte';
	import CommentList, { type ActivityLine } from '#lib/stack/CommentList.svelte';
	import type { OnFailure } from '#lib/stack/rich-text.js';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleDashedIcon from '@lucide/svelte/icons/circle-dashed';
	import PaperclipIcon from '@lucide/svelte/icons/paperclip';
	import UserIcon from '@lucide/svelte/icons/user';

	// The comments of a form that came in, which only the team sees: the section stands in one internal
	// mark, the comments come oldest first, and the activity lines stand between them by their time. A
	// stretch of ten lines folds to its last three. The person is Morgan Lee, who may edit the own comments,
	// and the box at the end adds a comment. Under it, one comment among content that goes out, such as
	// the mails of a thread, stands in its own mark. Every person and record is invented.
	const ZONE = 'Europe/Belgrade';
	const now = new Date('2026-11-18T14:20:00+01:00');
	const at = (s: string) => new Date(`${s}+01:00`);

	let comments = $state<CommentData[]>([
		{
			id: 'c1',
			author: { name: 'Riley Shaw' },
			at: at('2026-11-17T09:12:00'),
			html: '<div>The address in the form does not match the order. I asked the customer to confirm it.</div>'
		},
		{
			id: 'c2',
			author: { name: 'Morgan Lee' },
			at: at('2026-11-18T10:02:00'),
			editedAt: at('2026-11-18T10:05:00'),
			editable: true,
			html: '<div>The customer confirmed the <b>new address</b>. I updated the order.</div>'
		}
	]);
	// A change of status takes the icon of the new status: each status has its own icon.
	const STATUS_ICONS = { Open: CircleIcon, Waiting: CircleDashedIcon } as const;
	const status = (n: number, word: keyof typeof STATUS_ICONS): ActivityLine => ({ id: `s${n}`, at: at(`2026-11-17T10:${String(n * 5).padStart(2, '0')}:00`), text: `Riley Shaw set the status to ${word}`, icon: STATUS_ICONS[word] });
	const activity: ActivityLine[] = [
		{ id: 'a0', at: at('2026-11-17T08:40:00'), text: 'The form came in from Jordan Hale', icon: PaperclipIcon },
		{ id: 'a1', at: at('2026-11-17T09:00:00'), text: 'Riley Shaw took the form', icon: UserIcon },
		...(['Open', 'Waiting', 'Open', 'Waiting', 'Open', 'Waiting', 'Open', 'Waiting', 'Open', 'Waiting'] as const).map((word, i) => status(i + 1, word)),
		{ id: 'a2', at: at('2026-11-18T10:10:00'), text: 'Morgan Lee set the status to Done', icon: CircleCheckIcon }
	];

	const store = (html: string) =>
		new Promise<void>((resolve) =>
			setTimeout(() => {
				comments = [...comments, { id: `c${comments.length + 1}`, author: { name: 'Morgan Lee' }, at: new Date(now), html, editable: true }];
				resolve();
			}, 500)
		);
	const edit = (comment: CommentData, html: string) =>
		new Promise<void>((resolve) =>
			setTimeout(() => {
				comments = comments.map((c) => (c.id === comment.id ? { ...c, html, editedAt: new Date(now) } : c));
				resolve();
			}, 500)
		);
	const onfailure: OnFailure = (f) => (f.kind === 'save' ? 'The comment is not saved. Try again.' : undefined);
	let dirty = $state(false);

	const single: CommentData = {
		id: 'c9',
		author: { name: 'Riley Shaw' },
		at: at('2026-11-18T11:30:00'),
		html: '<div>Wait for the photo of the box before you send the refund.</div>'
	};
</script>

<section id="showcase-comment-list" data-showcase="comment-list" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">comment-list</h2>
	<div class="flex max-w-3xl flex-col gap-10 pt-2">
		<CommentList {comments} {activity} {now} timeZone={ZONE} internal onedit={edit} {onfailure} bind:dirty>
			<CommentBox onsend={store} limit={2000} caretKeys={[]} aria-label="Comment on the form" {onfailure} />
		</CommentList>
		<p class="text-xs text-muted-foreground">dirty: {dirty}</p>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-semibold text-muted-foreground">One comment among content that goes out</h3>
			<CommentItem comment={single} {now} timeZone={ZONE} internal />
		</div>
		<CommentList comments={[]} {now} timeZone={ZONE} label="Notes" />
	</div>
</section>
