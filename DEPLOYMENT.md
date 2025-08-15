# Deployment Guide - Family Finance PWA

This guide covers deploying the Family Finance application to Vercel with Supabase backend.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Set up database and authentication
3. **Git Repository**: Code hosted on GitHub/GitLab/Bitbucket

## Environment Variables

Set these in your Vercel dashboard under Project Settings > Environment Variables:

### Required Variables

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
PRIVATE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration  
PUBLIC_APP_URL=https://your-app-name.vercel.app
NODE_ENV=production

# PWA & Offline Support
PUBLIC_PWA_ENABLED=true
PUBLIC_OFFLINE_ENABLED=true

# Security
PUBLIC_SECURE_COOKIES=true
```

### Getting Supabase Keys

1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Copy the following:
   - **Project URL** → `PUBLIC_SUPABASE_URL`
   - **anon/public key** → `PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `PRIVATE_SUPABASE_SERVICE_ROLE_KEY`

## Deployment Steps

### 1. Prepare Repository

```bash
# Ensure all files are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Connect to Vercel

1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Select your Git repository
4. Choose "SvelteKit" framework (auto-detected)

### 3. Configure Build Settings

Vercel should auto-detect these settings:

- **Framework**: SvelteKit
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

### 4. Set Environment Variables

In Vercel dashboard:
1. Go to Project Settings > Environment Variables
2. Add each variable from the list above
3. Set Environment: `Production`, `Preview`, and `Development`

### 5. Deploy

1. Click "Deploy" 
2. Wait for build to complete (~3-5 minutes)
3. Visit your live URL

## Database Setup

### 1. Run Database Migrations

Execute these SQL commands in your Supabase SQL editor:

```sql
-- Run the complete schema from manual-schema.sql
-- This includes all tables, RLS policies, and functions
```

### 2. Verify RLS Policies

Ensure Row Level Security is enabled:

```sql
-- Check that RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('families', 'users', 'accounts', 'categories', 'transactions', 'budgets');
```

### 3. Test Authentication

1. Create a test user account
2. Verify family creation works
3. Test invite system functionality

## Custom Domain (Optional)

### 1. Add Domain in Vercel

1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed

### 2. Update Environment Variables

Update `PUBLIC_APP_URL` to your custom domain:

```bash
PUBLIC_APP_URL=https://your-custom-domain.com
```

## Monitoring & Analytics

### 1. Vercel Analytics

Enable in Project Settings > Analytics for:
- Page views and performance
- Core Web Vitals
- Error tracking

### 2. Supabase Monitoring

Monitor in Supabase dashboard:
- Database performance
- Authentication metrics
- API usage

## Troubleshooting

### Build Errors

1. **Node Version**: Ensure using Node 18+
   ```json
   // package.json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

2. **Environment Variables**: Verify all required vars are set

3. **Dependencies**: Check for missing packages
   ```bash
   npm audit fix
   ```

### Runtime Errors

1. **CORS Issues**: Verify Supabase URL configuration
2. **Authentication**: Check Supabase auth settings
3. **Database**: Verify RLS policies are correct

### Performance Issues

1. **Bundle Size**: Analyze with `npm run build`
2. **Images**: Ensure optimized images
3. **Caching**: Verify Vercel edge caching

## Security Checklist

- [ ] Environment variables properly set
- [ ] RLS policies enabled and tested
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Security headers configured (in vercel.json)
- [ ] Service role key kept secure
- [ ] No sensitive data in client-side code

## Rollback Procedure

If deployment fails:

1. **Vercel Dashboard**: Use "Promote to Production" on previous deployment
2. **Git Revert**: 
   ```bash
   git revert HEAD
   git push origin main
   ```
3. **Database**: Keep backups of schema changes

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **SvelteKit Docs**: [kit.svelte.dev](https://kit.svelte.dev)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

---

**Last Updated**: December 2024
**Deployment Target**: Vercel + Supabase
**Framework**: SvelteKit + TypeScript