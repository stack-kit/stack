<script lang="ts">
	import HtmlFrame from '#lib/stack/HtmlFrame.svelte';

	// HTML that the product did not write in the frame. The sample is the HTML part of a mail, as its
	// sender designed it. A product serves each page from the host of the content that it did not
	// write, at a signed address. The preview has no such host, so the two frames load sample pages of
	// its own origin (src/routes/frames/). The first page holds the height script, so the frame takes
	// the height of the page. The second page holds no script, so the frame keeps its fixed height, and
	// the page scrolls inside it. Every name in the mail is invented.
</script>

<section id="showcase-html-frame" data-showcase="html-frame" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">html-frame</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		HTML that the product did not write, in a sandboxed frame. The sample is the HTML part of a mail, as its sender designed it. A product serves
		each page from its content host, and the preview serves two sample pages from its own origin. With the height script, the frame takes the
		height of the page. With no script, the frame keeps its fixed height of 320 px, and the page scrolls inside it.
	</p>

	<h3 class="text-xs font-medium text-muted-foreground">With the height script</h3>
	<div class="max-w-180">
		<HtmlFrame src="/frames/designed.html" title="The sample mail of Larkfield Ceramics, as the sender designed it, with the height script" />
	</div>

	<h3 class="text-xs font-medium text-muted-foreground">With no script: the fixed height</h3>
	<div class="max-w-180">
		<HtmlFrame src="/frames/no-script.html" title="The sample mail of Larkfield Ceramics, as the sender designed it, with no script" />
	</div>
</section>
