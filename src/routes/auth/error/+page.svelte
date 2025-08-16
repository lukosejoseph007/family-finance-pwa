<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components';

	const message = $page.url.searchParams.get('message') || 'Authentication error occurred';
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
	<div class="max-w-md w-full space-y-8 p-8">
		<div class="text-center">
			<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
				<svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
			</div>
			<h2 class="mt-6 text-3xl font-extrabold text-gray-900">
				Authentication Error
			</h2>
			<p class="mt-2 text-sm text-gray-600">
				{message}
			</p>
		</div>

		<div class="space-y-4">
			<a href="/signup" class="w-full">
				<Button fullWidth>
					Try Signing Up Again
				</Button>
			</a>
			<a href="/login" class="w-full">
				<Button variant="outline" fullWidth>
					Back to Login
				</Button>
			</a>
		</div>
	</div>
</div>