import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { user } from '$lib/store';

interface PushNotificationPayload {
	title: string;
	body: string;
	icon?: string;
	badge?: string;
	data?: Record<string, unknown>;
	tag?: string;
	requireInteraction?: boolean;
	actions?: Array<{
		action: string;
		title: string;
		icon?: string;
	}>;
}

interface FinancialAlertData {
	category?: string;
	amount?: number;
	goalName?: string;
	accountName?: string;
	balance?: number;
}

export class PushNotificationService {
	private vapidPublicKey: string;
	private subscription: PushSubscription | null = null;

	constructor() {
		// In production, this should come from environment variables
		// For now, using a placeholder - you'll need to generate real VAPID keys
		this.vapidPublicKey = 'BGxFjsuJmUzxJl0LewWFzwJPgUqGWY-G_HKWG93y8CKW8xF3Q4SjK6F8K6F8K6F8K6F8K6F8K6F8K6F8K6F8K6F8';
	}

	/**
	 * Check if push notifications are supported
	 */
	public isSupported(): boolean {
		if (!browser) return false;
		return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
	}

	/**
	 * Request notification permission
	 */
	public async requestPermission(): Promise<NotificationPermission> {
		if (!this.isSupported()) {
			throw new Error('Push notifications are not supported');
		}

		if (Notification.permission === 'granted') {
			return 'granted';
		}

		if (Notification.permission === 'denied') {
			throw new Error('Notification permission denied');
		}

		const permission = await Notification.requestPermission();
		return permission;
	}

	/**
	 * Get current notification permission status
	 */
	public getPermissionStatus(): NotificationPermission {
		if (!this.isSupported()) return 'denied';
		return Notification.permission;
	}

	/**
	 * Subscribe to push notifications
	 */
	public async subscribe(): Promise<PushSubscription> {
		if (!this.isSupported()) {
			throw new Error('Push notifications are not supported');
		}

		const permission = await this.requestPermission();
		if (permission !== 'granted') {
			throw new Error('Notification permission not granted');
		}

		const registration = await navigator.serviceWorker.ready;
		
		// Check if already subscribed
		let subscription = await registration.pushManager.getSubscription();
		
		if (!subscription) {
			// Subscribe to push notifications
			subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
			});
		}

		this.subscription = subscription;

		// Send subscription to server
		await this.sendSubscriptionToServer(subscription);

		return subscription;
	}

	/**
	 * Unsubscribe from push notifications
	 */
	public async unsubscribe(): Promise<boolean> {
		if (!this.subscription) {
			const registration = await navigator.serviceWorker.ready;
			this.subscription = await registration.pushManager.getSubscription();
		}

		if (this.subscription) {
			const successful = await this.subscription.unsubscribe();
			if (successful) {
				// Remove subscription from server
				await this.removeSubscriptionFromServer();
				this.subscription = null;
			}
			return successful;
		}

		return false;
	}

	/**
	 * Get current subscription
	 */
	public async getSubscription(): Promise<PushSubscription | null> {
		if (!this.isSupported()) return null;

		if (this.subscription) {
			return this.subscription;
		}

		const registration = await navigator.serviceWorker.ready;
		this.subscription = await registration.pushManager.getSubscription();
		return this.subscription;
	}

	/**
	 * Show a local notification (not push)
	 */
	public async showLocalNotification(payload: PushNotificationPayload): Promise<void> {
		if (!this.isSupported()) {
			throw new Error('Notifications are not supported');
		}

		const permission = await this.requestPermission();
		if (permission !== 'granted') {
			throw new Error('Notification permission not granted');
		}

		const registration = await navigator.serviceWorker.ready;
		
		await registration.showNotification(payload.title, {
			body: payload.body,
			icon: payload.icon || '/icon-192.png',
			badge: payload.badge || '/icon-192.png',
			data: payload.data,
			tag: payload.tag,
			requireInteraction: payload.requireInteraction || false
		});
	}

	/**
	 * Send test notification
	 */
	public async sendTestNotification(): Promise<void> {
		await this.showLocalNotification({
			title: 'Family Finance Test',
			body: 'Push notifications are working! 🎉',
			icon: '/icon-192.png',
			tag: 'test-notification',
			data: { type: 'test' }
		});
	}

	/**
	 * Send financial alert notification
	 */
	public async sendFinancialAlert(type: 'budget-exceeded' | 'goal-achieved' | 'low-balance', data: FinancialAlertData): Promise<void> {
		const notifications = {
			'budget-exceeded': {
				title: 'Budget Alert ⚠️',
				body: `You've exceeded your ${data.category} budget by ₹${data.amount}`,
				tag: 'budget-alert'
			},
			'goal-achieved': {
				title: 'Goal Achieved! 🎯',
				body: `Congratulations! You've reached your goal: ${data.goalName}`,
				tag: 'goal-achievement'
			},
			'low-balance': {
				title: 'Low Balance Alert 💰',
				body: `Your ${data.accountName} balance is low: ₹${data.balance}`,
				tag: 'balance-alert'
			}
		};

		const notification = notifications[type];
		if (notification) {
			await this.showLocalNotification({
				...notification,
				icon: '/icon-192.png',
				requireInteraction: true,
				data: { type, ...data }
			});
		}
	}

	/**
	 * Send subscription to server
	 */
	private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
		const currentUser = get(user);
		if (!currentUser) return;

		const subscriptionData = {
			endpoint: subscription.endpoint,
			keys: {
				p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
				auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
			},
			userId: currentUser.id
		};

		try {
			// In a real app, send this to your backend API
			const response = await fetch('/api/notifications/subscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(subscriptionData)
			});

			if (!response.ok) {
				console.warn('Failed to save subscription to server');
			}
		} catch (error) {
			console.warn('Failed to send subscription to server:', error);
			// Store locally as fallback
			localStorage.setItem('push-subscription', JSON.stringify(subscriptionData));
		}
	}

	/**
	 * Remove subscription from server
	 */
	private async removeSubscriptionFromServer(): Promise<void> {
		const currentUser = get(user);
		if (!currentUser) return;

		try {
			await fetch('/api/notifications/unsubscribe', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ userId: currentUser.id })
			});
		} catch (error) {
			console.warn('Failed to remove subscription from server:', error);
		}

		// Remove from local storage
		localStorage.removeItem('push-subscription');
	}

	/**
	 * Convert VAPID public key to Uint8Array
	 */
	private urlBase64ToUint8Array(base64String: string): Uint8Array {
		const padding = '='.repeat((4 - base64String.length % 4) % 4);
		const base64 = (base64String + padding)
			.replace(/-/g, '+')
			.replace(/_/g, '/');

		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	/**
	 * Schedule recurring notifications for budget reminders
	 */
	public async scheduleRecurringNotifications(): Promise<void> {
		// This would typically be handled by your backend
		// For demo purposes, showing how to set up local scheduling
		
		// Schedule weekly budget review
		setTimeout(async () => {
			await this.showLocalNotification({
				title: 'Weekly Budget Review 📊',
				body: 'Time to review your weekly spending and update your budget!',
				tag: 'weekly-review',
				data: { type: 'scheduled', frequency: 'weekly' }
			});
		}, 7 * 24 * 60 * 60 * 1000); // 7 days
	}
}

export const pushNotificationService = new PushNotificationService();