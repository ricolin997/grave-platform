import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  threadId: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: false })
  deleted: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message); 