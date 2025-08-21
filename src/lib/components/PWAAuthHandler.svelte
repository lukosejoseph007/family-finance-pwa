<!-- src/lib/components/PWAAuthHandler.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';

	// Check if running as PWA
	const isPWA = () => {
		if (typeof window === 'undefined') return false;
		return (
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as any).standalone === true ||
			document.referrer.includes('android-app://') ||
			$page.url.searchParams.has('pwa')
		);
	};

	// Handle PWA-specific navigation
	const handlePWANavigation = (url: string, replace = false) => {
		if (isPWA()) {
			// For PWA, use SvelteKit's goto to maintain app context
			const cleanUrl = url.split('?')[0];
			goto(cleanUrl, {
				replaceState: replace
			});
		} else {
			// For regular web, normal navigation is fine
			if (replace) {
				window.location.replace(url);
			} else {
				window.location.href = url;
			}
		}
	};

	onMount(() => {
		// Set up auth state listener for PWA
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, session) => {
			console.log('🔄 Auth state change:', event, session?.user?.email, 'PWA:', isPWA());

			if (isPWA()) {
				if (event === 'SIGNED_IN' && session) {
					// Handle successful authentication in PWA
					// Check if we're already on the onboarding page to prevent infinite redirect loop
					if ($page.url.pathname !== '/onboarding') {
						const next = $page.url.searchParams.get('next') || '/onboarding';
						handlePWANavigation(`${next}?auth_success=1&pwa=1`, true);
					}
				} else if (event === 'SIGNED_OUT') {
					// Handle sign out in PWA
					handlePWANavigation('/login?pwa=1', true);
				}
			}
		});

		// Handle PWA redirects from URL parameters
		if (isPWA() && $page.url.searchParams.has('auth_success')) {
			console.log('✅ PWA auth success detected, cleaning URL...');
			// Clean up URL parameters while maintaining PWA context
			const cleanUrl = $page.url.pathname;
			goto(cleanUrl, { replaceState: true });
		}

		// Add PWA-specific CSS for iOS
		if (isPWA()) {
			const style = document.createElement('style');
			style.textContent = `
				@media all and (display-mode: standalone) {
					body {
						-webkit-user-select: none;
						-webkit-touch-callout: none;
						-webkit-tap-highlight-color: transparent;
						overscroll-behavior: none;
					}
					
					html, body {
						height: 100vh;
						overflow: hidden;
						position: fixed;
						width: 100%;
					}
					
					main {
						height: 100vh;
						overflow-y: auto;
						-webkit-overflow-scrolling: touch;
					}
				}
			`;
			document.head.appendChild(style);
		}

		return () => {
			subscription.unsubscribe();
		};
	});
</script>

<!-- This component doesn't render anything, it just handles PWA auth logic -->
