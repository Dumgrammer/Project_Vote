# URGENT: Fix Vercel Deployment

## The Problem
Vercel is serving an OLD build that still has localhost URLs baked in. The code is fixed, but Vercel needs to rebuild.

## IMMEDIATE FIX (Choose One):

### Option 1: Set Environment Variable in Vercel (FASTEST - 2 minutes)

1. Go to: https://vercel.com/dashboard
2. Click your project: `project-vote-phi`
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://darkred-magpie-601133.hostingersite.com/backend`
   - **Environments:** ✅ Production ✅ Preview ✅ Development
6. Click **Save**
7. Go to **Deployments** tab
8. Find the latest deployment
9. Click **⋯** (three dots menu)
10. Click **Redeploy**
11. Wait for rebuild (2-3 minutes)

### Option 2: Push Code and Let Vercel Auto-Rebuild

```bash
git add .
git commit -m "Force production API URL - remove localhost"
git push
```

Vercel will automatically rebuild.

## Why This Happens

Vite builds your code at BUILD TIME, not runtime. So:
- Old build = localhost URLs baked in
- New build = production URLs baked in

The `.env.production` file I created will help, but you MUST rebuild.

## Verify It's Fixed

After redeploy, check browser console:
- ✅ Should see: `https://darkred-magpie-601133.hostingersite.com/backend/...`
- ❌ Should NOT see: `http://localhost/project_vote/backend/...`

## If Still Not Working

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check Vercel build logs to see if build succeeded
4. Verify environment variable is set correctly

