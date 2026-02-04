import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApi() {
    try {
        // Simulate what getMeService does
        const user = await prisma.user.findFirst({
            where: { email: 'clientd197@gmail.com' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                companyId: true,
                avatarUrl: true,
                googleAvatarUrl: true,
                emailNotificationsEnabled: true,
                inAppNotificationsEnabled: true,
                createdAt: true,
            },
        });

        console.log('API Response (what should be sent to frontend):');
        console.log(JSON.stringify(user, null, 2));

        if (user && user.googleAvatarUrl) {
            console.log('\n✓ googleAvatarUrl is included in the response');
        } else {
            console.log('\n❌ googleAvatarUrl is NOT in the response');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testApi();
