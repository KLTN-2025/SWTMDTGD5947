import { useState, useEffect, useCallback, useMemo } from 'react';
import { customerApi, Customer, CustomersResponse } from './admin-api';
import { toast } from 'sonner';
import { getErrorMessage } from './error-handler';

export function useCustomers(params?: {
  per_page?: number;
  search?: string;
  is_active?: boolean;
  min_spent?: number;
  max_spent?: number;
  min_orders?: number;
  max_orders?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<CustomersResponse['pagination'] | null>(null);

  // Memoize params to prevent infinite loop
  const memoizedParams = useMemo(() => params, [
    params?.per_page,
    params?.search,
    params?.is_active,
    params?.min_spent,
    params?.max_spent,
    params?.min_orders,
    params?.max_orders,
    params?.sort_by,
    params?.sort_order,
    params?.page,
  ]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerApi.getCustomers(memoizedParams);
      if (response.data) {
        const data = response.data as any;
        if (data.customers && Array.isArray(data.customers)) {
          setCustomers(data.customers);
          setPagination(data.pagination || null);
        } else if (Array.isArray(data)) {
          setCustomers(data);
          setPagination(null);
        } else {
          setCustomers([]);
          setPagination(null);
        }
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể tải danh sách khách hàng');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    pagination,
    refetch: fetchCustomers,
  };
}

export function useCustomer(id: number | string | undefined) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await customerApi.getCustomer(Number(id));
      if (response.data) {
        setCustomer(response.data as any);
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể tải thông tin khách hàng');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return {
    customer,
    loading,
    error,
    refetch: fetchCustomer,
  };
}

