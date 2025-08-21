// src/services/pwaService.ts

// TypeScript interfaces for PWA functionality
interface NavigatorWithStandalone extends Navigator {
	standalone?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface WindowWithDeferredPrompt extends Window {
	deferredPrompt?: BeforeInstallPromptEvent | null;
}

export class PWAService {
	private static instance: PWAService;

	private constructor() {}

	static getInstance(): PWAService {
		if (!PWAService.instance) {
			PWAService.instance = new PWAService();
		}
		return PWAService.instance;
	}

	// Check if app is running as PWA
	isPWA(): boolean {
		if (typeof window === 'undefined') return false;

		return (
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as NavigatorWithStandalone).standalone === true ||
			document.referrer.includes('android-app://') ||
			window.location.search.includes('pwa=1')
		);
	}

	// Check if app can be installed
	canInstall(): boolean {
		return 'serviceWorker' in navigator && 'PushManager' in window;
	}

	// Install PWA
	async installPWA(): Promise<boolean> {
		try {
			const windowWithPrompt = window as unknown as WindowWithDeferredPrompt;
			const deferredPrompt = windowWithPrompt.deferredPrompt;
			if (deferredPrompt) {
				deferredPrompt.prompt();
				const { outcome } = await deferredPrompt.userChoice;
				windowWithPrompt.deferredPrompt = null;
				return outcome === 'accepted';
			}
			return false;
		} catch (error) {
			console.error('PWA installation failed:', error);
			return false;
		}
	}

	// Handle iOS Safari PWA navigation issues
	fixIOSNavigation(): void {
		if (!this.isPWA()) return;

		// Prevent iOS from showing browser UI
		document.addEventListener('touchstart', this.preventZoom, { passive: false });

		// Handle back button in PWA
		window.addEventListener('popstate', (event) => {
			if (this.isPWA()) {
				// Prevent iOS from showing browser controls
				event.preventDefault();
				// Let SvelteKit handle the navigation
				history.go(-1);
			}
		});

		// Prevent context menu in PWA
		document.addEventListener('contextmenu', (e) => {
			if (this.isPWA()) {
				e.preventDefault();
			}
		});

		// Fix viewport for iOS PWA
		this.fixIOSViewport();
	}

	private preventZoom(e: TouchEvent): void {
		if (e.touches.length > 1) {
			e.preventDefault();
		}
	}

	private fixIOSViewport(): void {
		// Fix iOS viewport issues in PWA
		const setViewport = () => {
			const viewport = document.querySelector('meta[name=viewport]');
			if (viewport && this.isPWA()) {
				viewport.setAttribute(
					'content',
					'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
				);
			}
		};

		setViewport();
		window.addEventListener('orientationchange', setViewport);
	}

	// Handle authentication redirects in PWA context
	handleAuthRedirect(url: string): void {
		if (!this.isPWA()) {
			window.location.href = url;
			return;
		}

		// For PWA, handle OAuth by opening in external browser
		if (url.includes('oauth') || url.includes('google') || url.includes('apple')) {
			// Open in external browser for OAuth
			window.open(url, '_blank', 'noopener,noreferrer');
		} else {
			// Internal navigation
			window.location.href = url;
		}
	}

	// Setup PWA-specific behaviors
	setupPWA(): void {
		if (typeof window === 'undefined') return;

		// Handle PWA install prompt
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			(window as unknown as WindowWithDeferredPrompt).deferredPrompt =
				e as BeforeInstallPromptEvent;
		});

		// Fix iOS navigation issues
		this.fixIOSNavigation();

		// Add PWA-specific CSS
		this.addPWAStyles();
	}

	private addPWAStyles(): void {
		if (!this.isPWA()) return;

		const style = document.createElement('style');
		style.setAttribute('data-pwa', 'true');
		style.textContent = `
			@media all and (display-mode: standalone) {
				/* Ensure fullscreen experience */
				html, body {
					height: 100vh;
					width: 100vw;
					overflow-x: hidden;
					position: relative;
				}

				/* Prevent iOS Safari UI from appearing */
				body {
					-webkit-user-select: none;
					-webkit-touch-callout: none;
					-webkit-tap-highlight-color: transparent;
					overscroll-behavior: none;
				}

				/* Fix safe areas for iPhone */
				.app-container {
					padding-top: env(safe-area-inset-top);
					padding-bottom: env(safe-area-inset-bottom);
					padding-left: env(safe-area-inset-left);
					padding-right: env(safe-area-inset-right);
				}

				/* Prevent pull-to-refresh */
				html {
					overscroll-behavior: none;
				}

				/* Ensure proper scrolling */
				main, .main-content {
					-webkit-overflow-scrolling: touch;
					overflow-y: auto;
					height: 100%;
				}
			}

			@media screen and (max-width: 768px) and (display-mode: standalone) {
				/* Mobile PWA specific styles */
				.mobile-pwa-fix {
					min-height: 100vh;
					min-height: -webkit-fill-available;
				}
			}
		`;

		document.head.appendChild(style);
	}

	// Clean up URL parameters that might cause issues
	cleanPWAUrl(): void {
		if (!this.isPWA()) return;

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

		if (url.searchParams.has('pwa')) {
			url.searchParams.delete('pwa');
			hasChanges = true;
		}

		if (hasChanges) {
			window.history.replaceState({}, '', url.toString());
		}
	}
}

// Export singleton instance
export const pwaService = PWAService.getInstance();
