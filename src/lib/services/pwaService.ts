import { browser } from '$app/environment';
import { offlineStore } from '$lib/stores/offline';

interface NavigatorWithStandalone extends Navigator {
	standalone?: boolean;
}

export class PWAService {
	private static instance: PWAService;
	private registration: ServiceWorkerRegistration | null = null;

	public static getInstance(): PWAService {
		if (!PWAService.instance) {
			PWAService.instance = new PWAService();
		}
		return PWAService.instance;
	}

	public async init(): Promise<void> {
		if (!browser || !('serviceWorker' in navigator)) {
			console.warn('Service workers not supported in this environment');
			return;
		}

		try {
			// Register service worker
			this.registration = await navigator.serviceWorker.register('/sw.js', {
				scope: '/'
			});

			console.log('Service Worker registered successfully:', this.registration.scope);
			offlineStore.setServiceWorker(true);

			// Listen for updates
			this.registration.addEventListener('updatefound', () => {
				const newWorker = this.registration?.installing;
				if (newWorker) {
					newWorker.addEventListener('statechange', () => {
						if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
							// New version available
							this.showUpdateNotification();
						}
					});
				}
			});

			// Listen for controlling changes - but don't auto-reload in PWA mode
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				// Only reload if we're not in PWA mode to prevent infinite loops
				const isPWAMode = window.matchMedia('(display-mode: standalone)').matches ||
					(navigator as NavigatorWithStandalone).standalone === true ||
					document.referrer.includes('android-app://');
					
				if (!isPWAMode) {
					console.log('Service Worker controller changed, reloading...');
					window.location.reload();
				} else {
					console.log('Service Worker controller changed in PWA mode - skipping reload to prevent loop');
				}
			});
		} catch (error) {
			console.error('Service Worker registration failed:', error);
		}
	}

	public async checkForUpdates(): Promise<void> {
		if (this.registration) {
			await this.registration.update();
		}
	}

	public async skipWaiting(): Promise<void> {
		if (this.registration?.waiting) {
			this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
		}
	}

	private showUpdateNotification(): void {
		// Create a simple update notification
		const updateBanner = document.createElement('div');
		updateBanner.innerHTML = `
			<div style="
				position: fixed;
				top: 0;
				left: 0;
				right: 0;
				background: #2563eb;
				color: white;
				padding: 1rem;
				text-align: center;
				z-index: 9999;
				font-family: system-ui, sans-serif;
			">
				<div style="max-width: 1200px; margin: 0 auto; display: flex; items-center: justify-content: space-between;">
					<span>A new version of Family Finance is available!</span>
					<div>
						<button onclick="this.parentElement.parentElement.parentElement.remove()" 
							style="background: transparent; border: 1px solid white; color: white; padding: 0.5rem 1rem; margin-right: 0.5rem; border-radius: 4px; cursor: pointer;">
							Later
						</button>
						<button onclick="window.pwaService?.skipWaiting()" 
							style="background: white; border: none; color: #2563eb; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: 600;">
							Update Now
						</button>
					</div>
				</div>
			</div>
		`;
		document.body.appendChild(updateBanner);

		// Auto-remove after 10 seconds
		setTimeout(() => {
			if (updateBanner.parentNode) {
				updateBanner.parentNode.removeChild(updateBanner);
			}
		}, 10000);
	}

	public async getNetworkStatus(): Promise<boolean> {
		if (!browser) return true;

		try {
			const response = await fetch('/favicon.ico', {
				method: 'HEAD',
				cache: 'no-cache'
			});
			return response.ok;
		} catch {
			return false;
		}
	}

	public async syncPendingData(): Promise<void> {
		// Placeholder for syncing pending data when back online
		// This would integrate with your actual data sync logic
		console.log('Syncing pending data...');
		offlineStore.setPendingSync(true);

		try {
			// Simulate sync delay
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Update last sync time
			offlineStore.updateLastSync();
			offlineStore.setPendingSync(false);

			console.log('Data sync completed');
		} catch (error) {
			console.error('Data sync failed:', error);
			offlineStore.setPendingSync(false);
		}
	}

	public async reloadApp(): Promise<void> {
		// Force reload the app
		if ('serviceWorker' in navigator) {
			const registration = await navigator.serviceWorker.ready;
			if (registration.waiting) {
				registration.waiting.postMessage({ type: 'SKIP_WAITING' });
			}
		}
		window.location.reload();
	}
}

// Global instance
if (browser) {
	(globalThis as typeof globalThis & { pwaService: PWAService }).pwaService =
		PWAService.getInstance();
}

export const pwaService = PWAService.getInstance();
