<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { user } from '$lib/store';

	let { data, children } = $props();

	$effect(() => {
		if (data.session?.user) {
			user.set(data.session.user);
		} else {
			user.set(null);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Family Finance Tracker</title>
</svelte:head>

<main>
	{@render children?.()}
</main>
