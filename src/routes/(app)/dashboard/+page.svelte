<script lang="ts">
	import { goto } from '$app/navigation';
	import { user } from '$lib/store';
	import { signOut } from '$lib/supabaseClient';

	let { data } = $props();

	// Keep the user store in sync with the server session
	if (data.session?.user) {
		user.set(data.session.user);
	}

	async function handleSignOut() {
		await signOut();
		goto('/');
	}
</script>

<div class="p-8">
	<h1 class="text-2xl font-bold">Welcome to your Dashboard!</h1>
	<p class="mt-2 text-gray-600">You are signed in as: {data.session?.user?.email}</p>

	<button
		on:click={handleSignOut}
		class="focus:shadow-outline mt-6 rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600 focus:outline-none"
	>
		Sign Out
	</button>
</div>
