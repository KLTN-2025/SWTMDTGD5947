import { useState, useEffect, useCallback } from 'react';
import { sizeApi, Size } from './admin-api';
import { toast } from 'sonner';
import { getErrorMessage } from './error-handler';

export function useSizes() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSizes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sizeApi.getSizes();
      if (response.data) {
        const data: any = response.data;
        if (Array.isArray(data)) {
          setSizes(data);
        } else if (data.sizes && Array.isArray(data.sizes)) {
          setSizes(data.sizes);
        } else {
          setSizes([]);
        }
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể tải danh sách sizes');
      setError(errorMsg);
      // Don't show toast on initial load, only on manual refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSizes();
  }, [fetchSizes]);

  return {
    sizes,
    loading,
    error,
    refetch: fetchSizes,
  };
}

