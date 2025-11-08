import { useState, useEffect, useCallback } from 'react';
import { adminCategoryApi, AdminCategory, CreateCategoryRequest, UpdateCategoryRequest } from './admin-api';
import { toast } from 'sonner';
import { getErrorMessage } from './error-handler';

export function useAdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminCategoryApi.getCategories();
      if (response.data) {
        // Laravel returns { categories: [], pagination: {} }
        const data: any = response.data;
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else {
          setCategories([]);
        }
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể tải danh sách danh mục');
      setError(errorMsg);
      toast.error(errorMsg);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create category
  const createCategory = useCallback(async (data: CreateCategoryRequest) => {
    try {
      const response = await adminCategoryApi.createCategory(data);
      if (response.data) {
        setCategories(prev => [...prev, response.data!]);
        toast.success('Tạo danh mục thành công');
        return response.data;
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể tạo danh mục');
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Update category
  const updateCategory = useCallback(async (id: number, data: UpdateCategoryRequest) => {
    try {
      const response = await adminCategoryApi.updateCategory(id, data);
      if (response.data) {
        setCategories(prev => prev.map(c => c.id === id ? response.data! : c));
        toast.success('Cập nhật danh mục thành công');
        return response.data;
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể cập nhật danh mục');
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Delete category
  const deleteCategory = useCallback(async (id: number) => {
    try {
      await adminCategoryApi.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Xóa danh mục thành công');
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể xóa danh mục');
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

// Hook for single category
export function useAdminCategory(id: number | null) {
  const [category, setCategory] = useState<AdminCategory | null>(null);
  const [loading, setLoading] = useState(true); // Start with true to prevent premature redirect
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await adminCategoryApi.getCategory(id);
      console.log('API Response for category:', response);
      console.log('Response data:', response.data);
      if (response.data) {
        setCategory(response.data);
        console.log('Category set:', response.data);
      } else {
        console.log('No data in response!');
      }
    } catch (err: any) {
      console.error('Error fetching category:', err);
      const errorMsg = getErrorMessage(err, 'Không thể tải thông tin danh mục');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchCategory();
    }
  }, [id, fetchCategory]);

  return {
    category,
    loading,
    error,
    refetch: fetchCategory,
  };
}
