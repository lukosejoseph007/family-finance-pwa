// sw.js - Fixed Service Worker with proper offline handling

// If the loader is already loaded, just stop.
if (!self.define) {
	let registry = {};
	let nextDefineUri;

	const singleRequire = (uri, parentUri) => {
		uri = new URL(uri + '.js', parentUri).href;
		return (
			registry[uri] ||
			new Promise((resolve) => {
				if ('document' in self) {
					const script = document.createElement('script');
					script.src = uri;
					script.onload = resolve;
					document.head.appendChild(script);
				} else {
					nextDefineUri = uri;
					importScripts(uri);
					resolve();
				}
			}).then(() => {
				let promise = registry[uri];
				if (!promise) {
					throw new Error(`Module ${uri} didn't register its module`);
				}
				return promise;
			})
		);
	};

	self.define = (depsNames, factory) => {
		const uri =
			nextDefineUri || ('document' in self ? document.currentScript.src : '') || location.href;
		if (registry[uri]) {
			return;
		}
		let exports = {};
		const require = (depUri) => singleRequire(depUri, uri);
		const specialDeps = {
			module: { uri },
			exports,
			require
		};
		registry[uri] = Promise.all(
			depsNames.map((depName) => specialDeps[depName] || require(depName))
		).then((deps) => {
			factory(...deps);
			return exports;
		});
	};
}

define(['./workbox-789f7e5f'], function (workbox) {
	'use strict';

	self.skipWaiting();
	workbox.clientsClaim();

	// Create a simple offline page fallback
	const OFFLINE_HTML = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title>Offline - Family Finance</title>
			<style>
				body { 
					font-family: Arial, sans-serif; 
					text-align: center; 
					padding: 50px; 
					background: #f5f5f5; 
				}
				.offline-container {
					max-width: 400px;
					margin: 0 auto;
					background: white;
					padding: 40px;
					border-radius: 8px;
					box-shadow: 0 2px 10px rgba(0,0,0,0.1);
				}
			</style>
		</head>
		<body>
			<div class="offline-container">
				<h1>You're Offline</h1>
				<p>Please check your internet connection and try again.</p>
				<button onclick="window.location.reload()">Retry</button>
			</div>
		</body>
		</html>
	`;

	// Handle the offline page creation
	self.addEventListener('install', (event) => {
		event.waitUntil(
			caches.open('offline-cache-v1').then((cache) => {
				// Create offline page in cache instead of expecting it to exist
				return cache.put('/offline.html', new Response(OFFLINE_HTML, {
					headers: { 'Content-Type': 'text/html' }
				}));
			})
		);
	});

	/**
	 * Enhanced precache configuration - only cache what actually exists
	 */
	workbox.precacheAndRoute(
		[
			{
				url: 'registerSW.js',
				revision: '3ca0b8505b4bec776b69afdba2768812'
			}
			// Remove offline.html from precache since we're handling it manually
		],
		{
			// Ignore URL parameters that might cause cache misses
			ignoreURLParametersMatching: [/^code$/, /^state$/, /^step$/]
		}
	);

	workbox.cleanupOutdatedCaches();

	// Google Fonts caching
	workbox.registerRoute(
		/^https:\/\/fonts\.googleapis\.com\/.*/i,
		new workbox.CacheFirst({
			cacheName: 'google-fonts-cache',
			plugins: [
				new workbox.ExpirationPlugin({
					maxEntries: 10,
					maxAgeSeconds: 31536000
				})
			]
		}),
		'GET'
	);

	workbox.registerRoute(
		/^https:\/\/fonts\.gstatic\.com\/.*/i,
		new workbox.CacheFirst({
			cacheName: 'gstatic-fonts-cache',
			plugins: [
				new workbox.ExpirationPlugin({
					maxEntries: 10,
					maxAgeSeconds: 31536000
				})
			]
		}),
		'GET'
	);

	// Images caching
	workbox.registerRoute(
		/\.(?:png|jpg|jpeg|svg|gif|webp)$/,
		new workbox.CacheFirst({
			cacheName: 'images-cache',
			plugins: [
				new workbox.ExpirationPlugin({
					maxEntries: 50,
					maxAgeSeconds: 2592000
				})
			]
		}),
		'GET'
	);

	// Enhanced pages cache with better offline handling
	workbox.registerRoute(
		({ request }) => request.destination === 'document',
		new workbox.NetworkFirst({
			cacheName: 'pages-cache',
			networkTimeoutSeconds: 3,
			plugins: [
				new workbox.ExpirationPlugin({
					maxEntries: 50,
					maxAgeSeconds: 604800
				}),
				{
					cacheWillUpdate: async ({ response }) => {
						// Only cache successful responses
						return response.status === 200 ? response : null;
					},
					handlerDidError: async () => {
						// Return offline page when network and cache fail
						return caches.match('/offline.html');
					}
				}
			]
		}),
		'GET'
	);

	// Special handling for onboarding routes to prevent caching issues
	workbox.registerRoute(
		({ request, url }) => {
			return request.mode === 'navigate' && 
				   (url.pathname.includes('/onboarding') || 
				    url.pathname === '/onboarding');
		},
		new workbox.NetworkFirst({
			cacheName: 'onboarding-cache',
			networkTimeoutSeconds: 2,
			plugins: [
				new workbox.ExpirationPlugin({
					maxEntries: 10,
					maxAgeSeconds: 300 // Only cache for 5 minutes
				}),
				{
					handlerWillRespond: async ({ response }) => {
						// For onboarding pages, always try to get fresh content
						if (response && response.status === 200) {
							// Add headers to prevent aggressive caching of onboarding pages
							const responseClone = response.clone();
							const headers = new Headers(responseClone.headers);
							headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
							headers.set('Pragma', 'no-cache');
							
							return new Response(responseClone.body, {
								status: responseClone.status,
								statusText: responseClone.statusText,
								headers: headers
							});
						}
						return response;
					},
					cacheWillUpdate: async () => {
						// Don't cache onboarding responses
						return null;
					}
				}
			]
		}),
		'GET'
	);

	// Assets caching (JS/CSS)
	workbox.registerRoute(
		({ request }) => request.destination === 'script' || request.destination === 'style',
		new workbox.StaleWhileRevalidate({
			cacheName: 'assets-cache',
			plugins: [
				new workbox.ExpirationPlugin({
					maxEntries: 100,
					maxAgeSeconds: 2592000
				})
			]
		}),
		'GET'
	);

	// Handle API calls with network first, fallback to cache
	workbox.registerRoute(
		/\/api\//,
		new workbox.NetworkFirst({
			cacheName: 'api-cache',
			networkTimeoutSeconds: 5,
			plugins: [
				new workbox.ExpirationPlugin({
					maxEntries: 50,
					maxAgeSeconds: 300 // 5 minutes for API responses
				}),
				{
					cacheWillUpdate: async ({ response }) => {
						// Only cache successful API responses
						return response.status === 200 ? response : null;
					}
				}
			]
		}),
		'GET'
	);
	
		// Bypass service worker for Supabase auth token refresh requests
		workbox.registerRoute(
			({ url }) => url.origin.includes('supabase.co') && url.pathname.includes('/auth/v1/token'),
			new workbox.NetworkOnly(),
			'POST'
		);
	
		// Message handling for cache management and onboarding fixes
		self.addEventListener('message', (event) => {
			console.log('SW received message:', event.data);
		
		if (event.data && event.data.type === 'CLEAR_ONBOARDING_CACHE') {
			event.waitUntil(
				Promise.all([
					caches.delete('onboarding-cache'),
					caches.delete('pages-cache')
				]).then(() => {
					console.log('SW: Cleared onboarding and pages cache');
					self.clients.matchAll().then(clients => {
						clients.forEach(client => {
							client.postMessage({ type: 'CACHE_CLEARED' });
						});
					});
				})
			);
		}
		
		if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
			event.waitUntil(
				caches.keys().then(cacheNames => {
					return Promise.all(
						cacheNames.map(cacheName => caches.delete(cacheName))
					);
				}).then(() => {
					console.log('SW: Cleared all caches');
					self.clients.matchAll().then(clients => {
						clients.forEach(client => {
							client.postMessage({ type: 'ALL_CACHES_CLEARED' });
						});
					});
				})
			);
		}
	});
});