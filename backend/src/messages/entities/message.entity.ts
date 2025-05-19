import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MessageDocument = Message & Document & {
  createdAt: Date;
  updatedAt: Date;
  _id: MongooseSchema.Types.ObjectId;
};

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  receiverId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Boolean, default: false })
  read: boolean;

  @Prop({ type: String })
  threadId: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message); 