<script lang="ts">
	import HtmlFrame, { type FramePage } from '#lib/stack/HtmlFrame.svelte';

	// HTML that the product did not write in the frame. The sample is the HTML part of a mail, as its
	// sender designed it. A product serves each page from the host of the content that it did not
	// write, at a signed address. The preview has no such host, so the two frames load sample pages of
	// its own origin (src/routes/frames/). The first page holds the height script, so the frame takes
	// the height of the page. The second page holds no script, so the frame keeps its fixed height, and
	// the page scrolls inside it. The third page names its facts and the words of a fold, so the script
	// folds the quote of the earlier mails, and the line under the frame shows the facts that onpage
	// gives. The fourth page turns on the scale, so its layout of 600 px fits a narrow column. Every
	// name in the mails is invented.
	let facts = $state<FramePage>();
</script>

<section id="showcase-html-frame" data-showcase="html-frame" class="flex flex-col gap-4 border-t border-border py-8">
	<h2 class="font-mono text-sm font-semibold">html-frame</h2>
	<p class="max-w-3xl text-xs text-muted-foreground">
		HTML that the product did not write, in a sandboxed frame. The sample is the HTML part of a mail, as its sender designed it. A product serves
		each page from its content host, and the preview serves four sample pages from its own origin. With the height script, the frame takes the
		height of the page. With no script, the frame keeps its fixed height of 320 px, and the page scrolls inside it. When the server names the
		attributes of the fold or of the scale on the page, the script folds the quoted text or scales a wide layout to the frame.
	</p>

	<h3 class="text-xs font-medium text-muted-foreground">With the height script</h3>
	<div class="max-w-180">
		<HtmlFrame src="/frames/designed.html" title="The sample mail of Larkfield Ceramics, as the sender designed it, with the height script" />
	</div>

	<h3 class="text-xs font-medium text-muted-foreground">With no script: the fixed height</h3>
	<div class="max-w-180">
		<HtmlFrame src="/frames/no-script.html" title="The sample mail of Larkfield Ceramics, as the sender designed it, with no script" />
	</div>

	<h3 class="text-xs font-medium text-muted-foreground">With the facts of the page and the fold of the quoted text</h3>
	<div class="flex max-w-180 flex-col gap-2">
		<HtmlFrame src="/frames/thread.html" title="The reply of Ana Turner, as she designed it, with the quoted text folded" onpage={(page) => (facts = page)} />
		<p class="text-xs text-muted-foreground">onpage: {facts ? `state ${facts.state ?? 'none'}, remote ${facts.remote ?? 'none'}` : 'no call yet'}</p>
	</div>

	<h3 class="text-xs font-medium text-muted-foreground">With the scale: a layout of 600 px in a column of 390 px</h3>
	<div class="max-w-97.5">
		<HtmlFrame src="/frames/newsletter.html" title="The newsletter of Larkfield Ceramics, scaled to the column" />
	</div>
</section>
