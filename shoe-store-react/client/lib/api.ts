// Re-export types from the main types file for backward compatibility
export type {
  Product,
  ProductsResponse,
  ProductSearchParams,
  CartItem,
  Order,
  User,
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest
} from './types';

import { Product, ProductsResponse, ProductSearchParams } from './types';
import { apiClient } from './api-client';

// Legacy types for backward compatibility
export type PaymentMethod = "cod" | "vnpay" | "momo" | "paypal";

// Legacy ProductsQuery interface for backward compatibility
export interface ProductsQuery {
  search?: string;
  brand?: string;
  type?: string;
  color?: string;
  size?: number | string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

// Updated Product interface for backward compatibility with existing components
export interface LegacyProduct {
  id: number;
  title: string;
  description: string;
  brand: string;
  category: string;
  type: string;
  price: number;
  discountPercentage?: number;
  rating?: number;
  stock?: number;
  thumbnail: string;
  images: string[];
  color: string;
  sizes: (number | string)[];
  createdAt?: string;
  isNew?: boolean;
}

// Legacy ProductsResponse for backward compatibility
export interface LegacyProductsResponse {
  products: LegacyProduct[];
  total: number;
  page: number;
  limit: number;
}

// Helper function to convert API Product to Legacy Product format
function convertToLegacyProduct(product: Product): LegacyProduct {
  return {
    id: product.id,
    title: product.name,
    description: product.description || '',
    brand: product.categories?.[0]?.name || 'Unknown',
    category: product.categories?.[0]?.name || 'Unknown',
    type: product.categories?.[0]?.name || 'Unknown',
    price: product.basePrice,
    discountPercentage: 0,
    rating: 4.5,
    stock: product.quantity,
    thumbnail: product.images?.[0]?.url ? `http://localhost:8000/${product.images[0].url}` : '/placeholder.svg',
    images: product.images?.map(img => `http://localhost:8000/${img.url}`) || ['/placeholder.svg'],
    color: 'Unknown',
    sizes: product.variants?.map(v => v.size.name) || ['One Size'],
    createdAt: product.createdAt,
    isNew: new Date(product.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000, // New if created within 7 days
  };
}

// Helper function to convert ProductsQuery to ProductSearchParams
function convertToSearchParams(query: ProductsQuery): ProductSearchParams {
  return {
    keyword: query.search,
    min_price: query.minPrice,
    max_price: query.maxPrice,
    page: query.page,
    per_page: query.limit,
  };
}

// Helper function to convert ProductsResponse to LegacyProductsResponse
function convertToLegacyResponse(response: ProductsResponse): LegacyProductsResponse {
  return {
    products: response.products.map(convertToLegacyProduct),
    total: response.pagination.total,
    page: response.pagination.current_page,
    limit: response.pagination.per_page,
  };
}

// Mock data for fallback (keeping some for development)
const mockProducts: LegacyProduct[] = [
  {
    id: 1,
    title: "Giày thể thao Nike Air Max",
    description: "Giày thể thao cao cấp với công nghệ Air Max tiên tiến",
    brand: "Nike",
    category: "Giày",
    type: "Thể thao",
    price: 2500000,
    discountPercentage: 15,
    rating: 4.5,
    stock: 50,
    thumbnail: "/placeholder.svg",
    images: ["/placeholder.svg", "/placeholder.svg"],
    color: "Trắng",
    sizes: [38, 39, 40, 41, 42, 43],
    createdAt: "2024-10-15T10:00:00Z",
    isNew: false
  },
  {
    id: 2,
    title: "Áo thun Adidas Originals",
    description: "Áo thun cotton cao cấp với thiết kế hiện đại",
    brand: "Adidas",
    category: "Áo",
    type: "Thun",
    price: 850000,
    discountPercentage: 10,
    rating: 4.2,
    stock: 30,
    thumbnail: "/placeholder.svg",
    images: ["/placeholder.svg", "/placeholder.svg"],
    color: "Đen",
    sizes: ["S", "M", "L", "XL"],
    createdAt: "2024-10-12T14:30:00Z",
    isNew: false
  },
  {
    id: 3,
    title: "Quần jean Levi's 501",
    description: "Quần jean classic fit với chất liệu denim cao cấp",
    brand: "Levi's",
    category: "Quần",
    type: "Jean",
    price: 1200000,
    discountPercentage: 20,
    rating: 4.7,
    stock: 25,
    thumbnail: "/placeholder.svg",
    images: ["/placeholder.svg", "/placeholder.svg"],
    color: "Xanh",
    sizes: [28, 29, 30, 31, 32, 33, 34],
    createdAt: "2024-10-10T09:15:00Z",
    isNew: false
  }
];

function filterProducts(products: LegacyProduct[], query: ProductsQuery): LegacyProduct[] {
  return products.filter(product => {
    if (query.search && !product.title.toLowerCase().includes(query.search.toLowerCase())) {
      return false;
    }
    if (query.brand && product.brand !== query.brand) {
      return false;
    }
    if (query.type && product.type !== query.type) {
      return false;
    }
    if (query.color && product.color !== query.color) {
      return false;
    }
    if (query.minPrice && product.price < query.minPrice) {
      return false;
    }
    if (query.maxPrice && product.price > query.maxPrice) {
      return false;
    }
    return true;
  });
}

// Updated API functions that use real API but maintain backward compatibility
export async function fetchProducts(query: ProductsQuery = {}): Promise<LegacyProductsResponse> {
  try {
    const searchParams = convertToSearchParams(query);
    const response = await apiClient.getProducts(searchParams);
    
    if (response.status && response.data) {
      return convertToLegacyResponse(response.data);
    } else {
      throw new Error('Failed to fetch products');
    }
  } catch (error) {
    console.error('Failed to fetch products from API, using mock data:', error);
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const filteredProducts = filterProducts(mockProducts, query);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      products: filteredProducts.slice(startIndex, endIndex),
      total: filteredProducts.length,
      page,
      limit
    };
  }
}

export async function fetchProduct(id: number | string): Promise<LegacyProduct | null> {
  try {
    const response = await apiClient.getProduct(Number(id));
    
    if (response.status && response.data) {
      return convertToLegacyProduct(response.data);
    } else {
      throw new Error('Product not found');
    }
  } catch (error) {
    console.error('Failed to fetch product from API, using mock data:', error);
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const product = mockProducts.find(p => p.id === Number(id));
    return product || null;
  }
}

export async function fetchNewProducts(limit: number = 6): Promise<LegacyProductsResponse> {
  try {
    const response = await apiClient.getProducts({ 
      per_page: limit,
      sort_by: 'createdAt',
      sort_order: 'desc'
    });
    
    if (response.status && response.data) {
      const legacyResponse = convertToLegacyResponse(response.data);
      // Filter for new products
      const newProducts = legacyResponse.products.filter(p => p.isNew);
      
      return {
        products: newProducts.slice(0, limit),
        total: newProducts.length,
        page: 1,
        limit
      };
    } else {
      throw new Error('Failed to fetch new products');
    }
  } catch (error) {
    console.error('Failed to fetch new products from API, using mock data:', error);
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const newProducts = mockProducts
      .filter(p => p.isNew)
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      .slice(0, limit);
    
    return {
      products: newProducts,
      total: newProducts.length,
      page: 1,
      limit
    };
  }
}

export async function fetchFeaturedProducts(limit: number = 8): Promise<LegacyProductsResponse> {
  try {
    const response = await apiClient.getProducts({ 
      per_page: limit,
      sort_by: 'createdAt',
      sort_order: 'desc'
    });
    
    if (response.status && response.data) {
      const legacyResponse = convertToLegacyResponse(response.data);
      
      return {
        products: legacyResponse.products.slice(0, limit),
        total: legacyResponse.products.length,
        page: 1,
        limit
      };
    } else {
      throw new Error('Failed to fetch featured products');
    }
  } catch (error) {
    console.error('Failed to fetch featured products from API, using mock data:', error);
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const featuredProducts = mockProducts
      .filter(p => (p.rating && p.rating >= 4.3) || (p.discountPercentage && p.discountPercentage >= 15))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
    
    return {
      products: featuredProducts,
      total: featuredProducts.length,
      page: 1,
      limit
    };
  }
}
