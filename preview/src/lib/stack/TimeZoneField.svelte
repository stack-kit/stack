<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type TimeZoneFieldProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The root element, the field that holds the label, the trigger, the description and the error. */
		ref?: HTMLDivElement | null;
		/** The IANA name of the zone, such as "Europe/Belgrade". The field writes the current name of a renamed zone. */
		value?: string;
		/** The name of the field. "Time zone" by default. */
		label?: string;
		/** The locale of the product: the order of the list and the form of the offsets, such as GMT+2. */
		locale: string;
		/** The zone of the workspace, which the list shows first, in a group of its own. */
		workspace?: string;
		/** The date of the offsets, such as the first run of a schedule. Today by default. */
		date?: Date;
		/** The line under the trigger. */
		description?: string;
		/** The error under the trigger, such as "Choose the time zone of the schedule." */
		error?: string;
		disabled?: boolean;
		/** True while the list shows. */
		open?: boolean;
		/** Called with the current name of the zone that the person picks. */
		onValueChange?: (zone: string) => void;
	};

	/**
	 * The zones that the list of the browser holds by an old name, from the section "Alternate names
	 * for the same location" of the IANA file backward (tzdb 2026e), each with its current name.
	 */
	const RENAMED: Readonly<Record<string, string>> = {
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
	const OLD_NAME: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(RENAMED).map(([old, current]) => [current, old]));

	/**
	 * The current name of a zone, such as Asia/Kolkata for Asia/Calcutta. Intl accepts the current
	 * name, but resolvedOptions().timeZone still returns the old one. So give it each name that the
	 * field did not pick, a stored one or the zone of the browser, before a compare or a store.
	 */
	export function currentZone(id: string): string {
		return RENAMED[id] ?? id;
	}
</script>

<script lang="ts">
	import * as Command from '#lib/components/ui/command/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { cn } from '#lib/utils.js';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';

	// The time zone field of DESIGN.md (### time-zone-field): a command in a popover, because the
	// list holds more than 400 zones and the person searches it. The list comes from Intl, with UTC
	// first and the current name of each renamed zone. Each offset is the offset on one date, because
	// daylight saving time changes it. The search finds a zone by its name, its city and the old name
	// of its city.
	let {
		value = $bindable(),
		label = 'Time zone',
		locale,
		workspace,
		date,
		description,
		error,
		disabled = false,
		open = $bindable(false),
		onValueChange,
		ref = $bindable(null),
		class: className,
		...rest
	}: TimeZoneFieldProps = $props();

	const uid = $props.id();
	const labelId = `${uid}-label`;
	const triggerId = `${uid}-trigger`;
	const descriptionId = `${uid}-description`;
	const errorId = `${uid}-error`;
	const describedBy = $derived([description && descriptionId, error && errorId].filter(Boolean).join(' ') || undefined);

	type Zone = { id: string; name: string; keywords: string[]; offset: string };
	const on = $derived(date ?? new Date());
	const city = (id: string) => (id.split('/').pop() ?? id).replaceAll('_', ' ');
	/** The offset in the form of the locale, such as GMT+2. A name that Intl does not know has none. */
	function offsetOf(id: string): string {
		try {
			return new Intl.DateTimeFormat(locale, { timeZone: id, timeZoneName: 'shortOffset' }).formatToParts(on).find((p) => p.type === 'timeZoneName')?.value ?? '';
		} catch {
			return '';
		}
	}
	function zoneOf(id: string): Zone {
		const old = OLD_NAME[id];
		return { id, name: id.replaceAll('_', ' '), keywords: old ? [city(id), city(old)] : [city(id)], offset: offsetOf(id) };
	}
	// The list of the browser lacks UTC, so the field puts it first. Only the open list reads it.
	const zones = $derived.by(() => {
		const listed = new Set(Intl.supportedValuesOf('timeZone').map(currentZone));
		listed.delete('UTC');
		return ['UTC', ...[...listed].sort(new Intl.Collator(locale).compare)].map(zoneOf);
	});
	const chosen = $derived(value ? zoneOf(currentZone(value)) : undefined);
	const home = $derived(workspace ? zoneOf(currentZone(workspace)) : undefined);
	const day = $derived(new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(on));

	function pick(id: string) {
		value = id;
		open = false;
		onValueChange?.(id);
	}
</script>

{#snippet row(zone: Zone)}
	<Command.Item value={zone.id} keywords={zone.keywords} data-checked={zone.id === chosen?.id} onSelect={() => pick(zone.id)}>
		<span class="flex-1 truncate">{zone.name}</span>
		<span class="text-muted-foreground tabular-nums group-data-selected/command-item:text-foreground">{zone.offset}</span>
	</Command.Item>
{/snippet}

<Field.Field bind:ref data-slot="time-zone-field" data-invalid={!!error} class={cn(className)} {...rest}>
	<Field.Label id={labelId} for={triggerId}>{label}</Field.Label>
	<Popover.Root bind:open>
		<Popover.Trigger
			id={triggerId}
			aria-labelledby="{labelId} {triggerId}"
			class={cn(buttonVariants({ variant: 'outline' }), 'w-full border-input font-normal')}
			{disabled}
			aria-invalid={error ? true : undefined}
			aria-describedby={describedBy}
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
			<Command.Root value={chosen?.id ?? ''}>
				<Command.Input placeholder="Search by zone or city" />
				<Command.List>
					<Command.Empty>No time zone matches.</Command.Empty>
					{#if home}<Command.Group heading="Workspace">{@render row(home)}</Command.Group>{/if}
					<Command.Group heading="All time zones">
						{#each zones as zone (zone.id)}
							{#if zone.id !== home?.id}{@render row(zone)}{/if}
						{/each}
					</Command.Group>
				</Command.List>
				<p class="border-t border-border px-2 py-1.5 text-xs text-muted-foreground">Offsets on {day}</p>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
	{#if description}<Field.Description id={descriptionId}>{description}</Field.Description>{/if}
	{#if error}<Field.Error id={errorId}>{error}</Field.Error>{/if}
</Field.Field>
