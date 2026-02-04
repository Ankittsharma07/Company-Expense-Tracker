import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAuthProvider() {
    try {
        console.log('Adding LOCAL_GOOGLE to AuthProvider enum...');

        await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'LOCAL_GOOGLE' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuthProvider')
        ) THEN
          ALTER TYPE "AuthProvider" ADD VALUE 'LOCAL_GOOGLE';
          RAISE NOTICE 'Added LOCAL_GOOGLE to AuthProvider enum';
        ELSE
          RAISE NOTICE 'LOCAL_GOOGLE already exists in AuthProvider enum';
        END IF;
      END $$;
    `);

        console.log('✓ Database updated successfully!');
    } catch (error) {
        console.error('Error updating database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

updateAuthProvider();
