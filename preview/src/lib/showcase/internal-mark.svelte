<script lang="ts">
	import InternalMark from '#lib/stack/InternalMark.svelte';

	// Content that stays inside the team: a note on a case, and a summary from a service of the product that
	// no person confirmed yet. Every person and record is invented.
</script>

<section id="showcase-internal-mark" data-showcase="internal-mark" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">internal-mark</h2>
	<div class="flex max-w-3xl flex-col gap-8 pt-2 text-sm">
		<InternalMark>
			<p>The customer asked twice about the second unit. Call before Thursday, and offer the free delivery.</p>
		</InternalMark>
		<InternalMark proposal="Summary by Mail agent">
			<p>The customer wants a refund for two broken cups of order 8841 and attached a photo of the box.</p>
		</InternalMark>
	</div>
</section>
