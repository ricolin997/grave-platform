export enum OrderStatus {
  PENDING = 'pending',           // 等待賣家確認
  CONFIRMED = 'confirmed',       // 賣家已確認，等待買家轉帳
  PAYMENT_PENDING = 'payment_pending',   // 等待賣家確認收款
  PAYMENT_CONFIRMED = 'payment_confirmed', // 賣家已確認收款
  COMPLETED = 'completed',       // 交易完成
  CANCELLED = 'cancelled',       // 交易取消
  REJECTED = 'rejected'          // 賣家拒絕
} 