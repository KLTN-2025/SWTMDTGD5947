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

export type ChatMessage = {
  id: ID;
  userId: ID;
  categoryId?: ID;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type ChatHistory = {
  id: ID;
  chatBoxId: ID;
  context: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

type DB = {
  categories: Category[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  chatbot: ChatbotData;
  chatMessages: ChatMessage[];
  chatHistories: ChatHistory[];
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
  // Real shoe product data with diverse images
  const shoeProducts = [
    {
      title: "Nike Air Max 270",
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop"
      ],
      brand: "Nike",
      price: 2890000,
      stock: 15,
      rating: 4.5,
      discountPercentage: 15
    },
    {
      title: "Adidas Ultraboost 22",
      images: [
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=1200&auto=format&fit=crop"
      ],
      brand: "Adidas",
      price: 3200000,
      stock: 8,
      rating: 4.8,
      discountPercentage: 0
    },
    {
      title: "Puma RS-X Reinvention",
      images: [
        "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1200&auto=format&fit=crop"
      ],
      brand: "Puma",
      price: 2100000,
      stock: 12,
      rating: 4.2,
      discountPercentage: 20
    },
    {
      title: "Nike Air Jordan 1 Retro",
      images: [
        "https://images.unsplash.com/photo-1556906781-9a412961c28c?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=1200&auto=format&fit=crop"
      ],
      brand: "Nike",
      price: 4500000,
      stock: 5,
      rating: 4.9,
      discountPercentage: 0
    },
    {
      title: "Adidas Stan Smith Classic",
      images: [
        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop"
      ],
      brand: "Adidas",
      price: 1890000,
      stock: 20,
      rating: 4.6,
      discountPercentage: 10
    },
    {
      title: "Puma Suede Classic",
      images: [
        "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?q=80&w=1200&auto=format&fit=crop"
      ],
      brand: "Puma",
      price: 1650000,
      stock: 18,
      rating: 4.3,
      discountPercentage: 0
    },
    {
      title: "Nike React Infinity Run",
      images: [
        "https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1574408364253-6e4c2f1a8c5c?q=80&w=1200&auto=format&fit=crop"
      ],
      brand: "Nike",
      price: 3100000,
      stock: 10,
      rating: 4.7,
      discountPercentage: 0
    },
    {
      title: "Adidas NMD R1",
      images: [
        "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?q=80&w=1200&auto=format&fit=crop"
      ],
      brand: "Adidas",
      price: 2750000,
      stock: 7,
      rating: 4.4,
      discountPercentage: 25
    },
    {
      title: "Puma Future Rider",
      images: [
        "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1605348532760-6753d2c43329?q=80&w=1200&auto=format&fit=crop"
      ],
      brand: "Puma",
      price: 1980000,
      stock: 14,
      rating: 4.1,
      discountPercentage: 15
    },
    {
      title: "Nike Dunk Low Retro",
      images: [
        "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1605408499391-6368c628ef42?q=80&w=1200&auto=format&fit=crop"
      ],
      brand: "Nike",
      price: 2650000,
      stock: 9,
      rating: 4.6,
      discountPercentage: 0
    },
    {
      title: "Adidas Gazelle Vintage",
      images: [
        "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=1200&auto=format&fit=crop"
      ],
      brand: "Adidas",
      price: 2200000,
      stock: 16,
      rating: 4.5,
      discountPercentage: 0
    },
    {
      title: "Puma Cali Sport Heritage",
      images: [
        "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?q=80&w=1200&auto=format&fit=crop"
      ],
      brand: "Puma",
      price: 1750000,
      stock: 11,
      rating: 4.2,
      discountPercentage: 30
    }
  ];

  const products: Product[] = shoeProducts.map((shoe, i) => ({
    id: uid(),
    title: shoe.title,
    price: shoe.price,
    stock: shoe.stock,
    categoryId: categories[i % categories.length].id,
    images: shoe.images,
    discountPercentage: shoe.discountPercentage,
    brand: shoe.brand,
    rating: shoe.rating,
  }));
  const customers: Customer[] = [
    { id: uid(), name: "Nguyễn Văn Minh", email: "minh.nguyen@example.com", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop" },
    { id: uid(), name: "Trần Thị Hương", email: "huong.tran@example.com", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" },
    { id: uid(), name: "Lê Hoàng Nam", email: "nam.le@example.com", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" },
    { id: uid(), name: "Phạm Thị Lan", email: "lan.pham@example.com", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop" },
    { id: uid(), name: "Hoàng Văn Đức", email: "duc.hoang@example.com", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop" },
    { id: uid(), name: "Vũ Thị Mai", email: "mai.vu@example.com", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=200&auto=format&fit=crop" },
  ];
  const orders: Order[] = [
    { 
      id: uid(), 
      customerId: customers[0].id, 
      items: [{ productId: products[0].id, qty: 1, price: products[0].price }], 
      status: "pending", 
      createdAt: new Date().toISOString() 
    },
    { 
      id: uid(), 
      customerId: customers[1].id, 
      items: [
        { productId: products[1].id, qty: 1, price: products[1].price },
        { productId: products[4].id, qty: 1, price: products[4].price }
      ], 
      status: "shipping", 
      createdAt: new Date(Date.now() - 86400000).toISOString() 
    },
    { 
      id: uid(), 
      customerId: customers[2].id, 
      items: [{ productId: products[3].id, qty: 1, price: products[3].price }], 
      status: "delivered", 
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString() 
    },
    { 
      id: uid(), 
      customerId: customers[3].id, 
      items: [
        { productId: products[2].id, qty: 2, price: products[2].price },
        { productId: products[5].id, qty: 1, price: products[5].price }
      ], 
      status: "confirmed", 
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString() 
    },
    { 
      id: uid(), 
      customerId: customers[4].id, 
      items: [{ productId: products[6].id, qty: 1, price: products[6].price }], 
      status: "delivered", 
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString() 
    },
    { 
      id: uid(), 
      customerId: customers[5].id, 
      items: [{ productId: products[7].id, qty: 1, price: products[7].price }], 
      status: "canceled", 
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString() 
    },
    { 
      id: uid(), 
      customerId: customers[0].id, 
      items: [
        { productId: products[8].id, qty: 1, price: products[8].price },
        { productId: products[9].id, qty: 1, price: products[9].price }
      ], 
      status: "delivered", 
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString() 
    },
    { 
      id: uid(), 
      customerId: customers[2].id, 
      items: [{ productId: products[10].id, qty: 2, price: products[10].price }], 
      status: "shipping", 
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString() 
    },
    { 
      id: uid(), 
      customerId: customers[1].id, 
      items: [{ productId: products[11].id, qty: 1, price: products[11].price }], 
      status: "pending", 
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString() 
    },
    { 
      id: uid(), 
      customerId: customers[4].id, 
      items: [
        { productId: products[0].id, qty: 1, price: products[0].price },
        { productId: products[2].id, qty: 1, price: products[2].price },
        { productId: products[6].id, qty: 1, price: products[6].price }
      ], 
      status: "delivered", 
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString() 
    },
    { 
      id: uid(), 
      customerId: customers[3].id, 
      items: [{ productId: products[1].id, qty: 2, price: products[1].price }], 
      status: "confirmed", 
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString() 
    },
    { 
      id: uid(), 
      customerId: customers[5].id, 
      items: [{ productId: products[4].id, qty: 1, price: products[4].price }], 
      status: "delivered", 
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString() 
    }
  ];
  
  // Mock chat data
  const chatMessages: ChatMessage[] = [
    {
      id: uid(),
      userId: customers[0].id,
      categoryId: categories[0].id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uid(),
      userId: customers[1].id,
      categoryId: categories[1].id,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: uid(),
      userId: customers[2].id,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const chatHistories: ChatHistory[] = [
    {
      id: uid(),
      chatBoxId: chatMessages[0].id,
      context: "user_question",
      message: "Xin chào, tôi muốn tìm giày chạy bộ size 42",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uid(),
      chatBoxId: chatMessages[0].id,
      context: "bot_response",
      message: "Chào bạn! Tôi có thể giúp bạn tìm giày chạy bộ size 42. Hiện tại shop có Nike React Infinity Run và Adidas Ultraboost 22 size 42. Bạn có muốn xem chi tiết không?",
      createdAt: new Date(Date.now() + 1000).toISOString(),
      updatedAt: new Date(Date.now() + 1000).toISOString()
    },
    {
      id: uid(),
      chatBoxId: chatMessages[1].id,
      context: "user_question",
      message: "Giày này có bảo hành không?",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: uid(),
      chatBoxId: chatMessages[1].id,
      context: "bot_response",
      message: "Tất cả sản phẩm tại shop đều có bảo hành 6 tháng với lỗi từ nhà sản xuất. Ngoài ra, bạn có thể đổi size trong vòng 7 ngày nếu chưa sử dụng.",
      createdAt: new Date(Date.now() - 3599000).toISOString(),
      updatedAt: new Date(Date.now() - 3599000).toISOString()
    },
    {
      id: uid(),
      chatBoxId: chatMessages[2].id,
      context: "user_question",
      message: "Có khuyến mãi gì không?",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: uid(),
      chatBoxId: chatMessages[2].id,
      context: "bot_response",
      message: "Hiện tại shop đang có chương trình giảm giá lên đến 30% cho một số sản phẩm. Bạn có thể xem chi tiết tại trang sản phẩm hoặc liên hệ để được tư vấn thêm!",
      createdAt: new Date(Date.now() - 7199000).toISOString(),
      updatedAt: new Date(Date.now() - 7199000).toISOString()
    }
  ];

  const chatbot: ChatbotData = { corpus: "Thông tin sản phẩm, size, đổi trả, vận chuyển" };
  return { categories, products, customers, orders, chatbot, chatMessages, chatHistories };
}

export const db = {
  get(): DB { return load(); },
  set(next: DB) { save(next); },
  
  // Reset database with fresh seed data
  reset() { 
    localStorage.removeItem(KEY); 
    return load(); 
  },

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
  },

  // Chat Management
  listChatMessages(): ChatMessage[] { 
    const data = load();
    return (data.chatMessages || []).filter(c => !c.deletedAt); 
  },
  listChatHistories(): ChatHistory[] { 
    const data = load();
    return (data.chatHistories || []).filter(h => !h.deletedAt); 
  },
  getChatHistoriesByMessageId(chatBoxId: ID): ChatHistory[] {
    const data = load();
    return (data.chatHistories || []).filter(h => h.chatBoxId === chatBoxId && !h.deletedAt);
  },
  deleteChatMessage(id: ID) {
    const data = load();
    if (!data.chatMessages) return;
    const idx = data.chatMessages.findIndex(c => c.id === id);
    if (idx !== -1) {
      data.chatMessages[idx] = { ...data.chatMessages[idx], deletedAt: new Date().toISOString() };
      save(data);
    }
  }
};
