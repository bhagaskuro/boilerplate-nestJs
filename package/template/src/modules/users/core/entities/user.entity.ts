import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User as PrismaUser, Position } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserEntity implements Partial<PrismaUser> {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @Exclude()
  password: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  position_id: number;

  @ApiPropertyOptional()
  position?: Partial<Position>;

  @ApiPropertyOptional()
  permissions?: string[];

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional()
  deleted_at: Date | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
