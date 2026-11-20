<script lang="ts">
	// The mark of Messenger, a trademark of its owner: the path of Simple Icons 16.38.0, copied as text
	// (LICENSE.md beside this file). It is filled in currentColor on the 24 px grid of Lucide, and the
	// path stands inside 22 of the 24 units, because a Lucide icon keeps 1 px of padding. It takes the
	// size and the class that a Lucide icon takes. The name of the service always stands beside it in
	// text, so it takes aria-hidden ("Service icons" in DESIGN.md).
	import type { SVGAttributes } from 'svelte/elements';

	let { size = 24, class: className, ...rest }: SVGAttributes<SVGSVGElement> & { size?: number | string | undefined } = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class={className} {...rest}>
	<path transform="translate(1 1) scale(0.91666667)" d="M12 0C5.24 0 0 4.952 0 11.64c0 3.499 1.434 6.521 3.769 8.61a.96.96 0 0 1 .323.683l.065 2.135a.96.96 0 0 0 1.347.85l2.381-1.053a.96.96 0 0 1 .641-.046A13 13 0 0 0 12 23.28c6.76 0 12-4.952 12-11.64S18.76 0 12 0m6.806 7.44c.522-.03.971.567.63 1.094l-4.178 6.457a.707.707 0 0 1-.977.208l-3.87-2.504a.44.44 0 0 0-.49.007l-4.363 3.01c-.637.438-1.415-.317-.995-.966l4.179-6.457a.706.706 0 0 1 .977-.21l3.87 2.505c.15.097.344.094.491-.007l4.362-3.008a.7.7 0 0 1 .364-.13" />
</svg>
