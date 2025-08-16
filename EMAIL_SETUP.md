# Email Setup Guide

## 🚨 **Current Status: Development Mode**

The email invitation system is now **working** but in development mode. Here's how to enable real email sending:

## 📧 **Setup Real Email Sending (5 minutes)**

### 1. Sign up for Resend (Free)
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (3,000 emails/month free)
3. Verify your account

### 2. Get Your API Key
1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Click **"Create API Key"**
3. Name it: `Family Finance PWA`
4. Copy the API key (starts with `re_`)

### 3. Update Environment Variable
1. Open `family-finance-pwa/.env`
2. Replace this line:
   ```
   PRIVATE_RESEND_API_KEY=re_demo_key_placeholder
   ```
   With your real API key:
   ```
   PRIVATE_RESEND_API_KEY=re_your_actual_api_key_here
   ```

### 4. Restart Development Server
```bash
npm run dev
```

## ✅ **Test Email Sending**

1. Go to family settings
2. Try inviting a user by email
3. Check your email inbox!

## 🔧 **Current Development Behavior**

When `PRIVATE_RESEND_API_KEY` is not configured:
- ✅ Shows "Email sent successfully" message
- 📝 Logs email content to server console
- 🔧 Provides setup instructions

When properly configured:
- ✅ Sends real professional HTML emails
- 📧 Includes clickable invite links
- 🎨 Beautiful responsive email design

## 📋 **Email Template Features**

- **Professional Design**: Gradient header, clean layout
- **Responsive**: Works on mobile and desktop
- **Clear Instructions**: Step-by-step joining process
- **Direct Links**: One-click signup with invite code
- **Security**: Clear sender identification

## 🚀 **Production Deployment**

For Vercel deployment, add the environment variable:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add `PRIVATE_RESEND_API_KEY` with your API key
3. Select: Production, Preview, and Development
4. Redeploy

## 🛡️ **Security Notes**

- ✅ API key is server-side only (never exposed to browser)
- ✅ Rate limiting handled by Resend
- ✅ Professional "from" address: `invitations@familyfinance.app`
- ✅ Proper error handling and validation

---

**Ready to enable real email sending? Follow steps 1-4 above!**