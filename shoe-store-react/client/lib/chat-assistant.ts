import { apiClient } from "./api-client";
import { ApiResponse } from "./api-types";

export type ChatAssistantMode = "auto_answer" | "shoe_advisor" | "size_support" | "order_support";

export interface ChatPreferencesInput {
  categoryIds?: number[];
  colors?: string[];
  styleKeywords?: string[];
  usage?: string;
  budgetMin?: number;
  budgetMax?: number;
  gender?: string;
}

export interface SizeInfoInput {
  footLengthCm?: number;
  footWidthCm?: number;
  currentSize?: string;
  fitPreference?: string;
}

export interface ChatAssistantRequest {
  mode: ChatAssistantMode;
  message: string;
  chatBoxId?: number;
  orderCode?: string;
  preferences?: ChatPreferencesInput;
  sizeInfo?: SizeInfoInput;
}

export interface ChatHistoryEntry {
  id: number;
  role: "assistant" | "user" | "system";
  message: string;
  createdAt: string;
  meta?: Record<string, any> | null;
}

export interface SuggestedProduct {
  skuId: string;
  name: string;
  price: number;
  rating?: number | null;
  categories?: string[];
  colors?: string[];
  sizes?: string[];
  mainImage?: string | null;
  description?: string | null;
}

export interface SizeInsights {
  input?: Record<string, string | number | null>;
  history?: Array<{
    orderId?: number;
    productName?: string | null;
    skuId?: string | null;
    size?: string | null;
    purchasedAt?: string | null;
  }>;
  sizeChart?: Array<{ eu: number; cm: number }>;
  bestPractices?: string[];
}

export interface OrderSummary {
  orderId: number;
  status: string;
  paymentStatus: string;
  amount: number;
  createdAt?: string;
}

export interface OrderDetail extends OrderSummary {
  paymentMethod?: string;
  deliveryAddress?: string | null;
  items?: Array<{
    productName?: string | null;
    skuId?: string | null;
    size?: string | null;
    color?: string | null;
    quantity: number;
    amount: number;
  }>;
}

export interface ChatAssistantResponse {
  chatBoxId: number;
  mode: ChatAssistantMode;
  modeLabel: string;
  reply: string;
  history: ChatHistoryEntry[];
  suggestedProducts?: SuggestedProduct[];
  sizeInsights?: SizeInsights | null;
  ordersSummary?: OrderSummary[];
  orderDetail?: OrderDetail | null;
  detectedOrderCode?: string | null;
}

export interface ChatSessionSummary {
  id: number;
  mode: ChatAssistantMode;
  modeLabel: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  totalMessages: number;
}

export interface ChatSessionDetail {
  chatBoxId: number;
  history: ChatHistoryEntry[];
}

class ChatAssistantApi {
  async sendMessage(payload: ChatAssistantRequest): Promise<ApiResponse<ChatAssistantResponse>> {
    return apiClient.post<ChatAssistantResponse>("/chat-box/messages", payload);
  }

  async getSessions(): Promise<ApiResponse<ChatSessionSummary[]>> {
    return apiClient.get<ChatSessionSummary[]>("/chat-box/sessions");
  }

  async getSessionDetail(chatBoxId: number): Promise<ApiResponse<ChatSessionDetail>> {
    return apiClient.get<ChatSessionDetail>(`/chat-box/sessions/${chatBoxId}`);
  }
}

export const chatAssistantApi = new ChatAssistantApi();

