import { useState, useEffect } from 'react';
import { productApi } from '@/lib/product-api';
import { ApiError } from '@/lib/api-client';
import { Product, ProductsData, ProductSearchParams } from '@/lib/api-types';

export function useProducts(initialParams?: { per_page?: number; page?: number }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<ProductsData['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (params?: { per_page?: number; page?: number }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.getProducts(params || initialParams);
      
      if (response.data) {
        setProducts(response.data.products);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(typeof err.apiMessage === 'string' ? err.apiMessage : 'Lỗi tải sản phẩm');
      } else {
        setError('Lỗi kết nối. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const refetch = (params?: { per_page?: number; page?: number }) => {
    return fetchProducts(params);
  };

  return {
    products,
    pagination,
    loading,
    error,
    refetch,
  };
}

export function useProductSearch() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<ProductsData['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProducts = async (params: ProductSearchParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.searchProducts(params);
      
      if (response.data) {
        setProducts(response.data.products);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(typeof err.apiMessage === 'string' ? err.apiMessage : 'Lỗi tìm kiếm sản phẩm');
      } else {
        setError('Lỗi kết nối. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    pagination,
    loading,
    error,
    searchProducts,
  };
}

export function useProduct(id: number) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productApi.getProduct(id);
      
      if (response.data) {
        setProduct(response.data);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(typeof err.apiMessage === 'string' ? err.apiMessage : 'Lỗi tải sản phẩm');
      } else {
        setError('Lỗi kết nối. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const refetch = () => {
    return fetchProduct();
  };

  return {
    product,
    loading,
    error,
    refetch,
  };
}
