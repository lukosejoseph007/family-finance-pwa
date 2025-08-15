<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { user } from '$lib/store';

  let { children } = $props();

  function signOut() {
    // For now, just clear the user store
    $user = null;
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<header class="bg-gray-800 text-white py-4 px-6">
  <div class="flex justify-between items-center">
    <a href="/" class="text-xl font-bold">Family Finance Tracker</a>
    <div>
      {#if $user}
        <button on:click={signOut} class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">Sign Out</button>
      {:else}
        <span class="text-gray-300">Welcome! Please sign in below.</span>
      {/if}
    </div>
  </div>
</header>

{@render children?.()}
