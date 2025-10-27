# Team Image Migration to Vercel Blob Storage

This document describes the migration from storing team images as base64 data in the database to using Vercel Blob storage.

## Overview

Previously, team images were stored as base64 data URLs directly in the database's `imageUrl` field. This approach had several limitations:
- Large database size due to base64 encoding overhead
- Poor performance when loading team lists
- Database backup/restore issues with large binary data

The new implementation uses Vercel Blob storage to store actual image files and only stores the blob URL in the database.

## Changes Made

### Backend Changes

1. **New Dependencies**
   - `@vercel/blob` - Vercel Blob storage SDK
   - `multer` - File upload handling
   - `@types/multer` - TypeScript types for multer

2. **New Files**
   - `backend/src/lib/blob.ts` - Blob storage utility class
   - `backend/src/routes/team-images.ts` - New API endpoints for image operations
   - `backend/src/scripts/migrate-images-to-blob.ts` - Migration script

3. **Updated Files**
   - `backend/src/index.ts` - Added team-images route
   - `backend/env.example` - Added BLOB_READ_WRITE_TOKEN

### Frontend Changes

1. **Updated Files**
   - `frontend/src/lib/api.ts` - Added teamImagesApi
   - `frontend/src/pages/DashboardPage.tsx` - Updated to use blob storage API
   - `frontend/src/components/CreateTeamModal.tsx` - Updated to use blob storage API

## API Endpoints

### New Team Image Endpoints

- `POST /api/team-images/:teamId/upload` - Upload image file (multipart/form-data)
- `POST /api/team-images/:teamId/upload-base64` - Upload base64 image data (for backward compatibility)
- `DELETE /api/team-images/:teamId` - Delete team image

### Updated Team Endpoints

The existing team endpoints (`/api/teams`) now work with blob URLs instead of base64 data.

## Environment Variables

Add the following environment variable to your `.env` file:

```env
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token-here
```

To get your Vercel Blob token:
1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to Settings > Environment Variables
4. Add `BLOB_READ_WRITE_TOKEN` with your blob storage token

## Migration Process

### For New Deployments

1. Set up the `BLOB_READ_WRITE_TOKEN` environment variable
2. Deploy the updated code
3. The system will automatically use blob storage for new team images

### For Existing Deployments

1. Set up the `BLOB_READ_WRITE_TOKEN` environment variable
2. Deploy the updated code
3. Run the migration script to convert existing base64 images:

```bash
cd backend
npx ts-node src/scripts/migrate-images-to-blob.ts
```

The migration script will:
- Find all teams with base64 image data
- Upload each image to Vercel Blob storage
- Update the database with the new blob URL
- Provide a summary of successful/failed migrations

## File Organization

Images are stored in Vercel Blob with the following structure:
```
teams/
  {teamId}/
    team-{teamId}-{timestamp}.{extension}
```

Example:
```
teams/
  abc123-def456-ghi789/
    team-abc123-def456-ghi789-2024-01-15T10-30-45-123Z.jpg
```

## Benefits

1. **Reduced Database Size** - No more large base64 strings in the database
2. **Better Performance** - Faster queries and reduced memory usage
3. **CDN Delivery** - Images served from Vercel's global CDN
4. **Scalability** - No database size limits for image storage
5. **Cost Efficiency** - Pay only for actual storage used

## Error Handling

- If image upload fails during team creation, the team is still created (without image)
- If image upload fails during update, the old image is preserved
- Failed image deletions are logged but don't prevent team operations
- All blob operations include proper error handling and logging

## Security

- Only team admins can upload/delete team images
- File type validation (images only)
- File size limits (5MB maximum)
- Proper authentication required for all image operations

## Rollback Plan

If you need to rollback to base64 storage:

1. Revert the frontend changes to use base64 encoding
2. Update the team creation/update logic to convert blob URLs back to base64
3. The database schema remains compatible (imageUrl field still exists)

## Monitoring

Monitor the following metrics:
- Blob storage usage in Vercel dashboard
- API response times for image operations
- Error rates for image uploads/deletions
- Database size reduction after migration
