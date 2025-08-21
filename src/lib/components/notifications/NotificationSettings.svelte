<script lang="ts">
	import { onMount } from 'svelte';
	import { pushNotificationService } from '$lib/services/pushNotificationService';
	import Button from '$lib/components/ui/Button.svelte';

	let notificationPermission = $state<NotificationPermission>('default');
	let isSubscribed = $state(false);
	let isLoading = $state(false);
	let subscription = $state<PushSubscription | null>(null);

	// Notification preferences
	let preferences = $state({
		budgetAlerts: true,
		goalAchievements: true,
		lowBalanceWarnings: true,
		weeklyReports: true,
		transactionUpdates: false
	});

	onMount(async () => {
		// Check current permission and subscription status
		notificationPermission = pushNotificationService.getPermissionStatus();
		subscription = await pushNotificationService.getSubscription();
		isSubscribed = subscription !== null;

		// Load saved preferences
		const savedPreferences = localStorage.getItem('notification-preferences');
		if (savedPreferences) {
			preferences = { ...preferences, ...JSON.parse(savedPreferences) };
		}
	});

	async function enableNotifications() {
		isLoading = true;
		try {
			subscription = await pushNotificationService.subscribe();
			isSubscribed = true;
			notificationPermission = 'granted';

			// Send test notification
			await pushNotificationService.sendTestNotification();
		} catch (error) {
			console.error('Failed to enable notifications:', error);
			alert('Failed to enable notifications. Please check your browser settings.');
		} finally {
			isLoading = false;
		}
	}

	async function disableNotifications() {
		isLoading = true;
		try {
			await pushNotificationService.unsubscribe();
			isSubscribed = false;
			subscription = null;
		} catch (error) {
			console.error('Failed to disable notifications:', error);
		} finally {
			isLoading = false;
		}
	}

	async function sendTestNotification() {
		try {
			await pushNotificationService.sendTestNotification();
		} catch (error) {
			console.error('Failed to send test notification:', error);
			alert('Failed to send test notification.');
		}
	}

	async function sendBudgetAlert() {
		try {
			await pushNotificationService.sendFinancialAlert('budget-exceeded', {
				category: 'Food & Dining',
				amount: 1500
			});
		} catch (error) {
			console.error('Failed to send budget alert:', error);
		}
	}

	async function sendGoalAlert() {
		try {
			await pushNotificationService.sendFinancialAlert('goal-achieved', {
				goalName: 'Emergency Fund'
			});
		} catch (error) {
			console.error('Failed to send goal alert:', error);
		}
	}

	function savePreferences() {
		localStorage.setItem('notification-preferences', JSON.stringify(preferences));
		alert('Notification preferences saved!');
	}

	function updatePreference(key: keyof typeof preferences) {
		preferences[key] = !preferences[key];
		savePreferences();
	}
</script>

<div class="space-y-6">
	<div class="border-b border-gray-200 pb-4">
		<h2 class="text-xl font-semibold text-gray-900">Push Notifications</h2>
		<p class="mt-1 text-sm text-gray-600">
			Stay updated with important financial alerts and reminders
		</p>
	</div>

	<!-- Notification Status -->
	<div class="rounded-lg bg-gray-50 p-4">
		<div class="flex items-center justify-between">
			<div>
				<h3 class="font-medium text-gray-900">Notification Status</h3>
				<div class="mt-1 flex items-center space-x-2">
					<div class="flex items-center space-x-1">
						<div
							class="h-2 w-2 rounded-full"
							class:bg-green-500={notificationPermission === 'granted'}
							class:bg-yellow-500={notificationPermission === 'default'}
							class:bg-red-500={notificationPermission === 'denied'}
						></div>
						<span class="text-sm text-gray-600">
							{#if notificationPermission === 'granted'}
								Enabled
							{:else if notificationPermission === 'default'}
								Not requested
							{:else}
								Blocked
							{/if}
						</span>
					</div>
					{#if isSubscribed}
						<span class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"> Subscribed </span>
					{/if}
				</div>
			</div>

			<div class="flex space-x-2">
				{#if !isSubscribed && notificationPermission !== 'denied'}
					<Button on:click={enableNotifications} loading={isLoading} variant="primary" size="sm">
						Enable Notifications
					</Button>
				{:else if isSubscribed}
					<Button on:click={disableNotifications} loading={isLoading} variant="outline" size="sm">
						Disable
					</Button>
				{/if}
			</div>
		</div>

		{#if notificationPermission === 'denied'}
			<div class="mt-3 rounded border border-red-200 bg-red-50 p-3">
				<p class="text-sm text-red-700">
					Notifications are blocked. Please enable them in your browser settings and refresh the
					page.
				</p>
			</div>
		{/if}
	</div>

	<!-- Test Notifications -->
	{#if isSubscribed}
		<div class="rounded-lg bg-blue-50 p-4">
			<h3 class="mb-3 font-medium text-gray-900">Test Notifications</h3>
			<div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
				<Button on:click={sendTestNotification} variant="outline" size="sm">Test Basic</Button>
				<Button on:click={sendBudgetAlert} variant="outline" size="sm">Budget Alert</Button>
				<Button on:click={sendGoalAlert} variant="outline" size="sm">Goal Achievement</Button>
			</div>
		</div>
	{/if}

	<!-- Notification Preferences -->
	<div>
		<h3 class="mb-4 font-medium text-gray-900">Notification Preferences</h3>
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium text-gray-900">Budget Alerts</div>
					<p class="text-sm text-gray-600">Get notified when you exceed category budgets</p>
				</div>
				<label class="relative inline-flex cursor-pointer items-center">
					<input
						type="checkbox"
						class="peer sr-only"
						checked={preferences.budgetAlerts}
						onchange={() => updatePreference('budgetAlerts')}
						aria-label="Enable budget alerts"
					/>
					<div
						class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
					></div>
				</label>
			</div>

			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium text-gray-900">Goal Achievements</div>
					<p class="text-sm text-gray-600">Celebrate when you reach your financial goals</p>
				</div>
				<label class="relative inline-flex cursor-pointer items-center">
					<input
						type="checkbox"
						class="peer sr-only"
						checked={preferences.goalAchievements}
						onchange={() => updatePreference('goalAchievements')}
						aria-label="Enable goal achievement notifications"
					/>
					<div
						class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
					></div>
				</label>
			</div>

			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium text-gray-900">Low Balance Warnings</div>
					<p class="text-sm text-gray-600">Alert when account balances are getting low</p>
				</div>
				<label class="relative inline-flex cursor-pointer items-center">
					<input
						type="checkbox"
						class="peer sr-only"
						checked={preferences.lowBalanceWarnings}
						onchange={() => updatePreference('lowBalanceWarnings')}
						aria-label="Enable low balance warnings"
					/>
					<div
						class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
					></div>
				</label>
			</div>

			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium text-gray-900">Weekly Reports</div>
					<p class="text-sm text-gray-600">Weekly spending summaries and budget reviews</p>
				</div>
				<label class="relative inline-flex cursor-pointer items-center">
					<input
						type="checkbox"
						class="peer sr-only"
						checked={preferences.weeklyReports}
						onchange={() => updatePreference('weeklyReports')}
						aria-label="Enable weekly report notifications"
					/>
					<div
						class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
					></div>
				</label>
			</div>

			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium text-gray-900">Transaction Updates</div>
					<p class="text-sm text-gray-600">Notifications for each transaction (can be noisy)</p>
				</div>
				<label class="relative inline-flex cursor-pointer items-center">
					<input
						type="checkbox"
						class="peer sr-only"
						checked={preferences.transactionUpdates}
						onchange={() => updatePreference('transactionUpdates')}
						aria-label="Enable transaction update notifications"
					/>
					<div
						class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
					></div>
				</label>
			</div>
		</div>
	</div>

	<!-- Subscription Info -->
	{#if subscription}
		<div class="rounded-lg bg-gray-50 p-4">
			<h3 class="mb-2 font-medium text-gray-900">Subscription Details</h3>
			<div class="font-mono text-xs break-all text-gray-600">
				<div><strong>Endpoint:</strong> {subscription.endpoint}</div>
			</div>
		</div>
	{/if}
</div>
