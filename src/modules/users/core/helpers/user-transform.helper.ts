import { User, Position, PositionPermission, Permission } from '@prisma/client';
import { UserEntity } from '../entities/user.entity';
type UserWithRelations = User & {
  position?: Position & {
    position_permissions?: (PositionPermission & {
      permission: Permission;
    })[];
  };
};

export class UserTransformHelper {
  static toEntity(user: UserWithRelations): UserEntity {
    const permissions = user.position?.position_permissions?.map(
      (pp) => pp.permission.name,
    ) || [];

    return new UserEntity({
      ...user,
      permissions,
      position: user.position ? {
        id: user.position.id,
        name: user.position.name,
        description: user.position.description,
      } : undefined,
    });
  }

  static toEntities(users: UserWithRelations[]): UserEntity[] {
    return users.map((user) => this.toEntity(user));
  }
}
