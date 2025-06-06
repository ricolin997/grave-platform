import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { OrderResponseDto } from './dto/order-response.dto';
import { Order } from './entities/order.entity';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: string;
  };
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 創建訂單
  @Post()
  async create(@Req() req: RequestWithUser, @Body() createOrderDto: CreateOrderDto) {
    const userId = req.user.id;
    const order = await this.ordersService.create(userId, createOrderDto);
    
    // 轉換為響應DTO
    return this.mapToResponseDto(order);
  }

  // 獲取當前用戶的所有訂單
  @Get()
  async findAll(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let orders: Order[] = [];
    
    // 根據用戶角色獲取不同的訂單列表
    if (userRole === 'seller') {
      orders = await this.ordersService.findSellerOrders(userId);
    } else {
      orders = await this.ordersService.findBuyerOrders(userId);
    }
    
    // 轉換為響應DTO
    return orders.map((order) => this.mapToResponseDto(order));
  }

  // 獲取買家訂單
  @Get('buyer')
  async findBuyerOrders(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const orders = await this.ordersService.findBuyerOrders(userId);
    
    // 轉換為響應DTO
    return orders.map((order) => this.mapToResponseDto(order));
  }

  // 獲取賣家訂單
  @Get('seller')
  async findSellerOrders(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const orders = await this.ordersService.findSellerOrders(userId);
    
    // 轉換為響應DTO
    return orders.map((order) => this.mapToResponseDto(order));
  }

  // 獲取單個訂單
  @Get(':id')
  async findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user.id;
    const order = await this.ordersService.findOne(userId, id);
    
    // 轉換為響應DTO
    return this.mapToResponseDto(order);
  }

  // 更新訂單
  @Patch(':id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    const updatedOrder = await this.ordersService.update(id, updateOrderDto);
    
    // 轉換為響應DTO
    return this.mapToResponseDto(updatedOrder);
  }

  // 取消訂單
  @Delete(':id')
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user.id;
    await this.ordersService.remove(userId, id);
    return { success: true, message: '訂單已取消' };
  }

  // 將訂單實體轉換為響應DTO
  private mapToResponseDto(order: Order): OrderResponseDto {
    return {
      id: order.id || order._id?.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      finalPrice: order.estimatedPrice,
      transactionType: order.transactionType,
      buyer: order.buyerId,
      seller: order.sellerId,
      product: order.productId,
      transferInstructions: order.transferInstructions,
      transferInfo: order.transferInfo,
      visitAppointment: order.visitAppointment,
      notes: order.notes,
      cancellationReason: order.cancellationReason,
      rejectionReason: order.rejectionReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.completedAt,
    };
  }
}
