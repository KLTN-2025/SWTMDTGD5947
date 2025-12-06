import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './admin-api';
import { toast } from 'sonner';

// Types for Admin Orders
export interface AdminOrder {
  id: number;
  customer: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
    address?: string;
  };
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  statusDisplay: string;
  paymentStatus: 'PENDING' | 'UNPAID' | 'PAID' | 'CANCELLED' | 'REFUNDED' | 'FAILED';
  paymentStatusDisplay: string;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'E_WALLET' | 'BANK_TRANSFER';
  paymentMethodDisplay: string;
  amount: number;
  deliveryAddress: string;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
  canCancel: boolean;
  canConfirm: boolean;
  canShip: boolean;
  canComplete: boolean;
}

export interface AdminOrderDetail extends AdminOrder {
  items: OrderItem[];
  statusTimeline: StatusTimelineItem[];
}

export interface OrderItem {
  id: number;
  quantity: number;
  itemTotal: number;
  mainImage?: string;
  productVariant: {
    id: number;
    price: number;
    product: {
      id: number;
      name: string;
      skuId: string;
      basePrice: number;
      colors?: Array<{
        id: number;
        name: string;
        hexCode?: string | null;
      }>;
    };
    size: {
      id: number;
      nameSize: string;
    };
  };
}

export interface StatusTimelineItem {
  label: string;
  completed: boolean;
  date?: string;
}

export interface OrderFilters {
  status?: string;
  payment_status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: string;
}

export interface UpdateStatusRequest {
  status: 'CONFIRMED' | 'SHIPPED' | 'COMPLETED';
  note?: string;
}

export interface CancelOrderRequest {
  reason: string;
  note?: string;
}

// Custom hooks
export function useAdminOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await adminApi.get(`/orders?${params.toString()}`);
      return response.data;
    },
  });
}

export function useAdminOrderDetail(orderId: number) {
  return useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: async () => {
      const response = await adminApi.get(`/orders/${orderId}`);
      return response.data as AdminOrderDetail;
    },
    enabled: !!orderId,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: number; data: UpdateStatusRequest }) => {
      try {
        const response = await adminApi.put(`/orders/${orderId}/status`, data);
        console.log('API response:', response);
        return response.data;
      } catch (error) {
        console.error('API error:', error);
        throw error;
      }
    },
    onSuccess: (response, { orderId }) => {
      try {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
        
        // Debug log to see response structure
        console.log('Update status success response:', response);
        
        // Show success message with payment status info
        // response đã là response.data từ mutationFn
        const data = (response as any).data;
        if (data && data.newStatus === 'COMPLETED' && data.paymentStatus === 'PAID') {
          toast.success(`${data.statusDisplay} - Thanh toán đã được xác nhận`);
        } else if (data && data.statusDisplay) {
          toast.success(`Cập nhật trạng thái thành công: ${data.statusDisplay}`);
        } else {
          // Fallback sử dụng message từ response
          const message = (response as any).message || 'Cập nhật trạng thái thành công';
          toast.success(message);
        }
      } catch (error) {
        console.error('Error in onSuccess callback:', error);
        toast.success('Cập nhật trạng thái thành công');
      }
    },
    onError: (error: any) => {
      // Error message is already parsed by ApiError
      const msgCode = error?.msgCode || error?.response?.msgCode;
      const message = error?.message || error?.response?.message || 'Có lỗi xảy ra khi cập nhật trạng thái';
      
      if (msgCode === 'SAME_STATUS') {
        toast.warning(message);
        // Force refresh data
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-order'] });
      } else {
        toast.error(message);
      }
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: number; data: CancelOrderRequest }) => {
      const response = await adminApi.post(`/orders/${orderId}/cancel`, data);
      return response.data;
    },
    onSuccess: (response, { orderId }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      
      // Show success message with payment status info
      const data = (response as any).data;
      toast.success(`Hủy đơn hàng thành công - Thanh toán đã được hủy`);
    },
  });
}

// Helper functions
export function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'SHIPPED':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'PENDING':
    case 'UNPAID':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'FAILED':
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'REFUNDED':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}
