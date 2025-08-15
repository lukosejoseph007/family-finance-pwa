<script lang="ts">
  import { user } from '$lib/store';
  import { signIn, signUp } from '$lib/supabaseClient';

  let email = '';
  let password = '';
  let isSigningIn = true;
  let error: string | null = null;
  let loading = false;

  async function handleSubmit() {
    if (!email || !password) {
      error = 'Please enter both email and password';
      return;
    }

    error = null;
    loading = true;

    try {
      let data;
      if (isSigningIn) {
        console.log('Attempting sign in...');
        data = await signIn(email, password);
      } else {
        console.log('Attempting sign up...');
        data = await signUp(email, password);
      }

      console.log('Authentication result:', data);

      if (data?.user) {
        // Update the user store
        user.set(data.user);
        console.log('User logged in successfully:', data.user);
      } else {
        error = 'Authentication failed. Please try again.';
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      error = err.message || 'An error occurred during authentication';
    } finally {
      loading = false;
    }
  }
</script>

{#if $user}
  <div class="flex justify-center items-center h-screen">
    <div class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h1 class="text-3xl font-bold mb-4">Welcome to Family Finance Tracker!</h1>
      <p class="text-gray-700">You are signed in as: {$user.email}</p>
    </div>
  </div>
{:else}
  <div class="flex justify-center items-center h-screen">
    <div class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md">
      <h2 class="text-2xl font-bold mb-4">{isSigningIn ? 'Sign In' : 'Sign Up'}</h2>
      <form on:submit|preventDefault={handleSubmit}>
        <div class="mb-4">
          <label class="block text-gray-700 font-bold mb-2" for="email">
            Email
          </label>
          <input
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            placeholder="Enter your email"
            bind:value={email}
          />
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 font-bold mb-2" for="password">
            Password
          </label>
          <input
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="Enter your password"
            bind:value={password}
          />
        </div>
        {#if error}
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            {error}
          </div>
        {/if}
        <div class="flex items-center justify-between">
          <button
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Loading...' : (isSigningIn ? 'Sign In' : 'Sign Up')}
          </button>
          <a
            href="#"
            class="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
            on:click|preventDefault={() => (isSigningIn = !isSigningIn)}
          >
            {isSigningIn ? 'Create an account' : 'Sign in instead'}
          </a>
        </div>
      </form>
    </div>
  </div>
{/if}
