# Vercel Deployment Steps - Family Finance PWA

## Step 1: Get Your Supabase Service Role Key

You need to get the service role key from your Supabase dashboard:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `tefdxwcdrecughdbditq`
3. Go to **Settings** → **API**
4. Copy the **service_role** key (it's different from the anon key)
5. **IMPORTANT**: Keep this key secure - never commit it to code!

## Step 2: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

## Step 3: Prepare Your Repository

Make sure your code is committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 4: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"Import Project"**
4. Select your GitHub repository
5. Vercel will auto-detect **SvelteKit** framework

### Option B: Using Vercel CLI

```bash
# In your project directory
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: family-finance-pwa
# - Directory: ./
# - Override settings? No
```

## Step 5: Configure Environment Variables in Vercel

In your Vercel dashboard, go to **Project Settings** → **Environment Variables** and add these:

### Required Environment Variables

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `PUBLIC_SUPABASE_URL` | `https://tefdxwcdrecughdbditq.supabase.co` | Production, Preview, Development |
| `PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZmR4d2NkcmVjdWdoZGJkaXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMzMxOTcsImV4cCI6MjA3MDgwOTE5N30.Xjs-r2wdpeIKxoFhUzyRQKHLJfQ2GWS29iuCswVtj8o` | Production, Preview, Development |
| `PRIVATE_SUPABASE_SERVICE_ROLE_KEY` | `[GET_FROM_STEP_1]` | Production, Preview, Development |
| `PUBLIC_APP_URL` | `https://your-app-name.vercel.app` | Production |
| `NODE_ENV` | `production` | Production |
| `PUBLIC_PWA_ENABLED` | `true` | Production, Preview, Development |
| `PUBLIC_OFFLINE_ENABLED` | `true` | Production, Preview, Development |
| `PUBLIC_SECURE_COOKIES` | `true` | Production |

### How to Add Each Variable:

1. Click **"Add New"**
2. Enter **Name** (e.g., `PUBLIC_SUPABASE_URL`)
3. Enter **Value** (e.g., `https://tefdxwcdrecughdbditq.supabase.co`)
4. Select **Environment**: `Production`, `Preview`, and `Development`
5. Click **"Save"**

## Step 6: Deploy with Build Cache Fix

### 🚨 CRITICAL: Clear Build Cache First
Recent fixes require a fresh build to resolve dependency conflicts:

1. **Commit Fixed Configuration** (if not done already):
   ```bash
   git add .
   git commit -m "Fix Vercel deployment: remove unused mdsvex dependency"
   git push origin main
   ```

2. **Deploy with Fresh Build**:
   - Go to **Deployments** tab in Vercel dashboard
   - Click **"Redeploy"** on latest deployment
   - **❌ IMPORTANT**: Select "Don't use existing Build Cache"
   - This prevents cached `mdsvex` and Rollup dependency issues

3. **Monitor Build Process**:
   - Expected build time: ~3-5 minutes
   - Watch for successful dependency resolution
   - Build should complete without `mdsvex` or `@rollup/rollup-linux-x64-gnu` errors

### Build Success Indicators:
```
✅ Installing dependencies (clean npm install)
✅ Running svelte-kit sync (no mdsvex errors)
✅ Building with Vite (no rollup issues)
✅ Optimizing for Vercel deployment
```

## Step 7: Update PUBLIC_APP_URL

Once deployed:

1. Note your Vercel app URL (e.g., `https://family-finance-pwa.vercel.app`)
2. Go back to **Environment Variables**
3. Update `PUBLIC_APP_URL` with your actual Vercel URL
4. Redeploy

## Step 8: Configure Supabase for Production

In your Supabase dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Site URL**: `https://your-app-name.vercel.app`
3. Add to **Redirect URLs**: 
   - `https://your-app-name.vercel.app/auth/callback`
   - `https://your-app-name.vercel.app`

## Step 9: Test Your Deployment

1. Visit your Vercel URL
2. Test user registration/login
3. Test family creation
4. Test invite functionality
5. Verify PWA installation works

## Step 10: Set Up Custom Domain (Optional)

1. In Vercel dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS as instructed
4. Update `PUBLIC_APP_URL` to your custom domain

## Troubleshooting

### Build Fails with "Cannot find module 'mdsvex'"
**Fixed in latest version** - This error occurred because:
- `mdsvex` was imported in `svelte.config.js` but not actually used
- **Solution**: Removed unused `mdsvex` import and dependency

### Build Fails with "Cannot find module '@rollup/rollup-linux-x64-gnu'"
**npm dependency bug** - This is a known npm issue:
- **Root Cause**: npm optional dependency resolution bug
- **Solution**: Clear build cache when redeploying:
  - Select "Don't use existing Build Cache" in Vercel
  - Or run `npm install` after removing `package-lock.json` and `node_modules`

### General Build Failures
- Check build logs in Vercel dashboard for specific errors
- Verify all environment variables are set correctly
- Ensure Node.js version compatibility (`>=18.0.0`)
- Clear build cache if configuration recently changed

### App Loads but Database Errors
- Verify Supabase environment variables are correct
- Check RLS policies are enabled
- Verify service role key is set correctly
- Test database connection from Supabase dashboard

### Authentication Issues
- Check Supabase URL configuration in Auth settings
- Verify redirect URLs include your Vercel domain
- Check environment variables are available in runtime
- Test auth flow with browser dev tools for network errors

### PWA Not Working
- Verify `PUBLIC_PWA_ENABLED=true` in environment variables
- Check service worker is generated in build output
- Test on HTTPS domain (required for PWA features)
- Verify manifest.json is accessible at `/manifest.json`

## Useful Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Deploy to preview
vercel --no-clipboard

# Deploy to production
vercel --prod

# Check environment variables
vercel env ls
```

## Security Checklist

- [ ] Service role key is set in Vercel (not in code)
- [ ] Supabase RLS policies are enabled
- [ ] Site URL and redirect URLs configured in Supabase
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] No sensitive data in client-side code

## Next Steps After Deployment

1. Test all functionality thoroughly
2. Set up monitoring and analytics
3. Configure custom domain if needed
4. Set up automated backups
5. Plan for scaling and optimization

---

**Your Vercel App**: https://family-finance-pwa.vercel.app (update with actual URL)
**Supabase Project**: https://tefdxwcdrecughdbditq.supabase.co