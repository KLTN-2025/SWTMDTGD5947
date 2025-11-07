import { useState, useEffect, useCallback } from 'react';
import { adminProductApi, AdminProduct, CreateProductRequest, UpdateProductRequest } from './admin-api';
import { toast } from 'sonner';

export function useAdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminProductApi.getProducts();
      if (response.data) {
        // Laravel returns { products: [], pagination: {} }
        const data: any = response.data;
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể tải danh sách sản phẩm';
      setError(errorMsg);
      toast.error(errorMsg);
      setProducts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Search products
  const searchProducts = useCallback(async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminProductApi.searchProducts(query);
      if (response.data) {
        setProducts(response.data);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể tìm kiếm sản phẩm';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create product
  const createProduct = useCallback(async (data: CreateProductRequest) => {
    try {
      const response = await adminProductApi.createProduct(data);
      if (response.data) {
        setProducts(prev => [...prev, response.data!]);
        toast.success('Tạo sản phẩm thành công');
        return response.data;
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể tạo sản phẩm';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Update product
  const updateProduct = useCallback(async (id: number, data: UpdateProductRequest) => {
    try {
      const response = await adminProductApi.updateProduct(id, data);
      if (response.data) {
        setProducts(prev => prev.map(p => p.id === id ? response.data! : p));
        toast.success('Cập nhật sản phẩm thành công');
        return response.data;
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể cập nhật sản phẩm';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Delete product
  const deleteProduct = useCallback(async (id: number) => {
    try {
      await adminProductApi.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Xóa sản phẩm thành công');
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể xóa sản phẩm';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Delete product image
  const deleteProductImage = useCallback(async (imageId: number) => {
    try {
      await adminProductApi.deleteProductImage(imageId);
      toast.success('Xóa ảnh thành công');
      // Refresh products to get updated data
      await fetchProducts();
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể xóa ảnh';
      toast.error(errorMsg);
      throw err;
    }
  }, [fetchProducts]);

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    searchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProductImage,
  };
}

// Hook for single product
export function useAdminProduct(id: number | null) {
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await adminProductApi.getProduct(id);
      if (response.data) {
        setProduct(response.data);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể tải thông tin sản phẩm';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id, fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}
