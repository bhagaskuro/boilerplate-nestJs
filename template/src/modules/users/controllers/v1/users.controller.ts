import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from '../../users.service';
import { CreateUserDto } from '@modules/users/core/dto/create-user.dto';
import { UpdateUserDto } from '@modules/users/core/dto/update-user.dto';
import { ChangePositionDto } from '@modules/users/core/dto/change-position.dto';
import { ManagePermissionsDto } from '@modules/users/core/dto/manage-permissions.dto';
import { UserQueryDto } from '@modules/users/core/dto/user-query.dto';
import { UserEntity } from '../../core/entities/user.entity';
import { Permissions } from '@common/decorators/permissions.decorator';
import { PERMISSIONS } from '@common/constants/permissions.constant';
import {
  ApiSuccessResponse,
  ApiSuccessArrayResponse,
} from '@common/decorators/api-response.decorator';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions(PERMISSIONS.USER.ADD)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiSuccessResponse(UserEntity)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Permissions(PERMISSIONS.USER.VIEW)
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiSuccessResponse(PaginatedResponseDto<UserEntity>)
  async findAll(@Query() query: UserQueryDto): Promise<PaginatedResponseDto<UserEntity>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.USER.VIEW)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiSuccessResponse(UserEntity)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserEntity> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.USER.UPDATE)
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', type: Number })
  @ApiSuccessResponse(UserEntity)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.USER.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }

  @Patch(':id/position')
  @Permissions(PERMISSIONS.USER.CHANGE_POSITION)
  @ApiOperation({ summary: 'Change user position/role' })
  @ApiParam({ name: 'id', type: Number })
  @ApiSuccessResponse(UserEntity)
  async changePosition(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePositionDto: ChangePositionDto,
  ): Promise<UserEntity> {
    return this.usersService.changePosition(id, changePositionDto);
  }

  @Post(':id/permissions/assign')
  @Permissions(PERMISSIONS.USER.MANAGE_PERMISSION)
  @ApiOperation({ summary: 'Assign permissions to user position' })
  @ApiParam({ name: 'id', type: Number })
  @ApiSuccessResponse(UserEntity)
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() managePermissionsDto: ManagePermissionsDto,
  ): Promise<UserEntity> {
    return this.usersService.assignPermissions(id, managePermissionsDto);
  }

  @Post(':id/permissions/revoke')
  @Permissions(PERMISSIONS.USER.MANAGE_PERMISSION)
  @ApiOperation({ summary: 'Revoke permissions from user position' })
  @ApiParam({ name: 'id', type: Number })
  @ApiSuccessResponse(UserEntity)
  async revokePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() managePermissionsDto: ManagePermissionsDto,
  ): Promise<UserEntity> {
    return this.usersService.revokePermissions(id, managePermissionsDto);
  }
}
