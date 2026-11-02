<!-- The new part of the added case. -->
<script lang="ts" module>
	import type { HTMLAttributes } from 'svelte/elements';

	export type ExtraProps = HTMLAttributes<HTMLSpanElement> & { ref?: HTMLSpanElement | null };
</script>

<script lang="ts">
	import { cn } from '#lib/utils.js';

	let { ref = $bindable(null), class: className, ...rest }: ExtraProps = $props();
</script>

<span bind:this={ref} data-slot="extra" class={cn('text-xs', className)} {...rest}></span>
