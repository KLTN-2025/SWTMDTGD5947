export type ID = string;

export type Category = { id: ID; name: string; description?: string; image?: string };
export type Product = {
  id: ID;
  title: string;
  price: number;
  stock: number;
  categoryId?: ID;
  images: string[];
  discountPercentage?: number;
  brand?: string;
  rating?: number;
};
export type OrderStatus = "pending" | "confirmed" | "canceled" | "shipping" | "delivered";
export type OrderItem = { productId: ID; qty: number; price: number };
export type Order = { id: ID; customerId: ID; items: OrderItem[]; status: OrderStatus; createdAt: string };
export type Customer = { id: ID; name: string; email: string; avatar?: string };

export type ChatbotData = { corpus: string; lastTrainedAt?: string };

type DB = {
  categories: Category[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  chatbot: ChatbotData;
};

const KEY = "oce_admin_db_v1";

function uid() { return Math.random().toString(36).slice(2, 10); }

function load(): DB {
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw) as DB;
  const initial: DB = seed();
  localStorage.setItem(KEY, JSON.stringify(initial));
  return initial;
}

function save(db: DB) { localStorage.setItem(KEY, JSON.stringify(db)); }

function seed(): DB {
  const categories: Category[] = [
    { id: uid(), name: "Sneaker", description: "Thời trang hàng ngày", image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=400&auto=format&fit=crop" },
    { id: uid(), name: "Chạy bộ", description: "Êm ái bền bỉ", image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=400&auto=format&fit=crop" },
    { id: uid(), name: "Bóng rổ", description: "Bám sân ổn định", image: "https://images.unsplash.com/photo-1521417531039-99f890d3d097?q=80&w=400&auto=format&fit=crop" },
  ];
  const products: Product[] = Array.from({ length: 12 }).map((_, i) => ({
    id: uid(),
    title: `Shoe ${i + 1}`,
    price: 890000 + i * 50000,
    stock: 10 + i,
    categoryId: categories[i % categories.length].id,
    images: [
      "https://images.unsplash.com/photo-1542293787938-c9e299b88054?q=80&w=1200&auto=format&fit=crop",
    ],
    discountPercentage: i % 3 === 0 ? 10 : 0,
    brand: ["Nike", "Adidas", "Puma"][i % 3],
    rating: 4 + (i % 2) * 0.5,
  }));
  const customers: Customer[] = [
    { id: uid(), name: "Nguyễn Văn A", email: "a@example.com", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
    { id: uid(), name: "Trần Thị B", email: "b@example.com", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" },
  ];
  const orders: Order[] = [
    { id: uid(), customerId: customers[0].id, items: [{ productId: products[0].id, qty: 1, price: products[0].price }], status: "pending", createdAt: new Date().toISOString() },
    { id: uid(), customerId: customers[1].id, items: [{ productId: products[1].id, qty: 2, price: products[1].price }], status: "shipping", createdAt: new Date(Date.now() - 86400000).toISOString() },
  ];
  const chatbot: ChatbotData = { corpus: "Thông tin sản phẩm, size, đổi trả, vận chuyển" };
  return { categories, products, customers, orders, chatbot };
}

export const db = {
  get(): DB { return load(); },
  set(next: DB) { save(next); },

  // Helpers
  getCategory(id: ID) { return load().categories.find(c => c.id === id); },
  getProduct(id: ID) { return load().products.find(p => p.id === id); },
  getCustomer(id: ID) { return load().customers.find(c => c.id === id); },

  // Categories
  listCategories(): Category[] { return load().categories; },
  addCategory(payload: Omit<Category, "id">): Category {
    const data = load();
    const item: Category = { id: uid(), ...payload };
    data.categories.push(item); save(data); return item;
  },
  updateCategory(id: ID, patch: Partial<Omit<Category, "id">>): Category {
    const data = load();
    const idx = data.categories.findIndex(c => c.id === id); if (idx === -1) throw new Error("Không tìm thấy danh mục");
    data.categories[idx] = { ...data.categories[idx], ...patch }; save(data); return data.categories[idx];
  },
  deleteCategory(id: ID) {
    const data = load();
    data.categories = data.categories.filter(c => c.id !== id);
    data.products = data.products.map(p => p.categoryId === id ? { ...p, categoryId: undefined } : p);
    save(data);
  },

  // Products
  listProducts(): Product[] { return load().products; },
  addProduct(payload: Omit<Product, "id">): Product {
    const data = load();
    const item: Product = { id: uid(), ...payload };
    data.products.push(item); save(data); return item;
  },
  updateProduct(id: ID, patch: Partial<Omit<Product, "id">>): Product {
    const data = load();
    const idx = data.products.findIndex(p => p.id === id); if (idx === -1) throw new Error("Không tìm thấy sản phẩm");
    data.products[idx] = { ...data.products[idx], ...patch }; save(data); return data.products[idx];
  },
  deleteProduct(id: ID) {
    const data = load();
    data.products = data.products.filter(p => p.id !== id);
    save(data);
  },

  // Orders
  listOrders(): Order[] { return load().orders; },
  setOrderStatus(id: ID, status: OrderStatus): Order {
    const data = load();
    const idx = data.orders.findIndex(o => o.id === id); if (idx === -1) throw new Error("Không tìm thấy đơn hàng");
    data.orders[idx] = { ...data.orders[idx], status }; save(data); return data.orders[idx];
  },

  // Customers
  listCustomers(): Customer[] { return load().customers; },
  addCustomer(payload: Omit<Customer, "id">): Customer {
    const data = load(); const item: Customer = { id: uid(), ...payload }; data.customers.push(item); save(data); return item;
  },
  updateCustomer(id: ID, patch: Partial<Omit<Customer, "id">>): Customer {
    const data = load(); const idx = data.customers.findIndex(c => c.id === id); if (idx === -1) throw new Error("Không tìm thấy khách hàng");
    data.customers[idx] = { ...data.customers[idx], ...patch }; save(data); return data.customers[idx];
  },
  deleteCustomer(id: ID) { const data = load(); data.customers = data.customers.filter(c => c.id !== id); save(data); },

  // Chatbot
  getChatbot(): ChatbotData { return load().chatbot; },
  updateChatbot(patch: Partial<ChatbotData>): ChatbotData {
    const data = load();
    data.chatbot = { ...data.chatbot, ...patch, lastTrainedAt: patch.corpus ? new Date().toISOString() : data.chatbot.lastTrainedAt };
    save(data); return data.chatbot;
  },

  // Reports
  revenueByDay(last = 7): { date: string; revenue: number }[] {
    const orders = load().orders;
    const map = new Map<string, number>();
    for (let i = 0; i < last; i++) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      map.set(key, 0);
    }
    for (const o of orders) {
      if (o.status === "canceled") continue;
      const key = o.createdAt.slice(0, 10);
      const sum = o.items.reduce((s, it) => s + it.price * it.qty, 0);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + sum);
    }
    return Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([date, revenue]) => ({ date, revenue }));
  },
  topSellers(limit = 5): { title: string; sold: number }[] {
    const { products, orders } = load();
    const counter = new Map<ID, number>();
    for (const o of orders) for (const it of o.items) counter.set(it.productId, (counter.get(it.productId) || 0) + it.qty);
    return products.map(p => ({ title: p.title, sold: counter.get(p.id) || 0 }))
      .sort((a,b) => b.sold - a.sold).slice(0, limit);
  },
  inventory(): { title: string; stock: number }[] {
    return load().products.map(p => ({ title: p.title, stock: p.stock }));
  }
};
