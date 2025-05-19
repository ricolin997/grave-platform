import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface UserRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    username: string;
  };
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(@Req() req: UserRequest) {
    return this.notificationsService.getUserNotifications(req.user.id);
  }

  @Get('unread')
  async getUnreadNotifications(@Req() req: UserRequest) {
    return this.notificationsService.getUnreadNotifications(req.user.id);
  }

  @Post(':id/read')
  async markAsRead(
    @Req() req: UserRequest,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  @Post('read-all')
  async markAllAsRead(@Req() req: UserRequest) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }
} 