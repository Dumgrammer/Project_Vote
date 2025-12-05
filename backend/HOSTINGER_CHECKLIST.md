# Hostinger Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Database Setup
- [ ] Create MySQL database in Hostinger hPanel
- [ ] Note down database name (usually starts with `u123456789_`)
- [ ] Note down database username (usually starts with `u123456789_`)
- [ ] Set/reset database password
- [ ] Import your database schema using phpMyAdmin

### 2. Update Configuration Files

#### `backend/config/pollify.php`
```php
// Update these values:
define("SERVER", "localhost"); // Usually 'localhost' on Hostinger
define("DATABASE", "u123456789_yourdb"); // Your Hostinger database name
define("USER", "u123456789_youruser"); // Your Hostinger database username
define("PASSWORD", "your_secure_password"); // Your Hostinger database password
```

#### `backend/Router.php`
- [ ] Add your production frontend URL to `$allowedOrigins` array
- [ ] Verify CORS settings are correct

### 3. File Uploads Setup
- [ ] Create `uploads/` folder in backend directory
- [ ] Create subfolders: `uploads/elections/`, `uploads/candidates/`, `uploads/voters/`
- [ ] Set folder permissions to **755** (writable)

### 4. File Permissions
Set via FTP or File Manager:
- [ ] All PHP files: **644**
- [ ] All folders: **755**
- [ ] `.htaccess` file: **644**
- [ ] `uploads/` folder and subfolders: **755**

### 5. Upload Files
Upload via FTP or File Manager:
- [ ] All PHP files
- [ ] `.htaccess` file
- [ ] `config/` folder
- [ ] `controllers/` folder
- [ ] `utils/` folder
- [ ] `uploads/` folder structure

### 6. Test Endpoints

After deployment, test these URLs:

**Base URL:** `https://yourdomain.com/backend/`

- [ ] `GET /backend/session` - Should return session status
- [ ] `GET /backend/elections` - Should return elections list
- [ ] `POST /backend/login` - Test admin login
- [ ] `GET /backend/voter-session` - Test voter session

### 7. Common Issues & Quick Fixes

#### ❌ 500 Internal Server Error
**Fix:**
1. Check file permissions (644 for files, 755 for folders)
2. Check `.htaccess` exists and has correct syntax
3. Check error logs: Hostinger hPanel → Logs → Error Logs
4. Temporarily enable error display in Router.php to see the actual error

#### ❌ Database Connection Failed
**Fix:**
1. Verify database credentials in `config/pollify.php`
2. Make sure database name includes the prefix (e.g., `u123456789_pollify`)
3. Test database connection in phpMyAdmin
4. Check if database server is "localhost" (usually is on Hostinger)

#### ❌ CORS Error
**Fix:**
1. Update `$allowedOrigins` in `Router.php` with your frontend URL
2. Make sure frontend is making requests to correct backend URL
3. Check browser console for specific CORS error message

#### ❌ File Upload Not Working
**Fix:**
1. Create `uploads/` folder structure manually
2. Set permissions to 755 for all upload folders
3. Check PHP upload limits in Hostinger (usually 64MB)
4. Verify folder paths are correct

#### ❌ Session Not Working
**Fix:**
1. Check if cookies are being set (check browser DevTools)
2. Verify session_start() is being called
3. Check PHP session settings in Hostinger
4. Make sure you're using HTTPS in production (sessions work better)

### 8. Security Settings

Before going live:
- [ ] Error reporting is disabled in production (automatic now)
- [ ] Auth bypass is disabled in production (automatic now)
- [ ] CORS is configured for specific domains only
- [ ] Database password is strong
- [ ] File permissions are correct (not 777)

### 9. Update Frontend

Update your frontend API configuration:
```typescript
// In your axios config or API file
const API_URL = 'https://yourdomain.com/backend';
```

### 10. Final Testing

- [ ] Admin login works
- [ ] Voter login works
- [ ] Create election works
- [ ] Upload election image works
- [ ] Create candidate works
- [ ] Upload candidate photo works
- [ ] Create voter works
- [ ] Upload voter photo works
- [ ] Voting works
- [ ] Results display correctly

## 📞 Need Help?

1. **Check Error Logs**: Hostinger hPanel → Logs → Error Logs
2. **Enable Debug Mode**: Temporarily set `$isProduction = false` in Router.php
3. **Check PHP Version**: Hostinger usually runs PHP 7.4+ (check compatibility)
4. **Test Database**: Use phpMyAdmin to test database connection
5. **Check File Structure**: Make sure all files uploaded correctly

## 🔗 Useful Hostinger Links

- hPanel: https://hpanel.hostinger.com
- phpMyAdmin: Access via hPanel → Databases → phpMyAdmin
- File Manager: Access via hPanel → Files → File Manager
- Error Logs: Access via hPanel → Logs → Error Logs

