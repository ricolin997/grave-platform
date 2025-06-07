import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/entities/user.entity';
import { Product } from './product.entity';

export type ReviewHistoryDocument = ReviewHistory & Document;

@Schema({ timestamps: true })
export class ReviewHistory {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  productId: Product;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  adminId: User;

  @Prop({ 
    type: String, 
    required: true, 
    enum: ['approve', 'reject', 'needs_info'] 
  })
  action: 'approve' | 'reject' | 'needs_info';

  @Prop({ type: String })
  note: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const ReviewHistorySchema = SchemaFactory.createForClass(ReviewHistory); 