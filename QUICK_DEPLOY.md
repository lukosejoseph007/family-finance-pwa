# Quick Deploy Checklist ✅

## What You Need to Do Right Now:

### 1. Get Your Service Role Key (5 minutes)
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `tefdxwcdrecughdbditq`
3. Click **Settings** → **API**
4. Copy the **service_role** key (different from anon key)
5. Keep it handy for Step 3

### 2. Deploy to Vercel (10 minutes)
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"Import Project"**
4. Connect your GitHub and select this repository
5. Vercel will auto-detect SvelteKit ✅

### 3. Add Environment Variables (5 minutes)
In Vercel dashboard → **Project Settings** → **Environment Variables**:

Copy/paste these exactly:

**PUBLIC_SUPABASE_URL**
```
https://tefdxwcdrecughdbditq.supabase.co
```

**PUBLIC_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZmR4d2NkcmVjdWdoZGJkaXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMzMxOTcsImV4cCI6MjA3MDgwOTE5N30.Xjs-r2wdpeIKxoFhUzyRQKHLJfQ2GWS29iuCswVtj8o
```

**PRIVATE_SUPABASE_SERVICE_ROLE_KEY**
```
[PASTE THE SERVICE ROLE KEY FROM STEP 1]
```

**NODE_ENV**
```
production
```

**PUBLIC_PWA_ENABLED**
```
true
```

**PUBLIC_OFFLINE_ENABLED**
```
true
```

**PUBLIC_SECURE_COOKIES**
```
true
```

For each variable:
- Select: **Production**, **Preview**, and **Development**
- Click **Save**

### 4. Deploy (2 minutes)
1. Go to **Deployments** tab
2. Click **"Redeploy"** if needed
3. Wait 3-5 minutes for build to complete
4. Get your live URL! 🎉

### 5. Update App URL (2 minutes)
1. Copy your Vercel URL (e.g., `https://family-finance-pwa-xyz.vercel.app`)
2. Add one more environment variable:

**PUBLIC_APP_URL**
```
[YOUR_VERCEL_URL_HERE]
```

3. Redeploy once more

### 6. Configure Supabase Auth (3 minutes)
1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL**: `[YOUR_VERCEL_URL]`
3. Add **Redirect URLs**: 
   - `[YOUR_VERCEL_URL]/auth/callback`
   - `[YOUR_VERCEL_URL]`

## ✅ Test Your Live App!
1. Visit your Vercel URL
2. Test signup/login
3. Create a family
4. Test invite system
5. Try installing as PWA

## 🆘 If Something Goes Wrong:
1. Check Vercel build logs
2. Verify all environment variables are set
3. Check Supabase auth configuration
4. Look at browser console for errors

---

**Total Time**: ~30 minutes
**Your app will be live at**: `https://your-app.vercel.app`

**Need help?** Check `VERCEL_DEPLOYMENT_STEPS.md` for detailed troubleshooting.