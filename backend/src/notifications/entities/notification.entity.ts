import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../../orders/enums/order-status.enum';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object })
  data?: {
    orderId?: string;
    orderNumber?: string;
    oldStatus?: OrderStatus;
    newStatus?: OrderStatus;
    [key: string]: any;
  };

  @Prop({ default: false })
  read: boolean;

  @Prop()
  readAt?: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification); 