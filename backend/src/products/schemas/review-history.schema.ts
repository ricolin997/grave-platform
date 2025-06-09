import { Schema, Document } from 'mongoose';

// 定義ReviewHistory接口
export interface ReviewHistory {
  productId: any;
  adminId: any;
  action: 'approve' | 'reject' | 'needs_info';
  note: string;
  createdAt: Date;
}

// 定義ReviewHistoryDocument類型
export type ReviewHistoryDocument = ReviewHistory & Document;

export const ReviewHistorySchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    required: true, 
    enum: ['approve', 'reject', 'needs_info'] 
  },
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
});
