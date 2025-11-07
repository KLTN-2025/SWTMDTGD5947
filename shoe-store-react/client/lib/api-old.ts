// Re-export types from the main types file for backward compatibility
export type {
  Product,
  ProductsResponse,
  ProductSearchParams as ProductsQuery,
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
  },
  {
    id: 4,
    title: "Túi xách Louis Vuitton",
    description: "Túi xách da thật cao cấp thiết kế sang trọng",
    brand: "Louis Vuitton",
    category: "Phụ kiện",
    type: "Túi xách",
    price: 15000000,
    discountPercentage: 5,
    rating: 4.9,
    stock: 10,
    thumbnail: "/placeholder.svg",
    images: ["/placeholder.svg", "/placeholder.svg"],
    color: "Nâu",
    sizes: ["One Size"],
    createdAt: "2024-10-08T16:45:00Z",
    isNew: false
  },
  {
    id: 5,
    title: "Đồng hồ Rolex Submariner",
    description: "Đồng hồ cơ học tự động cao cấp chống nước",
    brand: "Rolex",
    category: "Phụ kiện",
    type: "Đồng hồ",
    price: 250000000,
    rating: 5.0,
    stock: 3,
    thumbnail: "/placeholder.svg",
    images: ["/placeholder.svg", "/placeholder.svg"],
    color: "Bạc",
    sizes: ["One Size"],
    createdAt: "2024-10-05T11:20:00Z",
    isNew: false
  },
  // New products
  {
    id: 6,
    title: "Giày sneaker Puma RS-X",
    description: "Giày sneaker retro với thiết kế chunky hiện đại",
    brand: "Puma",
    category: "Giày",
    type: "sneaker",
    price: 1800000,
    discountPercentage: 25,
    rating: 4.3,
    stock: 35,
    thumbnail: "/placeholder.svg",
    images: ["/placeholder.svg", "/placeholder.svg"],
    color: "Đa màu",
    sizes: [38, 39, 40, 41, 42, 43, 44],
    createdAt: "2024-10-17T08:00:00Z",
    isNew: true
  },
  {
    id: 7,
    title: "Áo hoodie Uniqlo Heattech",
    description: "Áo hoodie giữ nhiệt công nghệ Heattech",
    brand: "Uniqlo",
    category: "Áo",
    type: "Hoodie",
    price: 990000,
    rating: 4.4,
    stock: 45,
    thumbnail: "/placeholder.svg",
    images: ["/placeholder.svg", "/placeholder.svg"],
    color: "Xám",
    sizes: ["S", "M", "L", "XL", "XXL"],
    createdAt: "2024-10-16T15:30:00Z",
    isNew: true
  },
  {
    id: 8,
    title: "Giày boot Dr. Martens 1460",
    description: "Boot da thật kinh điển với đế AirWair",
    brand: "Dr. Martens",
    category: "Giày",
    type: "boot",
    price: 3200000,
    rating: 4.8,
    stock: 20,
    thumbnail: "/placeholder.svg",
    images: ["/placeholder.svg", "/placeholder.svg"],
    color: "Đen",
    sizes: [38, 39, 40, 41, 42, 43],
    createdAt: "2024-10-16T12:00:00Z",
    isNew: true
  },
  {
    id: 9,
    title: "Quần short Nike Dri-FIT",
    description: "Quần short thể thao với công nghệ thấm hút mồ hôi",
    brand: "Nike",
    category: "Quần",
    type: "Short",
    price: 650000,
    discountPercentage: 15,
    rating: 4.1,
    stock: 60,
    thumbnail: "/placeholder.svg",
    images: ["/placeholder.svg", "/placeholder.svg"],
    color: "Đen",
    sizes: ["S", "M", "L", "XL"],
    createdAt: "2024-10-15T20:15:00Z",
    isNew: true
  },
  {
    id: 10,
    title: "Kính mát Ray-Ban Aviator",
    description: "Kính mát phi công kinh điển với gọng kim loại",
    brand: "Ray-Ban",
    category: "Phụ kiện",
    type: "Kính mát",
    price: 2800000,
    rating: 4.6,
    stock: 15,
    thumbnail: "/placeholder.svg",
    images: ["/placeholder.svg", "/placeholder.svg"],
    color: "Vàng",
    sizes: ["One Size"],
    createdAt: "2024-10-15T13:45:00Z",
    isNew: true
  }
];

function filterProducts(products: Product[], query: ProductsQuery): Product[] {
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

export async function fetchProducts(query: ProductsQuery = {}): Promise<ProductsResponse> {
  // Simulate API delay
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

export async function fetchProduct(id: number | string): Promise<Product | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const product = mockProducts.find(p => p.id === Number(id));
  return product || null;
}

export async function fetchNewProducts(limit: number = 6): Promise<ProductsResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 250));
  
  // Get new products sorted by creation date (newest first)
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

export async function fetchFeaturedProducts(limit: number = 8): Promise<ProductsResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Get featured products (high rating or discount)
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
