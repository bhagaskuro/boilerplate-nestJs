import { ApiProperty } from '@nestjs/swagger';

export class LoginPositionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class LoginResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiProperty({ type: () => LoginPositionResponseDto })
  position: LoginPositionResponseDto;

  @ApiProperty({ type: [String] })
  permissions: string[];
}
