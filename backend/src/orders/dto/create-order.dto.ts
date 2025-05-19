import { IsNotEmpty, IsString, IsNumber, IsOptional, IsObject, IsEnum } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';
import { TransactionType } from '../enums/transaction-type.enum';
import { VisitAppointment } from '../entities/order.entity';

// 創建訂單DTO
export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  productId: string;           // 商品ID

  @IsNotEmpty()
  @IsNumber()
  finalPrice: number;          // 最終價格

  @IsNotEmpty()
  @IsEnum(TransactionType, {
    message: 'transactionType 必須是 full_payment, installment 或 deposit 其中之一'
  })
  transactionType: string;      // 交易方式，接受字串

  @IsOptional()
  @IsString()
  transferInstructions?: string;

  @IsOptional()
  @IsObject()
  transferInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    transferDate?: Date;
    transferAmount?: number;
    receiptImage?: string;
  };

  @IsOptional()
  @IsObject()
  visitAppointment?: VisitAppointment;

  @IsOptional()
  @IsString()
  notes?: string;              // 備註

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
} 