import axiosInstance from './axios';
import { Order, CreateOrderData, UpdateOrderData, OrderQuery, OrdersResponse, TransferInfo, VisitAppointment } from '../types/order';

export const ordersApi = {
  // 創建訂單
  create: async (data: CreateOrderData): Promise<Order> => {
    const response = await axiosInstance.post<Order>('/orders', data);
    return response.data;
  },

  // 獲取訂單列表
  getOrders: async (query: OrderQuery = {}): Promise<OrdersResponse> => {
    const response = await axiosInstance.get<OrdersResponse>('/orders', {
      params: query,
    });
    return response.data;
  },

  // 獲取買家訂單
  getBuyerOrders: async (query: OrderQuery = {}): Promise<OrdersResponse> => {
    const response = await axiosInstance.get<OrdersResponse>('/orders/buyer', {
      params: query,
    });
    return response.data;
  },

  // 獲取賣家訂單
  getSellerOrders: async (query: OrderQuery = {}): Promise<OrdersResponse> => {
    const response = await axiosInstance.get<OrdersResponse>('/orders/seller', {
      params: query,
    });
    return response.data;
  },

  // 獲取單個訂單詳情
  getOrder: async (id: string): Promise<Order> => {
    const response = await axiosInstance.get<Order>(`/orders/${id}`);
    return response.data;
  },

  // 更新訂單
  updateOrder: async (id: string, data: UpdateOrderData): Promise<Order> => {
    const response = await axiosInstance.patch<Order>(`/orders/${id}`, data);
    return response.data;
  },

  // 取消訂單
  cancelOrder: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`/orders/${id}`);
    return response.data;
  },

  // 賣家確認訂單
  confirmOrder: async (id: string): Promise<Order> => {
    return await ordersApi.updateOrder(id, { status: 'confirmed' });
  },

  // 賣家拒絕訂單
  rejectOrder: async (id: string, rejectionReason: string): Promise<Order> => {
    return await ordersApi.updateOrder(id, { 
      status: 'rejected',
      rejectionReason 
    });
  },

  // 買家提交轉帳信息
  submitPayment: async (id: string, transferInfo: TransferInfo): Promise<Order> => {
    return await ordersApi.updateOrder(id, { 
      status: 'payment_pending',
      transferInfo 
    });
  },

  // 賣家確認收款
  confirmPayment: async (id: string): Promise<Order> => {
    return await ordersApi.updateOrder(id, { status: 'payment_confirmed' });
  },

  // 賣家完成訂單
  completeOrder: async (id: string): Promise<Order> => {
    return await ordersApi.updateOrder(id, { status: 'completed' });
  },

  // 預約看墓位
  scheduleVisit: async (id: string, visitAppointment: VisitAppointment): Promise<Order> => {
    return await ordersApi.updateOrder(id, { visitAppointment });
  },
}; 