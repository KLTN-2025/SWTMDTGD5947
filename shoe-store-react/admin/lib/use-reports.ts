import { useQuery } from '@tanstack/react-query';
import { reportApi, OverviewStats, RevenueByPeriodResponse, TopSellingProductsResponse, InventoryStatusResponse, OrderStatsResponse, PaymentStatsResponse, RatedProductsResponse, TopCustomersResponse, RevenueByCategoryResponse } from './admin-api';

export function useOverviewStats(period: number = 30) {
  return useQuery({
    queryKey: ['reports', 'overview', period],
    queryFn: async () => {
      const response = await reportApi.getOverview({ period });
      if (!response.data) throw new Error(response.message || 'Failed to fetch overview stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRevenueByPeriod(period: number = 30) {
  return useQuery({
    queryKey: ['reports', 'revenue', period],
    queryFn: async () => {
      const response = await reportApi.getRevenueByPeriod({ period });
      if (!response.data) throw new Error(response.message || 'Failed to fetch revenue data');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopSellingProducts(limit: number = 10, period: number = 30) {
  return useQuery({
    queryKey: ['reports', 'top-products', limit, period],
    queryFn: async () => {
      const response = await reportApi.getTopSellingProducts({ limit, period });
      if (!response.data) throw new Error(response.message || 'Failed to fetch top products');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInventoryStatus(lowStockThreshold: number = 10) {
  return useQuery({
    queryKey: ['reports', 'inventory', lowStockThreshold],
    queryFn: async () => {
      const response = await reportApi.getInventoryStatus({ lowStockThreshold });
      if (!response.data) throw new Error(response.message || 'Failed to fetch inventory status');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrderStats(period: number = 30) {
  return useQuery({
    queryKey: ['reports', 'orders', period],
    queryFn: async () => {
      const response = await reportApi.getOrderStats({ period });
      if (!response.data) throw new Error(response.message || 'Failed to fetch order stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePaymentStats(period: number = 30) {
  return useQuery({
    queryKey: ['reports', 'payments', period],
    queryFn: async () => {
      const response = await reportApi.getPaymentStats({ period });
      if (!response.data) throw new Error(response.message || 'Failed to fetch payment stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRatedProducts(limit: number = 10, period: number = 30) {
  return useQuery({
    queryKey: ['reports', 'rated-products', limit, period],
    queryFn: async () => {
      const response = await reportApi.getRatedProducts({ limit, period });
      if (!response.data) throw new Error(response.message || 'Failed to fetch rated products');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopCustomers(limit: number = 10, period: number = 30) {
  return useQuery({
    queryKey: ['reports', 'top-customers', limit, period],
    queryFn: async () => {
      const response = await reportApi.getTopCustomers({ limit, period });
      if (!response.data) throw new Error(response.message || 'Failed to fetch top customers');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRevenueByCategory(period: number = 30) {
  return useQuery({
    queryKey: ['reports', 'revenue-by-category', period],
    queryFn: async () => {
      const response = await reportApi.getRevenueByCategory({ period });
      if (!response.data) throw new Error(response.message || 'Failed to fetch revenue by category');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

