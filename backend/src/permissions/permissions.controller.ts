import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { Permission } from './entities/permission.entity';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('permissions')
@UseGuards(AdminGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async findAll(): Promise<Permission[]> {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Permission> {
    return this.permissionsService.findOne(id);
  }

  @Post()
  async create(@Body() createPermissionDto: Partial<Permission>): Promise<Permission> {
    return this.permissionsService.create(createPermissionDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: Partial<Permission>
  ): Promise<Permission> {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.permissionsService.remove(id);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string): Promise<Permission | null> {
    return this.permissionsService.findByCode(code);
  }
} 