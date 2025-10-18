import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Order, PaymentMethod, Product } from "@/lib/api";

interface CartContextValue {
  items: CartItem[];
  add: (product: Product, size: number | string, quantity?: number) => void;
  remove: (productId: number, size: number | string) => void;
  updateQty: (productId: number, size: number | string, quantity: number) => void;
  clear: () => void;
  total: number;
  placeOrder: (info: { name: string; phone: string; address: string; city: string; paymentMethod: PaymentMethod }) => Order;
  orders: Order[];
  cancelOrder: (id: string) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_KEY = "oce_cart_v1";
const ORDERS_KEY = "oce_orders_v1";

function readLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readLS<CartItem[]>(CART_KEY, []));
  const [orders, setOrders] = useState<Order[]>(() => readLS<Order[]>(ORDERS_KEY, []));

  useEffect(() => writeLS(CART_KEY, items), [items]);
  useEffect(() => writeLS(ORDERS_KEY, orders), [orders]);

  const add: CartContextValue["add"] = (product, size, quantity = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id && i.size === size);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { product, size, quantity }];
    });
  };

  const remove: CartContextValue["remove"] = (productId, size) => {
    setItems((prev) => prev.filter((i) => !(i.product.id === productId && i.size === size)));
  };

  const updateQty: CartContextValue["updateQty"] = (productId, size, quantity) => {
    setItems((prev) => prev.map((i) => (i.product.id === productId && i.size === size ? { ...i, quantity } : i)));
  };

  const clear = () => setItems([]);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0), [items]);

  const placeOrder: CartContextValue["placeOrder"] = ({ name, phone, address, city, paymentMethod }) => {
    const order: Order = {
      id: `ORD-${Date.now().toString(36)}`,
      items,
      total,
      status: "cho_xu_ly",
      createdAt: new Date().toISOString(),
      paymentMethod,
      shippingAddress: { name, phone, address, city },
    };
    setOrders((prev) => [order, ...prev]);
    clear();
    return order;
  };

  const cancelOrder = (id: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "da_huy" } : o)));
  };

  const updateOrderStatus: CartContextValue["updateOrderStatus"] = (id, status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const value: CartContextValue = { items, add, remove, updateQty, clear, total, placeOrder, orders, cancelOrder, updateOrderStatus };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
