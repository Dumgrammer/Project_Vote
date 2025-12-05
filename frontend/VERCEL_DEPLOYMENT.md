# Fixing Frontend Deployment on Vercel

## Problem
Your frontend is still pointing to `localhost` instead of your Hostinger backend.

## Quick Fix: Set Environment Variable in Vercel

### Option 1: Vercel Dashboard (Fastest)

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://darkred-magpie-601133.hostingersite.com/backend`
   - **Environment:** Select all (Production, Preview, Development)
6. Click **Save**
7. Go to **Deployments** tab
8. Click **⋯** (three dots) on the latest deployment
9. Click **Redeploy**

### Option 2: Update Code and Push (If you prefer)

The code is already updated in `frontend/src/config/axios.ts`. Just:

1. Commit your changes:
   ```bash
   git add frontend/src/config/axios.ts
   git commit -m "Update API URL for production"
   git push
   ```

2. Vercel will automatically rebuild and deploy

## Verify It's Working

After redeploying, check the browser console. You should see requests going to:
```
https://darkred-magpie-601133.hostingersite.com/backend/?request=...
```

Instead of:
```
http://localhost/project_vote/backend/?request=...
```

## About the 401 Error

The `401 Unauthorized` error for `voter-elections` is **correct behavior**:
- Voters must log in first before they can see elections
- The endpoint requires authentication (this is by design)
- After login, the endpoint will work correctly

## Testing After Fix

1. **Voter Login:**
   - Should connect to Hostinger backend
   - Should set session cookie

2. **Fetch Elections:**
   - After login, `voter-elections` should work
   - Should return list of elections for that voter type

3. **Check Network Tab:**
   - All requests should go to `darkred-magpie-601133.hostingersite.com`
   - No more `localhost` requests

