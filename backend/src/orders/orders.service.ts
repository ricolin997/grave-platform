import { Injectable, NotFoundException, UnauthorizedException, forwardRef, Inject, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { ProductResponseDto } from '../products/dto/product-response.dto';
import { OrderStatus } from './enums/order-status.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @Inject(forwardRef(() => ProductsService))
    private productsService: ProductsService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const product = await this.productsService.findOne(
      createOrderDto.productId,
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== 'published') {
      throw new BadRequestException('Product is not available');
    }

    // 更新商品狀態為已預訂
    await this.productsService.update(product.id, product.sellerId, {
      status: 'reserved',
    });

    const order = new this.orderModel({
      ...createOrderDto,
      buyerId: new Types.ObjectId(userId),
      sellerId: new Types.ObjectId(product.sellerId),
      status: OrderStatus.PENDING,
      finalPrice: product.basicInfo.price,
    });

    return order.save();
  }

  async findAll(userId: string): Promise<Order[]> {
    const objectId = new Types.ObjectId(userId);
    return this.orderModel
      .find({
        $or: [{ buyerId: objectId }, { sellerId: objectId }],
      })
      .populate('buyerId', '-password -security')
      .populate('sellerId', '-password -security')
      .populate('productId')
      .exec();
  }

  async findBuyerOrders(userId: string): Promise<Order[]> {
    return this.orderModel
      .find({ buyerId: userId })
      .populate('buyerId', '-password -security')
      .populate('sellerId', '-password -security')
      .populate('productId')
      .exec();
  }

  async findSellerOrders(userId: string): Promise<Order[]> {
    return this.orderModel
      .find({ sellerId: userId })
      .populate('buyerId', '-password -security')
      .populate('sellerId', '-password -security')
      .populate('productId')
      .exec();
  }

  async findOne(userId: string, id: string): Promise<Order> {
    const objectId = new Types.ObjectId(userId);
    const order = await this.orderModel
      .findById(id)
      .populate('buyerId', '-password -security')
      .populate('sellerId', '-password -security')
      .populate('productId')
      .exec();

    if (!order) {
      throw new NotFoundException('訂單不存在');
    }

    if (!order.buyerId.equals(objectId) && !order.sellerId.equals(objectId)) {
      throw new UnauthorizedException('無權訪問此訂單');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.orderModel.findOne({
      _id: id,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 如果更新了預約資訊，設置預約狀態為 pending
    if (updateOrderDto.visitAppointment) {
      updateOrderDto.visitAppointment.status = 'pending';
    }

    // 處理訂單狀態變更
    if (updateOrderDto.status) {
      const oldStatus = order.status;
      const newStatus = updateOrderDto.status;

      // 如果訂單被取消或拒絕，將商品狀態改回 published
      if (
        (newStatus === OrderStatus.CANCELLED ||
          newStatus === OrderStatus.REJECTED) &&
        oldStatus === OrderStatus.PENDING
      ) {
        await this.productsService.update(
          order.productId.toString(),
          order.sellerId.toString(),
          {
            status: 'published',
          },
        );
      }

      // 如果訂單完成，將商品狀態改為 sold
      if (newStatus === OrderStatus.COMPLETED) {
        await this.productsService.update(
          order.productId.toString(),
          order.sellerId.toString(),
          {
            status: 'sold',
          },
        );
      }

      // 發送狀態變更通知
      await this.notificationsService.createOrderStatusNotification(
        order.buyerId.toString(),
        order.id,
        order.orderNumber,
        oldStatus,
        newStatus,
      );

      await this.notificationsService.createOrderStatusNotification(
        order.sellerId.toString(),
        order.id,
        order.orderNumber,
        oldStatus,
        newStatus,
      );
    }

    Object.assign(order, updateOrderDto);
    return order.save();
  }

  async remove(userId: string, id: string): Promise<void> {
    const objectId = new Types.ObjectId(userId);
    const order = await this.orderModel.findById(id).exec();

    if (!order) {
      throw new NotFoundException('訂單不存在');
    }

    if (!order.buyerId.equals(objectId) && !order.sellerId.equals(objectId)) {
      throw new UnauthorizedException('無權刪除此訂單');
    }

    await this.orderModel.deleteOne({ _id: id }).exec();
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD${year}${month}${day}${random}`;
  }
}
