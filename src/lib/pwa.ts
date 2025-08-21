// src/lib/pwa.ts - Enhanced PWA utilities with scroll fixes

interface NavigatorWithStandalone extends Navigator {
	standalone?: boolean;
}

export function isPWA(): boolean {
	if (typeof window === 'undefined') return false;

	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		(navigator as NavigatorWithStandalone).standalone === true ||
		document.referrer.includes('android-app://') ||
		window.location.search.includes('pwa=1')
	);
}

export function setupPWAFixes(): void {
	if (!isPWA()) return;

	// Prevent iOS Safari UI from appearing (but allow single touches for scrolling)
	document.addEventListener(
		'touchstart',
		(e) => {
			if (e.touches.length > 1) {
				e.preventDefault();
			}
		},
		{ passive: false }
	);

	// Prevent context menu in PWA
	document.addEventListener('contextmenu', (e) => {
		e.preventDefault();
	});

	// Fix viewport for iOS PWA
	const setViewport = () => {
		const viewport = document.querySelector('meta[name=viewport]');
		if (viewport) {
			viewport.setAttribute(
				'content',
				'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
			);
		}
	};

	setViewport();
	window.addEventListener('orientationchange', setViewport);

	// Enhanced PWA-specific styles with better scroll handling
	const style = document.createElement('style');
	style.setAttribute('data-pwa', 'true');
	style.textContent = `
		@media all and (display-mode: standalone) {
			html {
				height: 100vh;
				width: 100vw;
				overflow-x: hidden;
				position: relative;
				/* Prevent bounce scrolling that might trigger refresh */
				overscroll-behavior: contain;
			}

			body {
				height: 100%;
				-webkit-user-select: none;
				-webkit-touch-callout: none;
				-webkit-tap-highlight-color: transparent;
				/* Critical: Prevent pull-to-refresh */
				overscroll-behavior-y: contain;
				/* Ensure smooth scrolling */
				-webkit-overflow-scrolling: touch;
			}

			.app-container {
				padding-top: env(safe-area-inset-top);
				padding-bottom: env(safe-area-inset-bottom);
				padding-left: env(safe-area-inset-left);
				padding-right: env(safe-area-inset-right);
				height: 100vh;
				overflow-y: auto;
				/* Prevent scroll chaining to parent */
				overscroll-behavior: contain;
			}

			/* Specific onboarding fixes */
			[data-route="onboarding"] {
				overscroll-behavior: contain;
				-webkit-overflow-scrolling: touch;
			}

			/* Prevent any pull-to-refresh gestures */
			.onboarding-container,
			.scroll-container {
				overscroll-behavior-y: contain;
				-webkit-overflow-scrolling: touch;
			}

			main {
				-webkit-overflow-scrolling: touch;
				overflow-y: auto;
				height: 100%;
				/* Prevent rubber band effect */
				overscroll-behavior: contain;
			}
		}
	`;
	document.head.appendChild(style);

	// Add PWA-specific scroll event handlers to prevent refresh
	let lastScrollY = 0;
	let ticking = false;

	const handleScroll = () => {
		const currentScrollY = window.scrollY;
		
		// Prevent pull-to-refresh when at top of page
		if (currentScrollY <= 0 && lastScrollY <= 0) {
			document.body.style.overscrollBehaviorY = 'contain';
		}
		
		lastScrollY = currentScrollY;
		ticking = false;
	};

	const requestScrollTick = () => {
		if (!ticking) {
			requestAnimationFrame(handleScroll);
			ticking = true;
		}
	};

	window.addEventListener('scroll', requestScrollTick, { passive: true });

	// Prevent the dreaded iOS Safari refresh on scroll-past-bounds
	document.addEventListener('touchmove', (e) => {
		// Only prevent if we're at the scroll boundaries
		const element = e.target as HTMLElement;
		const scrollableParent = findScrollableParent(element);
		
		if (scrollableParent && (
			scrollableParent.scrollTop <= 0 || 
			scrollableParent.scrollTop >= (scrollableParent.scrollHeight - scrollableParent.clientHeight)
		)) {
			// Allow the touch to continue for scrolling within bounds
			return;
		}
	}, { passive: true });
}

function findScrollableParent(element: HTMLElement): HTMLElement | null {
	if (!element || element === document.body) {
		return document.body;
	}
	
	const style = window.getComputedStyle(element);
	const isScrollable = /(auto|scroll)/.test(style.overflow + style.overflowY + style.overflowX);
	
	if (isScrollable && element.scrollHeight > element.clientHeight) {
		return element;
	}
	
	return findScrollableParent(element.parentElement!);
}

export function cleanPWAUrl(): void {
	if (!isPWA()) return;

	const url = new URL(window.location.href);
	let hasChanges = false;

	// Clean up auth-related parameters that might cause refresh loops
	const paramsToClean = ['code', 'state', 'error', 'error_description'];
	
	paramsToClean.forEach(param => {
		if (url.searchParams.has(param)) {
			url.searchParams.delete(param);
			hasChanges = true;
		}
	});

	if (hasChanges) {
		// Use replaceState to avoid adding to browser history
		window.history.replaceState(null, '', url.toString());
	}
}

// Enhanced function to handle onboarding state management
export function clearOnboardingState(): void {
	if (typeof window === 'undefined') return;
	
	try {
		// Clear sessionStorage onboarding data
		const onboardingKeys = ['onboarding_step', 'pendingInviteCode', 'pendingDisplayName'];
		onboardingKeys.forEach(key => {
			try {
				sessionStorage.removeItem(key);
			} catch (e) {
				console.warn(`Could not clear ${key} from sessionStorage:`, e);
			}
		});
		
		// Clear URL parameters that might affect onboarding
		const url = new URL(window.location.href);
		const onboardingParams = ['step', 'onboarding_step', 'completed', 'code', 'state'];
		let hasChanges = false;
		
		onboardingParams.forEach(param => {
			if (url.searchParams.has(param)) {
				url.searchParams.delete(param);
				hasChanges = true;
			}
		});
		
		if (hasChanges) {
			window.history.replaceState(null, '', url.toString());
		}
		
		console.log('🧹 Cleared onboarding state');
	} catch (error) {
		console.warn('Could not clear onboarding state:', error);
	}
}

// Debug function to help identify PWA issues
export function debugPWAState(): void {
	if (typeof window === 'undefined') return;
	
	console.group('🔧 PWA Debug Info');
	console.log('📱 PWA Mode:', isPWA());
	console.log('🔗 Current URL:', window.location.href);
	console.log('🎯 Display Mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');
	console.log('📏 Viewport:', {
		width: window.innerWidth,
		height: window.innerHeight,
		scrollY: window.scrollY
	});
	console.log('🔄 Service Worker State:', navigator.serviceWorker?.controller ? 'Active' : 'None');
	console.groupEnd();
}