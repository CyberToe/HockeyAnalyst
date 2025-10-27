import { PrismaClient } from '@prisma/client';
import { blobStorage, BlobStorage } from '../lib/blob';

const prisma = new PrismaClient();

/**
 * Migration script to convert existing base64 team images to Vercel Blob storage
 * This script should be run once to migrate existing data
 */
async function migrateImagesToBlob() {
  console.log('Starting migration of team images to Vercel Blob storage...');

  try {
    // Find all teams with base64 image data
    const teamsWithImages = await prisma.team.findMany({
      where: {
        imageUrl: {
          not: null,
          startsWith: 'data:image/'
        }
      }
    });

    console.log(`Found ${teamsWithImages.length} teams with base64 images to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const team of teamsWithImages) {
      try {
        console.log(`Migrating image for team: ${team.name} (${team.id})`);

        // Convert base64 to buffer
        const buffer = BlobStorage.dataUrlToBuffer(team.imageUrl!);
        const mimeType = BlobStorage.getMimeTypeFromDataUrl(team.imageUrl!);
        
        // Create a File-like object for the blob storage
        const file = new File([buffer], 'team-image', { type: mimeType });

        // Upload to blob storage
        const blobResult = await blobStorage.uploadTeamImage(file, team.id);

        // Update team with new blob URL
        await prisma.team.update({
          where: { id: team.id },
          data: { imageUrl: blobResult.url }
        });

        console.log(`✅ Successfully migrated image for team: ${team.name}`);
        successCount++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Failed to migrate image for team ${team.name} (${team.id}):`, error);
        errorCount++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total teams processed: ${teamsWithImages.length}`);
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Failed migrations: ${errorCount}`);
    console.log('========================');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateImagesToBlob()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateImagesToBlob };