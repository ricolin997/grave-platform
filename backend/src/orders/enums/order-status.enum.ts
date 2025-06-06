export enum InquiryStatus {
  PENDING = 'pending',
  CONTACTED = 'contacted',
  VISIT_SCHEDULED = 'visit_scheduled',
  VISIT_COMPLETED = 'visit_completed',
  INTERESTED = 'interested',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

// 保留舊枚舉以兼容現有代碼
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
} 
