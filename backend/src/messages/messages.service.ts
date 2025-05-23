import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesResponseDto, MessageResponseDto, MessageThreadDto, ThreadsResponseDto } from './dto/message-response.dto';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class MessagesService {
  private messagesGateway: any;

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  // 允許設置 MessagesGateway 實例，避免循環依賴
  setMessagesGateway(gateway: any) {
    this.messagesGateway = gateway;
  }

  async create(
    userId: string | Types.ObjectId,
    createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    // 打印接收到的DTO信息
    console.log('Messages Service - Creating message with:', {
      userId: typeof userId === 'string' ? userId : userId.toString(),
      createMessageDto: JSON.stringify(createMessageDto),
      'productId type': typeof createMessageDto.productId,
      'receiverId type': typeof createMessageDto.receiverId,
      'productId valid': Types.ObjectId.isValid(createMessageDto.productId),
      'receiverId valid': Types.ObjectId.isValid(createMessageDto.receiverId),
    });
    
    try {
      // 確保所有 ID 都是有效的 MongoDB ObjectId
      const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
      const productIdObj = new Types.ObjectId(createMessageDto.productId);
      const receiverIdObj = new Types.ObjectId(createMessageDto.receiverId);
      
      // 生成或查找對話ID（由兩個用戶ID和產品ID組成）
      const sortedUserIds = [
        userIdObj.toString(),
        receiverIdObj.toString(),
      ].sort();
      const threadId = `${sortedUserIds[0]}_${sortedUserIds[1]}_${productIdObj.toString()}`;

      // 檢查產品是否存在
      await this.productsService.findOne(createMessageDto.productId);

      // 檢查接收者是否存在
      await this.usersService.findById(createMessageDto.receiverId);

      // 創建消息
      const newMessage = new this.messageModel({
        senderId: userIdObj,
        receiverId: receiverIdObj,
        productId: productIdObj,
        content: createMessageDto.content,
        threadId,
      });

      const savedMessage = await newMessage.save();

      // 增加產品的詢問數
      try {
        await this.productsService.incrementInquiries(
          createMessageDto.productId,
        );
      } catch (err) {
        console.error('Failed to increment inquiries:', err);
      }

      // 發送 WebSocket 通知
      const messageDto = this.mapToDto(savedMessage);
      if (this.messagesGateway) {
        await this.messagesGateway.notifyNewMessage(savedMessage);
      } else {
        console.warn('MessagesGateway not set, skipping notification');
      }

      return messageDto;
    } catch (error) {
      console.error('訊息創建失敗:', error);
      throw error;
    }
  }

  async getConversation(
    userId: Types.ObjectId,
    otherUserId: string,
    productId: string,
    page = 1,
    limit = 20,
  ): Promise<MessagesResponseDto> {
    // 構建threadId
    const sortedUserIds = [userId.toString(), otherUserId].sort();
    const threadId = `${sortedUserIds[0]}_${sortedUserIds[1]}_${productId}`;

    // 計算總數
    const total = await this.messageModel.countDocuments({ threadId });
    const totalPages = Math.ceil(total / limit);

    // 獲取消息，按時間降序
    const messages = await this.messageModel
      .find({ threadId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    // 將消息按時間升序返回
    const sortedMessages = [...messages].reverse();

    return {
      messages: sortedMessages.map((msg) => this.mapToDto(msg)),
      total,
      page,
      totalPages,
    };
  }

  async getThreads(
    userId: Types.ObjectId,
    page = 1,
    limit = 10,
  ): Promise<ThreadsResponseDto> {
    // 獲取用戶參與的所有對話
    const threads = await this.messageModel.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      {
        $group: {
          _id: '$threadId',
          lastMessage: { $last: '$$ROOT' },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiverId', userId] },
                    { $eq: ['$read', false] },
                  ]
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
    ]);

    // 獲取總數
    const totalCount = await this.messageModel.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      {
        $group: {
          _id: '$threadId',
        },
      },
      {
        $count: 'total',
      },
    ]);

    const total = totalCount[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 獲取相關的產品和用戶信息
    const threadDtos = await Promise.all(
      threads.map(async (thread) => {
        const lastMessage = thread.lastMessage;
        const otherUserId = lastMessage.senderId.equals(userId)
          ? lastMessage.receiverId
          : lastMessage.senderId;

        const [product, otherUser] = await Promise.all([
          this.productsService.findOne(lastMessage.productId.toString()),
          this.usersService.findById(otherUserId.toString()),
        ]);

        return {
          threadId: thread._id,
          productId: lastMessage.productId.toString(),
          productTitle: product.basicInfo.title,
          productImage: product.basicInfo.images[0],
          otherUserId: otherUserId.toString(),
          otherUserName: otherUser.profile.name,
          lastMessage: lastMessage.content,
          unreadCount: thread.unreadCount,
          messageCount: thread.messageCount,
          updatedAt: lastMessage.updatedAt,
        };
      }),
    );

    return {
      threads: threadDtos,
      total,
      page,
      totalPages,
    };
  }

  async markAsRead(
    userId: Types.ObjectId,
    threadId: string,
  ): Promise<void> {
    await this.messageModel.updateMany(
      {
        threadId,
        receiverId: userId,
        read: false,
      },
      {
        $set: { read: true },
      },
    );
  }

  async markMessagesAsRead(
    userId: Types.ObjectId,
    messageIds: string[],
  ): Promise<void> {
    // 將每個消息 ID 轉換為 ObjectId 
    const objectIds = messageIds.map(id => new Types.ObjectId(id));
    
    // 只能將發送給當前用戶的消息標記為已讀
    await this.messageModel.updateMany(
      {
        _id: { $in: objectIds },
        receiverId: userId,
        read: false,
      },
      {
        $set: { read: true },
      }
    );
  }

  async getUnreadCount(userId: Types.ObjectId): Promise<number> {
    return this.messageModel.countDocuments({
      receiverId: userId,
      read: false,
    });
  }

  async deleteMessage(messageId: string, userId: Types.ObjectId): Promise<void> {
    const message = await this.messageModel.findById(messageId);
    
    if (!message) {
      throw new NotFoundException('消息不存在');
    }

    if (message.senderId.toString() !== userId.toString()) {
      throw new ForbiddenException('無權撤回此消息');
    }

    // 檢查消息是否超過 2 分鐘
    const messageAge = Date.now() - message.createdAt.getTime();
    if (messageAge > 2 * 60 * 1000) {
      throw new ForbiddenException('消息超過 2 分鐘，無法撤回');
    }

    await this.messageModel.deleteOne({ _id: messageId });
  }

  async searchMessages(
    userId: Types.ObjectId,
    query: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<MessagesResponseDto> {
    // 構建搜索條件
    const searchConditions = {
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ],
      $text: { $search: query }
    };

    // 計算總數
    const total = await this.messageModel.countDocuments(searchConditions);
    const totalPages = Math.ceil(total / limit);

    // 獲取消息
    const messages = await this.messageModel
      .find(searchConditions)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    return {
      messages: messages.map(msg => this.mapToDto(msg)),
      total,
      page,
      totalPages
    };
  }

  private mapToDto(message: any): MessageResponseDto {
    return {
      id: message._id.toString(),
      senderId: message.senderId.toString(),
      receiverId: message.receiverId.toString(),
      productId: message.productId.toString(),
      content: message.content,
      read: message.read,
      threadId: message.threadId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}
