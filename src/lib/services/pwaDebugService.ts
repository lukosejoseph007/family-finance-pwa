// src/lib/services/pwaDebugService.ts
// Utility service for debugging and fixing PWA issues

interface NavigatorWithStandalone extends Navigator {
	standalone?: boolean;
}

interface PWADebugMethods {
	diagnose: () => Promise<PWADiagnostics>;
	fix: () => Promise<void>;
	emergencyRecovery: () => Promise<void>;
}

interface WindowWithDebug extends Window {
	pwaDebug?: PWADebugMethods;
}

interface PWADiagnostics {
	isPWA: boolean;
	serviceWorkerActive: boolean;
	cacheStatus: string[];
	scrollIssues: boolean;
	refreshLoopDetected: boolean;
}

class PWADebugService {
	private refreshCount = 0;
	private lastRefreshTime = 0;
	private readonly REFRESH_THRESHOLD = 3;
	private readonly REFRESH_TIME_WINDOW = 10000; // 10 seconds

	async diagnose(): Promise<PWADiagnostics> {
		const diagnostics: PWADiagnostics = {
			isPWA: this.checkPWAMode(),
			serviceWorkerActive: await this.checkServiceWorker(),
			cacheStatus: await this.checkCaches(),
			scrollIssues: this.detectScrollIssues(),
			refreshLoopDetected: this.detectRefreshLoop()
		};

		console.group('🔧 PWA Diagnostics');
		console.table(diagnostics);
		console.groupEnd();

		return diagnostics;
	}

	private checkPWAMode(): boolean {
		if (typeof window === 'undefined') return false;

		return (
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as NavigatorWithStandalone).standalone === true ||
			document.referrer.includes('android-app://')
		);
	}

	private async checkServiceWorker(): Promise<boolean> {
		if (!('serviceWorker' in navigator)) return false;
		
		try {
			const registration = await navigator.serviceWorker.getRegistration();
			return !!(registration && registration.active);
		} catch (error) {
			console.warn('Service Worker check failed:', error);
			return false;
		}
	}

	private async checkCaches(): Promise<string[]> {
		if (!('caches' in window)) return ['Cache API not supported'];

		try {
			const cacheNames = await caches.keys();
			const cacheStatus: string[] = [];

			for (const name of cacheNames) {
				const cache = await caches.open(name);
				const keys = await cache.keys();
				cacheStatus.push(`${name}: ${keys.length} items`);
			}

			return cacheStatus.length ? cacheStatus : ['No caches found'];
		} catch (error) {
			return [`Cache check failed: ${error instanceof Error ? error.message : String(error)}`];
		}
	}

	private detectScrollIssues(): boolean {
		if (typeof window === 'undefined') return false;

		const body = document.body;
		const html = document.documentElement;

		// Check for problematic CSS that might cause scroll issues
		const bodyStyle = window.getComputedStyle(body);
		const htmlStyle = window.getComputedStyle(html);

		const hasOverscrollIssues = 
			bodyStyle.overscrollBehavior === 'auto' || 
			htmlStyle.overscrollBehavior === 'auto';

		const hasHeightIssues = 
			bodyStyle.height === '100%' && 
			htmlStyle.height === '100%' && 
			bodyStyle.overflow === 'hidden';

		return hasOverscrollIssues || hasHeightIssues;
	}

	private detectRefreshLoop(): boolean {
		const now = Date.now();
		
		// Reset counter if enough time has passed
		if (now - this.lastRefreshTime > this.REFRESH_TIME_WINDOW) {
			this.refreshCount = 0;
		}

		this.refreshCount++;
		this.lastRefreshTime = now;

		return this.refreshCount > this.REFRESH_THRESHOLD;
	}

	async fixCommonIssues(): Promise<void> {
		console.log('🔧 Attempting to fix common PWA issues...');

		// Fix 1: Clear problematic caches
		await this.clearProblematicCaches();

		// Fix 2: Apply scroll fixes
		this.applyScrollFixes();

		// Fix 3: Clean URL parameters
		this.cleanURLParameters();

		// Fix 4: Reset service worker if needed
		await this.resetServiceWorkerIfNeeded();

		console.log('✅ PWA fixes applied');
	}

	private async clearProblematicCaches(): Promise<void> {
		if (!('caches' in window)) return;

		try {
			const problematicCaches = ['onboarding-cache', 'pages-cache'];
			
			for (const cacheName of problematicCaches) {
				const deleted = await caches.delete(cacheName);
				if (deleted) {
					console.log(`🗑️ Cleared cache: ${cacheName}`);
				}
			}
		} catch (error) {
			console.warn('Cache clearing failed:', error);
		}
	}

	private applyScrollFixes(): void {
		if (!this.checkPWAMode()) return;

		const style = document.createElement('style');
		style.setAttribute('data-pwa-fix', 'scroll');
		style.textContent = `
			@media all and (display-mode: standalone) {
				html, body {
					overscroll-behavior: contain !important;
					-webkit-overflow-scrolling: touch !important;
				}
				
				.onboarding-container,
				.scroll-container,
				main {
					overscroll-behavior: contain !important;
					-webkit-overflow-scrolling: touch !important;
				}
				
				/* Prevent pull-to-refresh */
				body {
					overscroll-behavior-y: contain !important;
				}
			}
		`;

		// Remove existing fix styles first
		const existingFix = document.querySelector('style[data-pwa-fix="scroll"]');
		if (existingFix) {
			existingFix.remove();
		}

		document.head.appendChild(style);
	}

	private cleanURLParameters(): void {
		const url = new URL(window.location.href);
		const problematicParams = [
			'code', 'state', 'error', 'error_description',
			'step', 'onboarding_step', 'completed'
		];

		let hasChanges = false;
		problematicParams.forEach(param => {
			if (url.searchParams.has(param)) {
				url.searchParams.delete(param);
				hasChanges = true;
			}
		});

		if (hasChanges) {
			window.history.replaceState(null, '', url.toString());
			console.log('🧹 Cleaned URL parameters');
		}
	}

	private async resetServiceWorkerIfNeeded(): Promise<void> {
		if (!('serviceWorker' in navigator)) return;

		try {
			const registration = await navigator.serviceWorker.getRegistration();
			if (registration) {
				// Send message to service worker to clear caches
				if (registration.active) {
					registration.active.postMessage({
						type: 'CLEAR_ALL_CACHES'
					});
				}

				// Force service worker update
				await registration.update();
				console.log('🔄 Service Worker updated');
			}
		} catch (error) {
			console.warn('Service Worker reset failed:', error instanceof Error ? error.message : String(error));
		}
	}

	// Emergency recovery function
	async emergencyRecovery(): Promise<void> {
		console.warn('🚨 Performing emergency PWA recovery...');

		try {
			// 1. Unregister service worker
			if ('serviceWorker' in navigator) {
				const registrations = await navigator.serviceWorker.getRegistrations();
				for (const registration of registrations) {
					await registration.unregister();
					console.log('🗑️ Unregistered service worker');
				}
			}

			// 2. Clear all caches
			if ('caches' in window) {
				const cacheNames = await caches.keys();
				await Promise.all(cacheNames.map(name => caches.delete(name)));
				console.log('🗑️ Cleared all caches');
			}

			// 3. Clear storage (if available)
			try {
				localStorage.clear();
				sessionStorage.clear();
				console.log('🗑️ Cleared storage');
			} catch {
				// Storage might not be available in PWA context
			}

			// 4. Force reload
			window.location.href = window.location.origin + '/dashboard';
			
		} catch (error) {
			console.error('Emergency recovery failed:', error);
			// Last resort - basic reload
			window.location.reload();
		}
	}

	// Monitoring function to detect and auto-fix issues
	startMonitoring(): void {
		// Monitor for refresh loops
		const originalPushState = history.pushState;
		const originalReplaceState = history.replaceState;

		let navigationCount = 0;
		const navigationThreshold = 5;

		const trackNavigation = () => {
			navigationCount++;
			if (navigationCount > navigationThreshold) {
				console.warn('🚨 Excessive navigation detected - MONITORING ONLY (fixes disabled to prevent loops)');
				// this.fixCommonIssues(); // Disabled to prevent triggering more reloads
				navigationCount = 0;
			}
		};

		history.pushState = function(...args) {
			trackNavigation();
			return originalPushState.apply(this, args);
		};

		history.replaceState = function(...args) {
			trackNavigation();
			return originalReplaceState.apply(this, args);
		};

		// Monitor for scroll issues
		let scrollEventCount = 0;
		const scrollThreshold = 50;

		window.addEventListener('scroll', () => {
			scrollEventCount++;
			if (scrollEventCount > scrollThreshold) {
				console.warn('🚨 Excessive scroll events detected');
				this.applyScrollFixes();
				scrollEventCount = 0;
			}
		}, { passive: true });

		console.log('👀 PWA monitoring started');
	}
}

// Export singleton instance
export const pwaDebugService = new PWADebugService();

// Auto-start monitoring in PWA mode - DISABLED to prevent refresh loops
// Uncomment only if needed for debugging
// if (typeof window !== 'undefined') {
// 	window.addEventListener('load', () => {
// 		const isPWA = window.matchMedia('(display-mode: standalone)').matches;
// 		if (isPWA) {
// 			pwaDebugService.startMonitoring();
// 		}
// 	});
// }

// Global debug functions (available in console)
if (typeof window !== 'undefined') {
	(window as WindowWithDebug).pwaDebug = {
		diagnose: () => pwaDebugService.diagnose(),
		fix: () => pwaDebugService.fixCommonIssues(),
		emergencyRecovery: () => pwaDebugService.emergencyRecovery()
	};
}