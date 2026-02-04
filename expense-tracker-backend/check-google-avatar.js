import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGoogleAvatar() {
    try {
        // Find the user who logged in with Google
        const user = await prisma.user.findUnique({
            where: { email: 'clientd197@gmail.com' }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('User found:');
        console.log('- Name:', user.name);
        console.log('- Email:', user.email);
        console.log('- authProvider:', user.authProvider);
        console.log('- avatarUrl:', user.avatarUrl);
        console.log('- googleAvatarUrl:', user.googleAvatarUrl);

        if (!user.googleAvatarUrl) {
            console.log('\n⚠️  googleAvatarUrl is NULL - This is the problem!');
            console.log('The avatar URL was not saved when you logged in with Google.');
        } else {
            console.log('\n✓ googleAvatarUrl is set correctly');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkGoogleAvatar();
