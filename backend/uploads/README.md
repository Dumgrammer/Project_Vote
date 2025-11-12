# Uploads Directory

This directory contains all uploaded files for the election system.

## Structure

```
uploads/
├── elections/     # Election banner images
└── .htaccess      # Apache configuration for serving files
```

## Image Upload Flow

### Backend
1. **Upload Handler** (`backend/utils/FileUpload.php`)
   - Validates file type (jpg, jpeg, png, gif, webp)
   - Validates file size (max 5MB)
   - Generates unique filename
   - Stores file in `uploads/elections/`
   - Returns filename for database storage

2. **Storage**
   - Images are stored in: `backend/uploads/elections/`
   - Database stores only the filename (not the full path)
   - Full URL is generated dynamically using `getFileUrl()`

3. **Serving Images**
   - Route: `GET /uploads/elections/{filename}`
   - Handled by Router.php
   - Sets appropriate MIME type
   - Serves file directly

### Frontend
1. **Upload** (`CreateElection.tsx`)
   - User selects image file
   - File is validated (type, size)
   - Preview is generated using FileReader
   - File object is sent via FormData (not base64)

2. **Display** (`Elections.tsx`)
   - Backend returns `img_url` field with relative path
   - Frontend converts to full URL using `getImageUrl()`
   - Images displayed using Material-UI CardMedia

## Security

- File type validation (images only)
- File size limit (5MB)
- Unique filenames prevent conflicts
- Files served with proper MIME types
- Direct file access via .htaccess

## Cleanup

When elections are deleted:
- Database record is removed
- Image file is automatically deleted via `FileUpload::delete()`
- No orphaned files remain

## Permissions

Ensure proper permissions on the uploads directory:
```bash
chmod 755 backend/uploads
chmod 755 backend/uploads/elections
```

## Configuration

Default settings in `FileUpload.php`:
- Max file size: 5MB (configurable in constructor)
- Allowed extensions: jpg, jpeg, png, gif, webp
- Upload directory: `./uploads/elections/`

