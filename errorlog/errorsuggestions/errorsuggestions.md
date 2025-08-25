The Issue
When a previously authenticated user (who hasn't completed onboarding) tries to sign in again:

Google OAuth completes successfully
Your app immediately redirects to /onboarding
But your backend isn't ready to handle the onboarding request yet
This causes the 500 Internal Server Error

From your console logs, I can see:

🔄 Auth state change: SIGNED_IN lukoselrs@gmail.com
🔄 Auth state change: INITIAL_SESSION lukoselrs@gmail.com

This suggests your auth state is changing multiple times rapidly, likely causing the premature redirect.
Root Cause Analysis
The 500 error happens because:

Incomplete user state: The user exists in your auth system but doesn't have a family record
Premature redirect: Your app redirects to /onboarding before the session is fully established
Backend not ready: Your onboarding endpoint expects a fully authenticated session but receives a request during the auth transition

Likely Solutions
You need to fix the timing in your auth flow:
1. Add Proper Loading States
javascript// Wait for auth to fully settle before redirecting
useEffect(() => {
  if (authState === 'SIGNED_IN' && !isLoading && user) {
    // Check if user has completed onboarding
    if (!user.hasFamily) {
      router.push('/onboarding');
    }
  }
}, [authState, isLoading, user]);
2. Handle Incomplete Users in Onboarding Endpoint
Your /onboarding API should handle users who exist but haven't completed setup:
javascript// In your onboarding API
if (user && !user.familyId) {
  // User exists but needs to complete onboarding
  return { needsOnboarding: true, user };
} else if (user && user.familyId) {
  // User already has family, redirect appropriately
  return { redirect: '/dashboard' };
}
3. Add Retry Logic
Since you mentioned it works "after a few times going back," add exponential backoff:
javascriptconst handleAuthRedirect = async (retries = 3) => {
  try {
    await checkUserOnboardingStatus();
    // Proceed with redirect
  } catch (error) {
    if (retries > 0 && error.status === 500) {
      setTimeout(() => handleAuthRedirect(retries - 1), 1000);
    }
  }
};
The core issue is that your app is trying to access the onboarding endpoint before the authentication session is fully established on the backend. You need to ensure proper sequencing of auth completion → session establishment → onboarding check → redirect.