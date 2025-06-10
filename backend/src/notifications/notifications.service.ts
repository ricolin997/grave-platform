import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './entities/notification.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  // 創建通知
  async create(userId: string, data: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }): Promise<Notification> {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(userId),
      ...data,
    });
    return notification.save();
  }

  // 獲取用戶的所有通知
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  // 獲取用戶的未讀通知
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId), read: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  // 標記通知為已讀
  async markAsRead(userId: string, notificationId: string): Promise<Notification | null> {
    return this.notificationModel
      .findOneAndUpdate(
        { _id: notificationId, userId: new Types.ObjectId(userId) },
        { read: true, readAt: new Date() },
        { new: true },
      )
      .exec();
  }

  // 標記所有通知為已讀
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel
      .updateMany(
        { userId: new Types.ObjectId(userId), read: false },
        { read: true, readAt: new Date() },
      )
      .exec();
  }

  // 創建訂單狀態變更通知
  async createOrderStatusNotification(
    userId: string,
    orderId: string,
    orderNumber: string,
    oldStatus: OrderStatus,
    newStatus: OrderStatus,
  ): Promise<Notification> {
    const statusMessages: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: '等待賣家確認',
      [OrderStatus.CONFIRMED]: '賣家已確認，請進行付款',
      [OrderStatus.PAYMENT_PENDING]: '等待賣家確認收款',
      [OrderStatus.PAYMENT_CONFIRMED]: '賣家已確認收款',
      [OrderStatus.COMPLETED]: '交易已完成',
      [OrderStatus.CANCELLED]: '交易已取消',
      [OrderStatus.REJECTED]: '賣家已拒絕訂單',
    };

    return this.create(userId, {
      type: 'order_status_change',
      title: '訂單狀態更新',
      message: `訂單 ${orderNumber} 狀態已從 ${statusMessages[oldStatus]} 變更為 ${statusMessages[newStatus]}`,
      data: {
        orderId,
        orderNumber,
        oldStatus,
        newStatus,
      },
    });
  }

  // 創建商品審核通過通知
  async createProductApprovedNotification(
    userId: string,
    productId: string,
    productTitle: string,
    reviewNote?: string,
  ): Promise<Notification> {
    return this.create(userId, {
      type: 'product_approved',
      title: '商品審核通過',
      message: `您的商品 "${productTitle}" 已通過審核，可進行上架`,
      data: {
        productId,
        productTitle,
        reviewNote: reviewNote || '您的商品符合平台要求，已通過審核。',
      },
    });
  }
} 