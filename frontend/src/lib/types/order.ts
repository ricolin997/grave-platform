import { Product } from './product';
import { User } from './user';

// 訂單狀態
export type OrderStatus =
  | 'pending'           // 等待賣家確認
  | 'confirmed'         // 賣家已確認，等待買家轉帳
  | 'payment_pending'   // 等待賣家確認收款
  | 'payment_confirmed' // 賣家已確認收款
  | 'completed'         // 交易完成
  | 'cancelled'          // 交易取消
  | 'rejected';         // 賣家拒絕

// 交易方式
export type TransactionType =
  | 'full_payment'      // 全額支付
  | 'installment'       // 分期付款
  | 'deposit';          // 預付訂金

// 轉帳信息
export interface TransferInfo {
  bankName: string;           // 銀行名稱
  accountName: string;        // 帳戶名稱
  accountNumber: string;      // 帳號
  branchName?: string;        // 分行名稱
  transferDate?: Date | string; // 轉帳日期
  transferAmount: number;     // 轉帳金額
  transferNote?: string;      // 轉帳備註
  receiptImage?: string;      // 轉帳收據圖片URL
}

// 預約看墓位
export interface VisitAppointment {
  date: Date | string;        // 預約日期
  timeSlot: string;           // 時間段
  contactName: string;        // 聯繫人姓名
  contactPhone: string;       // 聯繫電話
  additionalInfo?: string;    // 其他信息
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'; // 預約狀態
}

// 訂單
export interface Order {
  id: string;
  
  // 關聯
  buyerId: string;            // 買家ID
  buyer: User;                // 買家
  sellerId: string;           // 賣家ID
  seller: User;               // 賣家
  productId: string;          // 商品ID
  product: Product;           // 商品
  
  // 訂單信息
  orderNumber: string;        // 訂單編號
  status: OrderStatus;        // 訂單狀態
  finalPrice: number;         // 最終價格
  transactionType: TransactionType; // 交易方式
  
  // 預約看墓位
  visitAppointment?: VisitAppointment;
  
  // 交易信息
  transferInstructions?: string; // 賣家提供的轉帳說明
  transferInfo?: TransferInfo;   // 買家提供的轉帳信息
  
  // 其他信息
  notes?: string;             // 備註
  cancellationReason?: string; // 取消原因
  rejectionReason?: string;    // 拒絕原因
  
  // 時間戳
  createdAt: Date | string;   // 創建時間
  updatedAt: Date | string;   // 更新時間
  completedAt?: Date | string; // 完成時間
}

// 創建訂單的數據
export interface CreateOrderData {
  productId: string;           // 商品ID
  finalPrice: number;          // 最終價格
  transactionType: TransactionType; // 交易方式
  visitAppointment?: VisitAppointment;  // 預約看墓位
  notes?: string;              // 備註
}

// 更新訂單的數據
export interface UpdateOrderData {
  status?: OrderStatus;
  finalPrice?: number;
  transactionType?: TransactionType;
  transferInstructions?: string;
  transferInfo?: TransferInfo;
  visitAppointment?: VisitAppointment;
  notes?: string;
  cancellationReason?: string;
  rejectionReason?: string;
}

// 訂單查詢參數
export interface OrderQuery {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

// 訂單列表響應
export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

// 幫助函數：格式化訂單狀態為中文
export const formatOrderStatus = (status: OrderStatus): string => {
  const statusMap: Record<OrderStatus, string> = {
    pending: '等待賣家確認',
    confirmed: '等待買家付款',
    payment_pending: '等待確認收款',
    payment_confirmed: '已確認收款',
    completed: '交易完成',
    cancelled: '交易取消',
    rejected: '賣家拒絕',
  };
  
  return statusMap[status] || status;
};

// 幫助函數：格式化交易方式為中文
export const formatTransactionType = (type: TransactionType): string => {
  const typeMap: Record<TransactionType, string> = {
    full_payment: '全額付款',
    installment: '分期付款',
    deposit: '預付訂金',
  };
  
  return typeMap[type] || type;
}; 