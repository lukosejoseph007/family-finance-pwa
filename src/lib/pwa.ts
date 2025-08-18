// src/lib/pwa.ts - Simple PWA utilities without complex typing

// Type for iOS Safari standalone mode
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

	// Prevent iOS Safari UI from appearing
	document.addEventListener('touchstart', (e) => {
		if (e.touches.length > 1) {
			e.preventDefault();
		}
	}, { passive: false });

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

	// Add PWA-specific styles
	const style = document.createElement('style');
	style.setAttribute('data-pwa', 'true');
	style.textContent = `
		@media all and (display-mode: standalone) {
			html, body {
				height: 100vh;
				width: 100vw;
				overflow-x: hidden;
				position: relative;
				overscroll-behavior: none;
			}

			body {
				-webkit-user-select: none;
				-webkit-touch-callout: none;
				-webkit-tap-highlight-color: transparent;
			}

			.app-container {
				padding-top: env(safe-area-inset-top);
				padding-bottom: env(safe-area-inset-bottom);
				padding-left: env(safe-area-inset-left);
				padding-right: env(safe-area-inset-right);
			}

			main {
				-webkit-overflow-scrolling: touch;
				overflow-y: auto;
				height: 100%;
			}
		}
	`;
	document.head.appendChild(style);
}

export function cleanPWAUrl(): void {
	if (!isPWA()) return;

	const url = new URL(window.location.href);
	let hasChanges = false;
	
	if (url.searchParams.has('code')) {
		url.searchParams.delete('code');
		hasChanges = true;
	}
	
	if (url.searchParams.has('state')) {
		url.searchParams.delete('state');
		hasChanges = true;
	}

	if (hasChanges) {
		window.history.replaceState({}, '', url.toString());
	}
}