import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/prisma/prisma.service';
import { PasswordUtil } from '@common/utils/password.util';
import { LoginDto } from './core/dto/login.dto';
import { RegisterDto } from './core/dto/register.dto';
import { AuthResponseDto } from './core/dto/auth-response.dto';
import { JwtPayload } from './core/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user with position and permissions
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        position: {
          include: {
            position_permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await PasswordUtil.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Build permissions array
    const permissions = user.position.position_permissions.map(
      (pp) => pp.permission.name,
    );

    // Generate JWT token
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      positionId: user.position.id,
      positionName: user.position.name,
      permissions,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        position: {
          id: user.position.id,
          name: user.position.name,
        },
        permissions,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, first_name, last_name, position_id } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Validate position exists
    const position = await this.prisma.position.findUnique({
      where: { id: position_id },
      include: {
        position_permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!position) {
      throw new BadRequestException('Invalid position ID');
    }

    // Hash password
    const hashedPassword = await PasswordUtil.hash(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        first_name,
        last_name,
        position_id,
      },
      include: {
        position: {
          include: {
            position_permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Build permissions array
    const permissions = user.position.position_permissions.map(
      (pp) => pp.permission.name,
    );

    // Generate JWT token
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      positionId: user.position.id,
      positionName: user.position.name,
      permissions,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        position: {
          id: user.position.id,
          name: user.position.name,
        },
        permissions,
      },
    };
  }
}
