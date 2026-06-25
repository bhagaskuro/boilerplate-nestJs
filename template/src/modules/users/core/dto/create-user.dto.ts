import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsInt, IsBoolean, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'bhagaskoro@kulidigital.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ example: 'Bhagas' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  first_name: string;

  @ApiProperty({ example: 'Koro' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  last_name: string;

  @ApiProperty({ example: 2, description: 'Position ID' })
  @IsInt({ message: 'Position ID must be an integer' })
  @IsNotEmpty({ message: 'Position ID is required' })
  position_id: number;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean = true;
}
