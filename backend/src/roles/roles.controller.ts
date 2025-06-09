import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('roles')
@UseGuards(AdminGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Role> {
    return this.rolesService.findOne(id);
  }

  @Post()
  async create(@Body() createRoleDto: Partial<Role>): Promise<Role> {
    return this.rolesService.create(createRoleDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: Partial<Role>
  ): Promise<Role> {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions/:permissionCode')
  async assignPermission(
    @Param('id') id: string,
    @Param('permissionCode') permissionCode: string
  ): Promise<Role> {
    return this.rolesService.assignPermission(id, permissionCode);
  }

  @Delete(':id/permissions/:permissionCode')
  async revokePermission(
    @Param('id') id: string,
    @Param('permissionCode') permissionCode: string
  ): Promise<Role> {
    return this.rolesService.revokePermission(id, permissionCode);
  }
} 