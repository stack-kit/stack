<script lang="ts">
	import * as Command from '#lib/components/ui/command/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { forcedOpen } from '#lib/stack/view.svelte.js';
	import { cn } from '#lib/utils.js';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';

	// The time-zone-field definition of DESIGN.md: a command in a popover. A fixed reference date,
	// so that every render and every measurement shows the same offsets.
	const locale = 'en-GB';
	const reference = new Date('2026-10-23T12:00:00Z');

	// The names that the list of Chromium 148 holds from the section "Alternate names for the same
	// location" of the IANA file backward (tzdb 2026e), each with its current name.
	const renamed: Record<string, string> = {
		'Africa/Asmera': 'Africa/Asmara',
		'America/Godthab': 'America/Nuuk',
		'Asia/Calcutta': 'Asia/Kolkata',
		'Asia/Katmandu': 'Asia/Kathmandu',
		'Asia/Rangoon': 'Asia/Yangon',
		'Asia/Saigon': 'Asia/Ho_Chi_Minh',
		'Atlantic/Faeroe': 'Atlantic/Faroe',
		'Europe/Kiev': 'Europe/Kyiv',
		'Pacific/Ponape': 'Pacific/Pohnpei',
		'Pacific/Truk': 'Pacific/Chuuk'
	};

	const oldName = Object.fromEntries(Object.entries(renamed).map(([old, current]) => [current, old]));
	// A name that the field did not pick, a stored one or the zone of the browser, goes through the
	// map first: Intl accepts Asia/Kolkata, but resolvedOptions().timeZone still returns Asia/Calcutta.
	const currentName = (id: string) => renamed[id] ?? id;
	const workspace = currentName('Europe/Belgrade');
	const city = (id: string) => id.split('/').pop()!.replaceAll('_', ' ');

	type Zone = { id: string; name: string; keywords: string[]; offset: string };

	function zonesOn(date: Date): Zone[] {
		// The list of the browser lacks UTC, so the field puts it first.
		const listed = new Set(Intl.supportedValuesOf('timeZone').map(currentName));
		listed.delete('UTC');
		return ['UTC', ...[...listed].sort(new Intl.Collator(locale).compare)].map((id) => {
			const offset = new Intl.DateTimeFormat(locale, { timeZone: id, timeZoneName: 'shortOffset' })
				.formatToParts(date)
				.find((p) => p.type === 'timeZoneName')!.value;
			// The search finds a zone by its name, its city and the old name of its city.
			const keywords = oldName[id] ? [city(id), city(oldName[id])] : [city(id)];
			return { id, name: id.replaceAll('_', ' '), keywords, offset };
		});
	}
	const zones = zonesOn(reference);
	const byId = new Map(zones.map((z) => [z.id, z]));
	const day = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(reference);

	type State = { label: string; value?: string; open: boolean; disabled?: boolean; invalid?: boolean; openId?: string };
	const states: State[] = $state([
		{ label: 'the zone of the workspace', value: workspace, open: false },
		{ label: 'open, with a chosen zone', value: 'America/New_York', open: forcedOpen('time-zone-field'), openId: 'time-zone-field' },
		{ label: 'a stored old name, Asia/Calcutta', value: currentName('Asia/Calcutta'), open: false },
		{ label: 'empty', open: false },
		{ label: 'disabled', value: workspace, open: false, disabled: true },
		{ label: 'invalid', open: false, invalid: true }
	]);
</script>

{#snippet item(zone: Zone, s: State)}
	<Command.Item
		value={zone.id}
		keywords={zone.keywords}
		data-checked={zone.id === s.value}
		onSelect={() => {
			s.value = zone.id;
			s.open = false;
		}}
	>
		<span class="flex-1 truncate">{zone.name}</span>
		<span class="text-muted-foreground tabular-nums group-data-selected/command-item:text-foreground">{zone.offset}</span>
	</Command.Item>
{/snippet}

{#snippet field(s: State, i: number)}
	{@const chosen = s.value ? byId.get(s.value) : undefined}
	<Field.Field data-invalid={s.invalid}>
		<Field.Label id="showcase-time-zone-label-{i}" for="showcase-time-zone-{i}">Time zone</Field.Label>
		<Popover.Root bind:open={s.open}>
			<Popover.Trigger
				id="showcase-time-zone-{i}"
				aria-labelledby="showcase-time-zone-label-{i} showcase-time-zone-{i}"
				class={cn(buttonVariants({ variant: 'outline' }), 'w-full border-input font-normal')}
				disabled={s.disabled}
				aria-invalid={s.invalid}
				aria-describedby={s.invalid ? `showcase-time-zone-description-${i} showcase-time-zone-error-${i}` : `showcase-time-zone-description-${i}`}
				data-open-id={s.openId}
			>
				{#if chosen}
					<span class="truncate">{chosen.name}</span>
					<span class="ml-auto text-muted-foreground tabular-nums">{chosen.offset}</span>
				{:else}
					<span class="mr-auto text-muted-foreground">Choose a time zone</span>
				{/if}
				<ChevronsUpDownIcon class="text-muted-foreground" />
			</Popover.Trigger>
			<Popover.Content align="start" class="p-0" role="dialog" aria-label="Choose a time zone">
				<Command.Root value={s.value}>
					<Command.Input placeholder="Search by zone or city" />
					<Command.List>
						<Command.Empty>No time zone matches.</Command.Empty>
						<Command.Group heading="Workspace">{@render item(byId.get(workspace)!, s)}</Command.Group>
						<Command.Group heading="All time zones">
							{#each zones as zone (zone.id)}
								{#if zone.id !== workspace}{@render item(zone, s)}{/if}
							{/each}
						</Command.Group>
					</Command.List>
					<p class="border-t border-border px-2 py-1.5 text-xs text-muted-foreground">Offsets on {day}</p>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
		<Field.Description id="showcase-time-zone-description-{i}">{s.label}</Field.Description>
		{#if s.invalid}<Field.Error id="showcase-time-zone-error-{i}">Choose the time zone of the schedule.</Field.Error>{/if}
	</Field.Field>
{/snippet}

<section id="showcase-time-zone-field" data-showcase="time-zone-field" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">time-zone-field</h2>
	<div class="grid max-w-3xl gap-6 sm:grid-cols-2">
		{#each states as s, i (s.label)}
			{@render field(s, i)}
		{/each}
	</div>
</section>
