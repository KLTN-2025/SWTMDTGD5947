import { useState, useEffect, useCallback } from 'react';
import { colorApi, Color } from './admin-api';
import { toast } from 'sonner';
import { getErrorMessage } from './error-handler';

export function useColors() {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchColors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await colorApi.getColors();
      if (response.data) {
        const data: any = response.data;
        if (Array.isArray(data)) {
          setColors(data);
        } else if (data.colors && Array.isArray(data.colors)) {
          setColors(data.colors);
        } else {
          setColors([]);
        }
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể tải danh sách màu sắc');
      setError(errorMsg);
      // Don't show toast on initial load, only on manual refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  return {
    colors,
    loading,
    error,
    refetch: fetchColors,
  };
}
