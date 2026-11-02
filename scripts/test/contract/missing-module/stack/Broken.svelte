<!-- The missing-module case: a prop takes its type from a module that does not exist. -->
<script lang="ts">
	import type { Gone } from '#lib/gone.js';

	let { value }: { value: Gone } = $props();
</script>

<p data-slot="broken">{value}</p>
