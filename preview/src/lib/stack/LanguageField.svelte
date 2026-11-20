<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	/** The words of the field, in the language of the product. */
	export type LanguageFieldWords = {
		/** The trigger with no language. */
		placeholder: string;
		/** The name of the list for a screen reader. */
		dialog: string;
		/** The placeholder of the search. */
		search: string;
		/** The line of a search with no match. */
		empty: string;
		/** The heading of the group of suggested. */
		suggested: string;
		/** The heading of every other language. */
		all: string;
	};

	export type LanguageFieldProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
		/** The root element, the field that holds the label, the trigger, the description and the error. */
		ref?: HTMLDivElement | null;
		/** The BCP 47 tag of the language, such as "de" or "pt-BR". The field writes the canonical form of the tag that the person picks. */
		value?: string | undefined;
		/** The name of the field, such as "Reply language". "Language" by default. */
		label?: string | undefined;
		/** The locale of the product: the names of the languages and the order of the list. */
		locale: string;
		/** The tags of the languages that a person can pick, such as the languages that the product writes in. */
		languages: readonly string[];
		/** The tags that the list shows first, in a group of their own and in this order, such as the language of the team and the language of the customer. Each must also be in languages. */
		suggested?: readonly string[] | undefined;
		/** The line under the trigger. */
		description?: string | undefined;
		/** The error under the trigger, such as "Choose the language of the reply." */
		error?: string | undefined;
		disabled?: boolean | undefined;
		/** True while the list shows. */
		open?: boolean | undefined;
		/** Called with the tag of the language that the person picks. */
		onValueChange?: ((tag: string) => void) | undefined;
		words?: Partial<LanguageFieldWords> | undefined;
	};

	/** The words of the field in English, which the words of the product replace one by one. */
	export const LANGUAGE_FIELD_WORDS: LanguageFieldWords = {
		placeholder: 'Choose a language',
		dialog: 'Choose a language',
		search: 'Search by name',
		empty: 'No language matches.',
		suggested: 'Suggested',
		all: 'All languages'
	};

	/** The scripts that write from right to left, by their ISO 15924 code. Aran is the Nastaliq form of Arabic, as in ur-Aran. */
	const RIGHT_TO_LEFT = new Set(['Adlm', 'Aran', 'Arab', 'Hebr', 'Mand', 'Mend', 'Nkoo', 'Rohg', 'Samr', 'Syrc', 'Thaa', 'Yezi']);

	/** The canonical form of a tag, such as en-GB for en-gb and he for iw. A tag that Intl refuses stays as it is. */
	function canonical(tag: string): string {
		try {
			return Intl.getCanonicalLocales(tag)[0] ?? tag;
		} catch {
			return tag;
		}
	}

	/** The words with a capital first letter in the locale, as a list and a menu show a name. A script with no case keeps them. */
	function capital(words: string, locale: string): string {
		const [first = '', ...more] = words;
		try {
			return first.toLocaleUpperCase(locale) + more.join('');
		} catch {
			return first.toUpperCase() + more.join('');
		}
	}

	/** The name of the tag in the locale through names, or the tag itself when Intl does not know it. */
	function nameIn(names: Intl.DisplayNames | null, tag: string, locale: string): string {
		try {
			const name = names?.of(tag);
			return name ? capital(name, locale) : tag;
		} catch {
			return tag;
		}
	}

	/** The names of the locale, or null for a locale that Intl refuses. */
	function namesOf(locale: string): Intl.DisplayNames | null {
		try {
			// With no name, of() gives undefined and not the tag, so that the field does not start a tag with a capital.
			return new Intl.DisplayNames(locale, { type: 'language', fallback: 'none' });
		} catch {
			return null;
		}
	}

	/**
	 * The name of a language as the field shows it, in the locale of the product, with a capital first letter,
	 * such as German for "de" in "en-GB" and Allemand in "fr". A product names the language with it
	 * outside the field, such as in the label of a text or in the summary of a send, so that each place names a
	 * tag in the same words. A tag that Intl does not know gives the tag itself.
	 */
	export function languageName(tag: string, locale: string): string {
		return nameIn(namesOf(locale), canonical(tag), locale);
	}

	/**
	 * The direction of the text of a language: rtl for a language whose likely script writes from right to
	 * left, such as Arabic, Hebrew, Persian and Urdu, ltr for a script that writes from left to right, and auto
	 * for und, the tag of a language that the product does not know, and for a tag whose script Intl does
	 * not know. Give it to the dir of a field or an element of the text.
	 */
	export function languageDirection(tag: string): 'ltr' | 'rtl' | 'auto' {
		try {
			const locale = new Intl.Locale(tag);
			// Intl gives und no language, or und, and maximize() would give it Latn, the likely script of English.
			if ((!locale.language || locale.language === 'und') && !locale.script) return 'auto';
			const script = locale.maximize().script;
			if (!script) return 'auto';
			return RIGHT_TO_LEFT.has(script) ? 'rtl' : 'ltr';
		} catch {
			return 'auto';
		}
	}

	/**
	 * The fold of "Sorting and search" in architecture/web-app.md: no accents of U+0300 to U+036F and no
	 * marks of Arabic and Hebrew, lower case, then ß, ł, ø and the d with a stroke (U+0111, written as
	 * 0x111), which NFD does not split. So "francais" finds Français.
	 */
	function fold(words: string): string {
		return words
			.normalize('NFD')
			.replace(/[\u0300-\u036f]|(?=[\p{scx=Arabic}\p{scx=Hebrew}])\p{M}/gu, '')
			.toLowerCase()
			.replace(/ß/g, 'ss')
			.replace(/ł/g, 'l')
			.replace(/ø/g, 'o')
			.replaceAll(String.fromCodePoint(0x111), 'd');
	}

	/** The name of the language in that language, such as Deutsch for "de", or null when Intl holds no such name. */
	function ownName(tag: string): string | null {
		try {
			const names = new Intl.DisplayNames(tag, { type: 'language' });
			// With no data for the language, Intl gives the name in its default locale.
			if (new Intl.Locale(names.resolvedOptions().locale).language !== new Intl.Locale(tag).language) return null;
			const own = names.of(tag);
			return own ? capital(own, tag) : null;
		} catch {
			return null;
		}
	}
</script>

<script lang="ts">
	import * as Command from '#lib/components/ui/command/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { cn } from '#lib/utils.js';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { computeCommandScore } from 'bits-ui';

	// The language field of DESIGN.md (### language-field): a command in a popover, as the time zone field,
	// because a list of languages holds more than seven options and the person searches it. The product
	// gives the tags. Each row shows the name of the language in the locale of the product and its name in
	// that language, with the lang and the dir of that language. The search finds a language by both names
	// and by its tag, and it ignores case and diacritics. The popover is fixed: Command.Root scrolls the
	// chosen row into view before the popover has its place, and with the absolute place of a popover that
	// scroll moves the page to its top, so the list then opens above the field.
	let {
		value = $bindable(),
		label = 'Language',
		locale,
		languages,
		suggested = [],
		description,
		error,
		disabled = false,
		open = $bindable(false),
		onValueChange,
		words,
		ref = $bindable(null),
		class: className,
		...rest
	}: LanguageFieldProps = $props();

	const uid = $props.id();
	const labelId = `${uid}-label`;
	const triggerId = `${uid}-trigger`;
	const descriptionId = `${uid}-description`;
	const errorId = `${uid}-error`;
	const describedBy = $derived([description && descriptionId, error && errorId].filter(Boolean).join(' ') || undefined);
	const w = $derived({ ...LANGUAGE_FIELD_WORDS, ...words });

	type Language = { tag: string; name: string; own: string | null; dir: 'ltr' | 'rtl' | 'auto' };
	const names = $derived(namesOf(locale));
	function languageOf(tag: string): Language {
		const t = canonical(tag);
		const name = nameIn(names, t, locale);
		const own = ownName(t);
		return { tag: t, name, own: own === name ? null : own, dir: languageDirection(t) };
	}
	const unique = (tags: readonly string[]) => [...new Set(tags.map(canonical))];
	// Only the open list reads them. A suggested tag that languages does not hold does not show.
	const tags = $derived(unique(languages));
	const first = $derived(unique(suggested).filter((t) => tags.includes(t)).map(languageOf));
	const others = $derived.by(() => {
		const shown = new Set(first.map((l) => l.tag));
		const collator = new Intl.Collator(locale);
		return tags
			.filter((t) => !shown.has(t))
			.map(languageOf)
			.sort((a, b) => collator.compare(a.name, b.name));
	});
	const chosen = $derived(value ? languageOf(value) : undefined);

	function pick(tag: string) {
		value = tag;
		open = false;
		onValueChange?.(tag);
	}
</script>

{#snippet row(language: Language)}
	<Command.Item value={language.tag} keywords={language.own ? [language.name, language.own] : [language.name]} data-checked={language.tag === chosen?.tag} onSelect={() => pick(language.tag)}>
		<span class="min-w-0 flex-1 overflow-x-clip text-ellipsis whitespace-nowrap">{language.name}</span>
		{#if language.own}
			<span lang={language.tag} dir={language.dir} class="min-w-0 max-w-1/2 overflow-x-clip text-ellipsis whitespace-nowrap text-muted-foreground group-data-selected/command-item:text-foreground">{language.own}</span>
		{/if}
	</Command.Item>
{/snippet}

<Field.Field bind:ref data-slot="language-field" data-invalid={!!error} class={cn(className)} {...rest}>
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
				<span class="mr-auto min-w-0 overflow-x-clip text-ellipsis whitespace-nowrap">{chosen.name}</span>
				{#if chosen.own}
					<span lang={chosen.tag} dir={chosen.dir} class="min-w-0 overflow-x-clip text-ellipsis whitespace-nowrap text-muted-foreground">{chosen.own}</span>
				{/if}
			{:else}
				<span class="mr-auto text-muted-foreground">{w.placeholder}</span>
			{/if}
			<ChevronsUpDownIcon class="text-muted-foreground" />
		</Popover.Trigger>
		<Popover.Content align="start" strategy="fixed" class="p-0" role="dialog" aria-label={w.dialog}>
			<Command.Root value={chosen?.tag ?? ''} vimBindings={false} filter={(v, s, k) => computeCommandScore(fold(v), fold(s), k?.map(fold))}>
				<Command.Input placeholder={w.search} />
				<Command.List>
					<Command.Empty>{w.empty}</Command.Empty>
					{#if first.length > 0}
						<Command.Group heading={w.suggested}>
							{#each first as language (language.tag)}{@render row(language)}{/each}
						</Command.Group>
					{/if}
					<Command.Group heading={w.all}>
						{#each others as language (language.tag)}{@render row(language)}{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
	{#if description}<Field.Description id={descriptionId}>{description}</Field.Description>{/if}
	{#if error}<Field.Error id={errorId}>{error}</Field.Error>{/if}
</Field.Field>
