import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class ManagePermissionsDto {
  @ApiProperty({
    example: ['VIEW_USER', 'ADD_USER'],
    description: 'Array of permission names to assign or revoke'
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Permissions array cannot be empty' })
  @IsString({ each: true })
  permissions: string[];
}
