import { PrismaClient } from '@prisma/client';

export const seedPositions = async (prisma: PrismaClient) => {
  console.log('📋 Seeding positions...');
  const adminPosition = await prisma.position.create({
    data: {
      name: 'Administrator',
      description: 'Full system access with all permissions',
    },
  });

  const memberPosition = await prisma.position.create({
    data: {
      name: 'Member',
      description: 'Standard user with limited permissions',
    },
  });

  console.log('✅ Positions seeded');
  return { adminPosition, memberPosition };
};
