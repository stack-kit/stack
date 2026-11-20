<script lang="ts">
	import ActivityLines, { type ActivityLine } from '#lib/stack/ActivityLines.svelte';
	import BanIcon from '@lucide/svelte/icons/ban';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleDashedIcon from '@lucide/svelte/icons/circle-dashed';
	import UserIcon from '@lucide/svelte/icons/user';
	import UserMinusIcon from '@lucide/svelte/icons/user-minus';

	// The events of a conversation of a shared inbox: a short stretch shows every line, and a stretch of
	// nine lines folds to its last three behind a button. A change of status takes the icon of the new
	// status. Every person and record is invented.
	const ZONE = 'Europe/Belgrade';
	const now = new Date('2026-11-18T14:20:00+01:00');
	const at = (s: string) => new Date(`${s}+01:00`);

	const short: ActivityLine[] = [
		{ id: 'a1', at: at('2026-11-18T09:05:00'), text: 'Riley Shaw took the conversation', icon: UserIcon },
		{ id: 'a2', at: at('2026-11-18T09:20:00'), text: 'Riley Shaw set the status to Waiting', icon: CircleDashedIcon },
		{ id: 'a3', at: at('2026-11-18T13:10:00'), text: 'Morgan Lee marked the conversation as done', icon: CircleCheckIcon }
	];
	const long: ActivityLine[] = [
		{ id: 'b1', at: at('2026-11-17T08:30:00'), text: 'Riley Shaw took the conversation', icon: UserIcon },
		{ id: 'b2', at: at('2026-11-17T08:45:00'), text: 'Riley Shaw set the status to Waiting', icon: CircleDashedIcon },
		{ id: 'b3', at: at('2026-11-17T10:00:00'), text: 'Riley Shaw released the conversation', icon: UserMinusIcon },
		{ id: 'b4', at: at('2026-11-17T10:20:00'), text: 'Morgan Lee took the conversation', icon: UserIcon },
		{ id: 'b5', at: at('2026-11-17T11:00:00'), text: 'Morgan Lee marked the conversation as spam', icon: BanIcon },
		{ id: 'b6', at: at('2026-11-17T11:02:00'), text: 'Morgan Lee set the status to Open', icon: CircleIcon },
		{ id: 'b7', at: at('2026-11-17T15:40:00'), text: 'Jordan Hale took over the conversation from Morgan Lee', icon: UserIcon },
		{ id: 'b8', at: at('2026-11-18T09:10:00'), text: 'Jordan Hale set the status to Waiting', icon: CircleDashedIcon },
		{ id: 'b9', at: at('2026-11-18T12:30:00'), text: 'Jordan Hale marked the conversation as done', icon: CircleCheckIcon }
	];
</script>

<section id="showcase-activity-lines" data-showcase="activity-lines" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">activity-lines</h2>
	<div class="flex max-w-3xl flex-col gap-8 pt-2 text-sm">
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-semibold text-muted-foreground">A stretch of three lines</h3>
			<ActivityLines lines={short} {now} timeZone={ZONE} />
		</div>
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-semibold text-muted-foreground">A stretch of nine lines, which folds to its last three</h3>
			<ActivityLines lines={long} {now} timeZone={ZONE} />
		</div>
	</div>
</section>
