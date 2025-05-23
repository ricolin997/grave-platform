import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
  Delete,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Types } from 'mongoose';
import {
  MessageResponseDto,
  MessagesResponseDto,
  ThreadsResponseDto,
} from './dto/message-response.dto';
import { RequestWithUser } from './types/request.types';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto, @Req() req: RequestWithUser) {
    try {
      console.log('Received message DTO:', {
        createMessageDto,
        'productId': createMessageDto.productId,
        'receiverId': createMessageDto.receiverId,
        'productId type': typeof createMessageDto.productId,
        'receiverId type': typeof createMessageDto.receiverId,
      });
      
      // 直接使用字符串形式的 ID，讓 service 層處理轉換
      return this.messagesService.create(req.user.id, createMessageDto);
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  @Get('threads')
  getThreads(
    @Req() req: RequestWithUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.messagesService.getThreads(
      new Types.ObjectId(req.user.id),
      +page,
      +limit,
    );
  }

  @Get('thread/:threadId')
  async getThreadMessages(@Param('threadId') threadId: string, @Req() req: RequestWithUser) {
    return this.messagesService.getConversation(
      new Types.ObjectId(req.user.id),
      threadId.split('_')[1], // 獲取接收者ID
      threadId.split('_')[2], // 獲取產品ID
    );
  }

  @Post('thread/:threadId/read')
  async markThreadAsRead(@Param('threadId') threadId: string, @Req() req: RequestWithUser) {
    return this.messagesService.markAsRead(new Types.ObjectId(req.user.id), threadId);
  }

  @Patch('read')
  async markMessagesAsRead(@Body() body: { messageIds: string[] }, @Req() req: RequestWithUser) {
    await this.messagesService.markMessagesAsRead(
      new Types.ObjectId(req.user.id),
      body.messageIds
    );
    return { success: true };
  }

  @Get('conversation/:userId/:productId')
  async getConversation(
    @Req() req: RequestWithUser,
    @Param('userId') otherUserId: string,
    @Param('productId') productId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<MessagesResponseDto> {
    return this.messagesService.getConversation(
      new Types.ObjectId(req.user.id),
      otherUserId,
      productId,
      +page,
      +limit,
    );
  }

  @Delete(':id')
  async deleteMessage(
    @Param('id') messageId: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    await this.messagesService.deleteMessage(messageId, new Types.ObjectId(req.user.id));
  }

  @Get('search')
  async searchMessages(
    @Req() req: RequestWithUser,
    @Query('query') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<MessagesResponseDto> {
    return this.messagesService.searchMessages(
      new Types.ObjectId(req.user.id),
      query,
      page,
      limit,
    );
  }

  @Get('unread/count')
  async getUnreadCount(@Req() req: RequestWithUser): Promise<{ count: number }> {
    const count = await this.messagesService.getUnreadCount(new Types.ObjectId(req.user.id));
    return { count };
  }
}
