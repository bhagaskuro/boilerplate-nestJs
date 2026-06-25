import { PrismaClient } from '@prisma/client';

export const seedPermissions = async (
  prisma: PrismaClient,
  adminPositionId: number,
  memberPositionId: number,
) => {
  console.log('🔐 Seeding permissions...');

  const permissionsData = [
    // User Management
    { name: 'VIEW_USER', resource: 'USER', action: 'VIEW', description: 'View user information' },
    { name: 'ADD_USER', resource: 'USER', action: 'ADD', description: 'Create new user' },
    { name: 'UPDATE_USER', resource: 'USER', action: 'UPDATE', description: 'Update user information' },
    { name: 'DELETE_USER', resource: 'USER', action: 'DELETE', description: 'Delete user' },
    { name: 'MANAGE_USER_PERMISSION', resource: 'USER', action: 'MANAGE_PERMISSION', description: 'Assign or revoke user permissions' },
    { name: 'CHANGE_USER_POSITION', resource: 'USER', action: 'CHANGE_POSITION', description: 'Change user position/role' },

    // Position Management
    { name: 'VIEW_POSITION', resource: 'POSITION', action: 'VIEW', description: 'View position information' },
    { name: 'ADD_POSITION', resource: 'POSITION', action: 'ADD', description: 'Create new position' },
    { name: 'UPDATE_POSITION', resource: 'POSITION', action: 'UPDATE', description: 'Update position information' },
    { name: 'DELETE_POSITION', resource: 'POSITION', action: 'DELETE', description: 'Delete position' },

    // Permission Management
    { name: 'VIEW_PERMISSION', resource: 'PERMISSION', action: 'VIEW', description: 'View permission information' },
    { name: 'ADD_PERMISSION', resource: 'PERMISSION', action: 'ADD', description: 'Create new permission' },
    { name: 'UPDATE_PERMISSION', resource: 'PERMISSION', action: 'UPDATE', description: 'Update permission information' },
    { name: 'DELETE_PERMISSION', resource: 'PERMISSION', action: 'DELETE', description: 'Delete permission' },
  ];

  const permissions = await Promise.all(
    permissionsData.map((permission) =>
      prisma.permission.create({ data: permission }),
    ),
  );

  console.log(`✅ ${permissions.length} permissions seeded`);

  // ============================================
  // Assign Permissions to Positions
  // ============================================
  console.log('🔗 Assigning permissions to positions...');

  // Admin gets all permissions
  const adminPermissions = permissions.map((permission) => ({
    position_id: adminPositionId,
    permission_id: permission.id,
  }));

  await prisma.positionPermission.createMany({
    data: adminPermissions,
  });

  // Member gets only VIEW_USER permission
  const viewUserPermission = permissions.find((p) => p.name === 'VIEW_USER');
  if (viewUserPermission) {
    await prisma.positionPermission.create({
      data: {
        position_id: memberPositionId,
        permission_id: viewUserPermission.id,
      },
    });
  }

  console.log('✅ Permissions assigned to positions');
};
