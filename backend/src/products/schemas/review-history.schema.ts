import { Schema } from 'mongoose';

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
