<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import type { OutsideRoot } from './OutsidePage.svelte';

	export type ReadOnlyPageProps = OutsideRoot & {
		/** The state that the server found for the token. Expired and Not valid are the error page of a link page, and show no content. */
		initial: 'ready' | 'expired' | 'not-valid';
		/** The title of Ready, which names the content, such as "Visits in October 2026". */
		title: string;
		/** The last day of the link, as the product writes it in the language of the link, such as "31 October 2026". Ready and Expired name it. */
		until: string;
		/** More text after "Anyone with this link can see this page until", such as what the page does not show. */
		text?: string;
		/**
		 * The content, such as a table or a chart. Only Ready shows it.
		 * In Expired and Not valid, the product loads no content of the object and gives a `title` and a `text` that do not name it: the part draws none of it, and a server page sends its props to the browser.
		 */
		children: Snippet;
	};
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';
	import { NOT_VALID } from './LinkPage.svelte';
	import OutsidePage from './OutsidePage.svelte';

	// A read-only link: content and no action. The text says who can see the page and until when.
	// Its other states, Expired and Not valid, are those of the link page, with the same texts.
	let { product, initial, title, until, text, children, class: className, ref = $bindable(null), ...rest }: ReadOnlyPageProps = $props();

	const view = $derived(
		initial === 'ready'
			? { title, text: `Anyone with this link can see this page until ${until}.${text ? ` ${text}` : ''}` }
			: initial === 'expired'
				? { title: 'This link has expired', text: `This link worked until ${until}. Ask the person who sent it for a new link.` }
				: NOT_VALID
	);
</script>

<OutsidePage bind:ref {product} title={view.title} text={view.text} data-slot="read-only-page" class={cn(className)} {...rest}>
	{#if initial === 'ready'}
		{@render children()}
	{/if}
</OutsidePage>
