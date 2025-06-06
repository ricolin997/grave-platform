import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus, InquiryStatus } from '../enums/order-status.enum';
import { TransactionType, ContactPreference } from '../enums/transaction-type.enum';

export type OrderDocument = Order & Document;
export type InquiryDocument = Order & Document;

export type TransferInfo = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  transferDate?: Date;
  transferAmount?: number;
  receiptImage?: string;
};

export type VisitAppointment = {
  date: Date;
  timeSlot: string;
  contactName: string;
  contactPhone: string;
  additionalInfo?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};

@Schema({ timestamps: true })
export class Order {
  _id: Types.ObjectId;

  @Prop({ required: true })
  orderNumber: string;

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  buyerId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  sellerId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop({ required: true })
  estimatedPrice: number;

  @Prop({ required: false, enum: TransactionType })
  transactionType: TransactionType;

  @Prop({ required: false, enum: ContactPreference })
  contactPreference?: ContactPreference;

  @Prop()
  transferInstructions?: string;

  @Prop({ type: Object })
  transferInfo?: TransferInfo;

  @Prop({ type: Object })
  visitAppointment?: VisitAppointment;

  @Prop()
  notes?: string;

  @Prop()
  cancellationReason?: string;

  @Prop()
  rejectionReason?: string;

  @Prop()
  completedAt?: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  id?: string; // 虛擬屬性，將 _id 轉換為字符串
}

export const OrderSchema = SchemaFactory.createForClass(Order);
export const InquirySchema = OrderSchema;

// 添加 id 虛擬屬性
OrderSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// 確保在 JSON 輸出中包含虛擬屬性
OrderSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
}); 