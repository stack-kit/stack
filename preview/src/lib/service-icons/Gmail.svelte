<script lang="ts">
	// The mark of Gmail, a trademark of its owner: the path of Simple Icons 16.38.0, copied as text
	// (LICENSE.md beside this file). It is filled in currentColor on the 24 px grid of Lucide, and the
	// path stands inside 22 of the 24 units, because a Lucide icon keeps 1 px of padding. It takes the
	// size and the class that a Lucide icon takes. The name of the service always stands beside it in
	// text, so it takes aria-hidden ("Service icons" in DESIGN.md).
	import type { SVGAttributes } from 'svelte/elements';

	let { size = 24, class: className, ...rest }: SVGAttributes<SVGSVGElement> & { size?: number | string | undefined } = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class={className} {...rest}>
	<path transform="translate(1 1) scale(0.91666667)" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
</svg>
