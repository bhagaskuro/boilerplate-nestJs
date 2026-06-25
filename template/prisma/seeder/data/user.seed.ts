import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export const seedUsers = async (
  prisma: PrismaClient,
  adminPositionId: number,
  memberPositionId: number,
) => {
  console.log('👥 Seeding users...');

  const defaultPassword = 'password123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@kulidigital.com',
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'Kuli Digital',
      position_id: adminPositionId,
      is_active: true,
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      email: 'member@kulidigital.com',
      password: hashedPassword,
      first_name: 'Member',
      last_name: 'User',
      position_id: memberPositionId,
      is_active: true,
    },
  });

  console.log('✅ Users seeded');

  return { adminUser, memberUser, defaultPassword };
};
