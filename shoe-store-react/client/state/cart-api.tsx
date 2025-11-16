import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi, type CartItemResponse, type CartResponse } from "@/lib/cart-api";
import { useAuth } from "@/state/auth";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";

interface CartApiContextValue {
  // Data
  cartItems: CartItemResponse[];
  totalItems: number;
  totalAmount: number;
  summary: {
    itemCount: number;
    totalQuantity: number;
    totalAmount: number;
    currency: string;
  } | null;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  addToCart: (productVariantId: number, quantity: number) => Promise<void>;
  updateCartItem: (cartItemId: number, quantity: number) => Promise<void>;
  deleteCartItem: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Utilities
  getItemQuantity: (productVariantId: number) => number;
  isInCart: (productVariantId: number) => boolean;
  refetch: () => void;
}

const CartApiContext = createContext<CartApiContextValue | undefined>(undefined);

export function CartApiProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Query for cart items
  const {
    data: cartResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await cartApi.getCartItems();
      return response.data;
    },
    enabled: !!user, // Only fetch when user is logged in
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });

  // Extract cart data
  const cartItems = cartResponse?.cartItems || [];
  const totalItems = cartResponse?.totalItems || 0;
  const totalAmount = cartResponse?.totalAmount || 0;
  const summary = cartResponse?.summary || null;

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productVariantId, quantity }: { productVariantId: number; quantity: number }) => {
      const response = await cartApi.addToCart({ productVariantId, quantity });
      return response.data;
    },
    onSuccess: (data) => {
      // Update cart query data
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success(`Đã thêm sản phẩm vào giỏ hàng`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Thêm vào giỏ hàng thất bại';
      toast.error(message);
    }
  });

  // Update cart item mutation
  const updateCartItemMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) => {
      const response = await cartApi.updateCartItem(cartItemId, { quantity });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cập nhật giỏ hàng thành công');
    },
    onError: (error: any) => {
      if (error instanceof ApiError) {
        const message = typeof error.apiMessage === 'string' 
          ? error.apiMessage 
          : 'Cập nhật giỏ hàng thất bại';
        toast.error(message);
      } else {
        const message = error?.response?.data?.message || 'Cập nhật giỏ hàng thất bại';
        toast.error(message);
      }
    }
  });

  // Delete cart item mutation
  const deleteCartItemMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      await cartApi.deleteCartItem(cartItemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Xóa sản phẩm thất bại';
      toast.error(message);
    }
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await cartApi.clearCart();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Đã xóa toàn bộ giỏ hàng');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Xóa giỏ hàng thất bại';
      toast.error(message);
    }
  });

  // Action functions
  const addToCart = async (productVariantId: number, quantity: number) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }
    await addToCartMutation.mutateAsync({ productVariantId, quantity });
  };

  const updateCartItem = async (cartItemId: number, quantity: number) => {
    if (quantity <= 0) {
      await deleteCartItem(cartItemId);
      return;
    }
    await updateCartItemMutation.mutateAsync({ cartItemId, quantity });
  };

  const deleteCartItem = async (cartItemId: number) => {
    await deleteCartItemMutation.mutateAsync(cartItemId);
  };

  const clearCart = async () => {
    await clearCartMutation.mutateAsync();
  };

  // Utility functions
  const getItemQuantity = (productVariantId: number): number => {
    const item = cartItems.find(item => item.productVariantId === productVariantId);
    return item?.quantity || 0;
  };

  const isInCart = (productVariantId: number): boolean => {
    return cartItems.some(item => item.productVariantId === productVariantId);
  };

  // Clear cart data when user logs out
  useEffect(() => {
    if (!user) {
      queryClient.removeQueries({ queryKey: ['cart'] });
    }
  }, [user, queryClient]);

  const value: CartApiContextValue = {
    // Data
    cartItems,
    totalItems,
    totalAmount,
    summary,
    isLoading: isLoading || addToCartMutation.isPending || updateCartItemMutation.isPending || deleteCartItemMutation.isPending || clearCartMutation.isPending,
    error: error as Error | null,
    
    // Actions
    addToCart,
    updateCartItem,
    deleteCartItem,
    clearCart,
    
    // Utilities
    getItemQuantity,
    isInCart,
    refetch
  };

  return <CartApiContext.Provider value={value}>{children}</CartApiContext.Provider>;
}

export function useCartApi() {
  const ctx = useContext(CartApiContext);
  if (!ctx) throw new Error("useCartApi must be used within CartApiProvider");
  return ctx;
}
