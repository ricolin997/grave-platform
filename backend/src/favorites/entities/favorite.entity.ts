import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FavoriteDocument = Favorite & Document & {
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
};

@Schema({ timestamps: true })
export class Favorite {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop({ default: false })
  isNotified: boolean;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

// 創建複合索引確保用戶不能重複收藏同一產品
FavoriteSchema.index({ userId: 1, productId: 1 }, { unique: true }); 