import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface OfflineStore {
	isOnline: boolean;
	hasServiceWorker: boolean;
	pendingSync: boolean;
	lastSync: Date | null;
}

function createOfflineStore() {
	const { subscribe, set, update } = writable<OfflineStore>({
		isOnline: browser ? navigator.onLine : true,
		hasServiceWorker: false,
		pendingSync: false,
		lastSync: null
	});

	return {
		subscribe,
		setOnline: (online: boolean) => update((store) => ({ ...store, isOnline: online })),
		setServiceWorker: (hasServiceWorker: boolean) =>
			update((store) => ({ ...store, hasServiceWorker })),
		setPendingSync: (pending: boolean) => update((store) => ({ ...store, pendingSync: pending })),
		updateLastSync: () => update((store) => ({ ...store, lastSync: new Date() })),
		reset: () =>
			set({
				isOnline: browser ? navigator.onLine : true,
				hasServiceWorker: false,
				pendingSync: false,
				lastSync: null
			})
	};
}

export const offlineStore = createOfflineStore();

// Initialize offline detection in browser
if (browser) {
	window.addEventListener('online', () => offlineStore.setOnline(true));
	window.addEventListener('offline', () => offlineStore.setOnline(false));

	// Check for service worker
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.ready.then(() => {
			offlineStore.setServiceWorker(true);
		});
	}
}
