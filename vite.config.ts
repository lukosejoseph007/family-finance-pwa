import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		}),
		SvelteKitPWA({
			srcDir: './src',
			mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
			scope: '/',
			base: '/',
			selfDestroying: false,
			manifest: {
				short_name: 'Family Finance',
				name: 'Family Finance - Budgeting & Expense Tracker',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				theme_color: '#2563eb',
				background_color: '#ffffff',
				description: 'A comprehensive family finance management PWA using our proven budgeting methodology, designed specifically for families.',
				categories: ['finance', 'productivity', 'business'],
				icons: [
					{
						src: '/pwa-64x64.png',
						sizes: '64x64',
						type: 'image/png'
					},
					{
						src: '/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/maskable-icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				],
				screenshots: [
					{
						src: '/screenshot1.png',
						sizes: '1280x720',
						type: 'image/png'
					},
					{
						src: '/screenshot2.png',
						sizes: '1280x720',
						type: 'image/png'
					}
				]
			},
			workbox: {
				globPatterns: [
					'**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'
				],
				navigateFallback: '/offline.html',
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							}
						}
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'gstatic-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							}
						}
					},
					{
						urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'images-cache',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
							}
						}
					},
					{
						urlPattern: ({ request }) => request.destination === 'document',
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'pages-cache',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
							}
						}
					},
					{
						urlPattern: ({ request }) =>
							request.destination === 'script' || request.destination === 'style',
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'assets-cache',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
							}
						}
					}
				],
				skipWaiting: true,
				clientsClaim: true
			},
			kit: {
				trailingSlash: 'never'
			},
			devOptions: {
				enabled: true,
				suppressWarnings: process.env.SUPPRESS_PWA_WARNINGS === 'true',
				type: 'module',
				navigateFallback: '/',
				disableRuntimeConfig: false
			}
		}),
		visualizer({
			open: true,
			filename: 'dist/stats.html'
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
