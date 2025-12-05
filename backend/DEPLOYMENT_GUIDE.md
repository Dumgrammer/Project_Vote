# Hostinger Deployment Guide

## Step-by-Step Instructions

### 1. Update Database Configuration

Edit `backend/config/pollify.php` and update these values with your Hostinger database credentials:

```php
define("SERVER", "localhost"); // Usually 'localhost' on Hostinger
define("DATABASE", "u123456789_pollify"); // Your Hostinger database name
define("USER", "u123456789_admin"); // Your Hostinger database username  
define("PASSWORD", "your_password_here"); // Your Hostinger database password
```

**How to find your Hostinger database credentials:**
- Log into Hostinger hPanel
- Go to **Databases** → **MySQL Databases**
- You'll see your database name, username, and can reset the password

### 2. Update CORS Headers

Edit `backend/Router.php` and add your production frontend URL to the `$allowedOrigins` array:

```php
$allowedOrigins = [
    'http://localhost:5173',
    'https://project-vote-phi.vercel.app',
    'https://yourdomain.com', // Add your production frontend URL here
    'https://www.yourdomain.com', // If you use www subdomain
];
```

### 3. Upload Files to Hostinger

**Via FTP/File Manager:**
1. Upload the entire `backend` folder to your Hostinger public_html directory
2. Structure should be: `public_html/backend/` (or `public_html/api/` if you prefer)

**Important files to upload:**
- All PHP files (Router.php, controllers, config, etc.)
- `.htaccess` file
- `uploads/` folder (create it if it doesn't exist, set permissions to 755)

### 4. Set File Permissions

Set these permissions via FTP or File Manager:
- Folders: **755**
- PHP files: **644**
- `.htaccess`: **644**
- `uploads/` folder: **755** (writable)

### 5. Create Database and Import Schema

1. Create a new MySQL database in Hostinger hPanel
2. Import your database schema (SQL file) using phpMyAdmin
3. Update the database credentials in `config/pollify.php`

### 6. Test Your API

Your API endpoint will be:
```
https://yourdomain.com/backend/Router.php?request=session
```

Or if using .htaccess rewrite:
```
https://yourdomain.com/backend/session
```

### 7. Common Issues & Solutions

#### Issue: "500 Internal Server Error"
- **Solution**: Check file permissions (should be 644 for files, 755 for folders)
- Check `.htaccess` file exists and has correct permissions
- Check error logs in Hostinger hPanel → **Logs**

#### Issue: "Database Connection Failed"
- **Solution**: Verify database credentials in `config/pollify.php`
- Make sure database name, username, and password are correct
- Check if database server is "localhost" (usually is on Hostinger)

#### Issue: "CORS Error"
- **Solution**: Update `$allowedOrigins` array in `Router.php` with your frontend URL
- Make sure your frontend is making requests to the correct backend URL

#### Issue: "File Upload Not Working"
- **Solution**: Check `uploads/` folder exists and has write permissions (755)
- Create subfolders: `uploads/elections/`, `uploads/candidates/`, `uploads/voters/`
- Set permissions to 755 for all upload folders

#### Issue: "Session Not Working"
- **Solution**: Check PHP session settings in Hostinger
- Make sure `session_start()` is being called (it's in AdminController/VoterAuthController)
- Check if cookies are being set properly

### 8. Update Frontend API URL

Update your frontend `axios.ts` or API configuration to point to your Hostinger backend:

```typescript
const API_URL = 'https://yourdomain.com/backend';
// or
const API_URL = 'https://yourdomain.com/api'; // if you renamed the folder
```

### 9. Security Checklist

- ✅ Error reporting disabled in production
- ✅ Auth bypass disabled in production  
- ✅ CORS configured for specific domains only
- ✅ Database credentials updated
- ✅ File permissions set correctly
- ✅ `.htaccess` configured properly

### 10. Testing Checklist

Test these endpoints after deployment:
- [ ] `GET /backend/session` - Check admin session
- [ ] `POST /backend/login` - Admin login
- [ ] `GET /backend/elections` - Get elections
- [ ] `GET /backend/voter-session` - Check voter session
- [ ] File uploads (elections, candidates, voters)

## Need Help?

If you're still having issues:
1. Check Hostinger error logs: hPanel → **Logs** → **Error Logs**
2. Enable temporary error display in `Router.php` (set `$isProduction = false` temporarily)
3. Check PHP version compatibility (Hostinger usually runs PHP 7.4+)
4. Verify all files uploaded correctly (no corrupted files)

