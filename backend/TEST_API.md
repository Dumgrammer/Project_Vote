# Testing Your API on Hostinger

## Option 1: Direct Router.php Access (Most Reliable)

If `.htaccess` rewrite isn't working, access Router.php directly:

```
https://yourdomain.com/backend/Router.php?request=session
https://yourdomain.com/backend/Router.php?request=elections
https://yourdomain.com/backend/Router.php?request=voter-session
```

## Option 2: Using index.php

Try accessing via index.php:

```
https://yourdomain.com/backend/index.php?request=session
https://yourdomain.com/backend/?request=session
```

## Option 3: Clean URLs (If .htaccess works)

If rewrite rules work:

```
https://yourdomain.com/backend/session
https://yourdomain.com/backend/elections
https://yourdomain.com/backend/voter-session
```

## Quick Test URLs

Test these endpoints to verify your API is working:

### 1. Test Session (No auth required)
```
GET https://yourdomain.com/backend/Router.php?request=session
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "authenticated": false
  },
  "statusCode": 200
}
```

### 2. Test Elections (Public endpoint)
```
GET https://yourdomain.com/backend/Router.php?request=elections
```

### 3. Test Database Connection
If you get a database error, check your `config/pollify.php` credentials.

## Troubleshooting "Page Doesn't Exist"

### Issue: 404 Not Found
**Possible Causes:**
1. Wrong URL path
2. `.htaccess` not working
3. Files not uploaded correctly
4. Wrong directory structure

**Solutions:**

1. **Check File Structure:**
   ```
   public_html/
   ├── backend/
   │   ├── Router.php
   │   ├── index.php
   │   ├── .htaccess
   │   ├── config/
   │   ├── controllers/
   │   └── utils/
   ```

2. **Try Direct Access:**
   ```
   https://yourdomain.com/backend/Router.php?request=session
   ```

3. **Check if Router.php exists:**
   ```
   https://yourdomain.com/backend/Router.php
   ```
   (Should show JSON error or response)

4. **Check .htaccess:**
   - Make sure `.htaccess` file exists
   - Check file permissions (should be 644)
   - Verify mod_rewrite is enabled (usually is on Hostinger)

5. **Check File Permissions:**
   - Router.php: 644
   - .htaccess: 644
   - Folders: 755

## Subdomain Setup (Optional)

If you want a cleaner URL, you can set up a subdomain:

### Option A: api.yourdomain.com
1. Create subdomain `api` in Hostinger
2. Point it to `public_html/api` folder
3. Upload backend files to `public_html/api/`
4. Access: `https://api.yourdomain.com/Router.php?request=session`

### Option B: yourdomain.com/api
1. Upload backend folder to `public_html/api/`
2. Access: `https://yourdomain.com/api/Router.php?request=session`

## Recommended Setup

**Best Practice:** Use direct Router.php access initially, then set up subdomain later:

```
https://yourdomain.com/backend/Router.php?request=session
```

This is the most reliable method and works regardless of .htaccess configuration.

