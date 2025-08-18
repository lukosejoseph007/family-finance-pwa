<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { user } from '$lib/store';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import { isPWA, setupPWAFixes, cleanPWAUrl } from '$lib/pwa';

	let { data, children } = $props();

	$effect(() => {
		if (data.session?.user) {
			user.set(data.session.user);
		} else {
			user.set(null);
		}
	});

	onMount(() => {
		// Setup PWA fixes for iOS
		setupPWAFixes();
		
		// Clean up URL parameters after a delay
		setTimeout(() => {
			cleanPWAUrl();
		}, 1000);

		// Debug logging for PWA
		console.log('📱 PWA Mode:', isPWA());
		console.log('🔗 Current URL:', window.location.href);
		console.log('🎯 Display Mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');

		// Set up Supabase auth state change handler
		const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
			console.log('🔄 Auth state change:', event, session?.user?.email);
			if (session?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Family Finance Tracker</title>
	
	<!-- PWA Meta Tags -->
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="theme-color" content="#000000" />
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
</svelte:head>

<!-- Main App Container with PWA support -->
<div class="app-container mobile-pwa-fix">
	<main>
		{@render children?.()}
	</main>
</div>

<style>
	/* PWA-specific styles */
	.app-container {
		min-height: 100vh;
		min-height: -webkit-fill-available;
		width: 100%;
	}

	main {
		width: 100%;
		min-height: inherit;
	}

	/* Global PWA styles */
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>