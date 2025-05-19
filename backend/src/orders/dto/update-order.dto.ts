import { OrderStatus } from '../enums/order-status.enum';
import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { TransferInfo, VisitAppointment } from '../entities/order.entity';
import { TransactionType } from '../enums/transaction-type.enum';

// 更新訂單DTO
export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  status?: OrderStatus;
  finalPrice?: number;
  transactionType?: TransactionType;
  transferInstructions?: string;
  transferInfo?: TransferInfo;
  visitAppointment?: VisitAppointment;
  notes?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  completedAt?: Date;
} 