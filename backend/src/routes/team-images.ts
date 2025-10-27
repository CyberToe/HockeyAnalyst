import express from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { blobStorage, BlobStorage } from '../lib/blob';
import { AuthRequest, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload team image
router.post('/:teamId/upload', requireAdmin, upload.single('image'), async (req: AuthRequest, res, next) => {
  try {
    const { teamId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Check if team exists and user has admin access
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        members: {
          some: {
            userId: req.userId,
            role: 'admin'
          }
        },
        deleted: false
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found or access denied' });
    }

    // Delete old image if it exists
    if (team.imageUrl && team.imageUrl.startsWith('https://')) {
      try {
        await blobStorage.deleteTeamImage(team.imageUrl);
      } catch (error) {
        console.warn('Failed to delete old team image:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new image to blob storage
    const blobResult = await blobStorage.uploadTeamImage(file, teamId);

    // Update team with new image URL
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { imageUrl: blobResult.url },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Team image uploaded successfully',
      team: updatedTeam,
      imageUrl: blobResult.url
    });
  } catch (error) {
    next(error);
  }
});

// Upload team image from base64 data URL (for backward compatibility)
router.post('/:teamId/upload-base64', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { teamId } = req.params;
    const { imageData } = req.body;

    if (!imageData || !imageData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }

    // Check if team exists and user has admin access
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        members: {
          some: {
            userId: req.userId,
            role: 'admin'
          }
        },
        deleted: false
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found or access denied' });
    }

    // Delete old image if it exists
    if (team.imageUrl && team.imageUrl.startsWith('https://')) {
      try {
        await blobStorage.deleteTeamImage(team.imageUrl);
      } catch (error) {
        console.warn('Failed to delete old team image:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Convert base64 to buffer
    const buffer = BlobStorage.dataUrlToBuffer(imageData);
    const mimeType = BlobStorage.getMimeTypeFromDataUrl(imageData);
    
    // Create a File-like object for the blob storage
    const file = new File([buffer], 'team-image', { type: mimeType });

    // Upload to blob storage
    const blobResult = await blobStorage.uploadTeamImage(file, teamId);

    // Update team with new image URL
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { imageUrl: blobResult.url },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Team image uploaded successfully',
      team: updatedTeam,
      imageUrl: blobResult.url
    });
  } catch (error) {
    next(error);
  }
});

// Delete team image
router.delete('/:teamId', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { teamId } = req.params;

    // Check if team exists and user has admin access
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        members: {
          some: {
            userId: req.userId,
            role: 'admin'
          }
        },
        deleted: false
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found or access denied' });
    }

    // Delete image from blob storage if it exists
    if (team.imageUrl && team.imageUrl.startsWith('https://')) {
      try {
        await blobStorage.deleteTeamImage(team.imageUrl);
      } catch (error) {
        console.warn('Failed to delete team image from blob storage:', error);
        // Continue with database update even if blob deletion fails
      }
    }

    // Update team to remove image URL
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { imageUrl: null },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Team image deleted successfully',
      team: updatedTeam
    });
  } catch (error) {
    next(error);
  }
});

export default router;