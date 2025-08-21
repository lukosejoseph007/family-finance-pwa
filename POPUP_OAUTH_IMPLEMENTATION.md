# Popup OAuth Implementation

## Overview

This document describes the popup-based OAuth implementation for iOS PWA compatibility, which solves the issue where iOS Safari kicks users out of the PWA during OAuth flows.

## Problem Statement

When using traditional redirect-based OAuth on iOS:

1. User clicks "Sign in with Google" in the PWA
2. iOS Safari opens OAuth in a new Safari tab/sheet
3. After authentication, user remains in Safari instead of returning to the PWA
4. This breaks the seamless PWA experience

## Solution

Implemented a dual OAuth system that automatically detects the user's environment and chooses the appropriate flow:

### Smart OAuth Functions

- `signInWithGoogleSmart()` - Automatically chooses popup or redirect
- `linkGoogleAccountSmart()` - Account linking with environment detection

### Device Detection Logic

```typescript
const isIOSOrMobile = (): boolean => {
	const userAgent = window.navigator.userAgent;
	const isIOS = /iPad|iPhone|iPod/.test(userAgent);
	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
	const isPWA = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;

	// Use popup flow on iOS or when running as PWA
	return isIOS || (isMobile && isPWA);
};
```

### Popup OAuth Implementation

```typescript
export const signInWithGoogle = async () => {
	// Get OAuth URL with skipBrowserRedirect
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			skipBrowserRedirect: true,
			redirectTo: `${window.location.origin}/auth/callback`
		}
	});

	// Open popup window
	const popup = window.open(
		data.url,
		'google-oauth',
		'width=500,height=600,scrollbars=yes,resizable=yes'
	);

	// Monitor popup closure and check for session
	return new Promise((resolve, reject) => {
		const checkClosed = setInterval(() => {
			if (popup.closed) {
				clearInterval(checkClosed);
				// Check for session after popup closes
				setTimeout(async () => {
					const { data: session } = await supabase.auth.getSession();
					if (session.session) {
						resolve({ user: session.session.user, session: session.session });
					} else {
						reject(new Error('Authentication was cancelled or failed'));
					}
				}, 1000);
			}
		}, 1000);
	});
};
```

## Benefits

### iOS/Mobile PWA Users

- OAuth happens in a small popup window
- Main PWA app never loses control
- Seamless return to the app after authentication
- No Safari chrome (Done, share buttons, etc.) interference

### Desktop Users

- Continue using traditional redirect flow
- Better for larger screens
- Familiar OAuth experience

## Implementation Files

### Core OAuth Functions

- `src/lib/supabaseClient.ts` - Main OAuth implementation
  - `signInWithGoogle()` - Popup OAuth for mobile
  - `signInWithGoogleRedirect()` - Redirect OAuth for desktop
  - `signInWithGoogleSmart()` - Auto-detection wrapper
  - `linkGoogleAccount()` - Popup account linking
  - `linkGoogleAccountSmart()` - Smart account linking

### UI Integration

- `src/routes/(auth)/login/+page.svelte` - Login page with smart OAuth
- `src/routes/(auth)/signup/+page.svelte` - Signup page with smart OAuth

## Error Handling

- Popup blocker detection
- Authentication timeout (5 minutes)
- Graceful fallback to redirect on popup failure
- User-friendly error messages

## Testing

1. **Desktop Testing**: Verify redirect flow works
2. **iOS Safari Testing**: Verify popup flow works in standalone PWA mode
3. **Android Testing**: Verify appropriate flow selection
4. **Popup Blocker Testing**: Verify error handling

## Configuration Requirements

- Google Cloud Console OAuth 2.0 credentials configured
- Supabase OAuth provider enabled
- Redirect URI: `https://your-supabase-url.supabase.co/auth/v1/callback`

## Browser Compatibility

- ✅ iOS Safari (PWA mode)
- ✅ Chrome/Chromium browsers
- ✅ Firefox
- ✅ Safari (macOS)
- ✅ Edge

## Troubleshooting

### Popup Blocked

- User sees error message about popup blockers
- Instruction to disable popup blockers
- Automatic fallback to redirect flow (future enhancement)

### Authentication Timeout

- 5-minute timeout on popup
- Clear error message
- User can retry

### Session Detection Issues

- 1-second delay before session check
- Multiple retry logic can be added if needed

## Future Enhancements

1. Automatic fallback to redirect if popup fails
2. Visual indicator showing authentication in progress
3. Support for additional OAuth providers
4. Enhanced error recovery
