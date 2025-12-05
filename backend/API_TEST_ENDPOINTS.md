# API Test Endpoints - Hostinger

Your API is working! Here are endpoints to test:

## ✅ Working Endpoint (You just tested)
```
GET https://darkred-magpie-601133.hostingersite.com/backend/Router.php?request=session
Response: {"status":"error","message":"Not authenticated","statusCode":401}
```
This is CORRECT - you're not logged in, so it returns 401.

## Test These Endpoints

### 1. Public Endpoints (No Auth Required)

#### Get Elections
```
GET https://darkred-magpie-601133.hostingersite.com/backend/Router.php?request=elections
```

#### Get Voter Elections
```
GET https://darkred-magpie-601133.hostingersite.com/backend/Router.php?request=voter-elections
```

#### Search Candidates (Public)
```
GET https://darkred-magpie-601133.hostingersite.com/backend/Router.php?request=search-candidates&election_id=1
```

### 2. Authentication Endpoints

#### Admin Login
```
POST https://darkred-magpie-601133.hostingersite.com/backend/Router.php?request=login
Body (JSON):
{
  "email": "your_admin_email@example.com",
  "password": "your_password"
}
```

#### Voter Login
```
POST https://darkred-magpie-601133.hostingersite.com/backend/Router.php?request=voter-login
Body (JSON):
{
  "email": "voter_email@example.com",
  "password": "voter_password"
}
```

### 3. After Login (Requires Auth)

Once logged in, test these:
```
GET .../backend/Router.php?request=check-auth
GET .../backend/Router.php?request=elections
GET .../backend/Router.php?request=candidates?election_id=1
```

## Update Your Frontend

Update your frontend API configuration:

**File: `frontend/src/config/axios.ts`**

```typescript
const API_URL = 'https://darkred-magpie-601133.hostingersite.com/backend';
```

Or if you want to keep it flexible:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://darkred-magpie-601133.hostingersite.com/backend'
    : 'http://localhost/Project_Vote/backend');
```

## Next Steps

1. ✅ API is accessible - DONE
2. ⏳ Test database connection (try login or get elections)
3. ⏳ Update frontend API URL
4. ⏳ Test file uploads (create election with image)
5. ⏳ Test full workflow (login → create election → create candidate → vote)

## Common Issues

### If you get database errors:
- Check `config/pollify.php` database credentials
- Make sure database exists in Hostinger
- Import your database schema

### If CORS errors in browser:
- Update `Router.php` - add your frontend URL to `$allowedOrigins`
- Make sure frontend is making requests to correct backend URL

### If file uploads fail:
- Create `uploads/` folder structure
- Set permissions to 755
- Check PHP upload limits in Hostinger

