import { OrderStatus } from '../enums/order-status.enum';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { TransferInfo, VisitAppointment } from '../entities/order.entity';
import { TransactionType } from '../enums/transaction-type.enum';
import { Types } from 'mongoose';

// 訂單響應DTO
export class OrderResponseDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  finalPrice: number;
  transactionType: TransactionType;
  
  // 關聯數據 - 可以是填充的對象或 ID 類型
  buyer: User | Types.ObjectId;
  seller: User | Types.ObjectId;
  product: Product | Types.ObjectId;
  
  // 交易信息
  transferInstructions?: string;
  transferInfo?: TransferInfo;
  
  // 預約信息
  visitAppointment?: VisitAppointment;
  
  // 其他信息
  notes?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  
  // 時間戳
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
} 