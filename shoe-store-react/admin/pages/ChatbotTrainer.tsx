import { InputHTMLAttributes, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, MessageCircle, User, RefreshCw } from "lucide-react";
import {
  chatAssistantApi,
  ChatAssistantMode,
  ChatHistoryEntry,
  SuggestedProduct,
  SizeInsights,
  OrderSummary,
  OrderDetail,
  ChatSessionSummary,
  ChatSessionDetail,
} from "../lib/chat-assistant";
import { useAdminCategories } from "../lib/use-admin-categories";
import { useColors } from "../lib/use-colors";

type AdvisorForm = {
  categories: string;
  colors: string;
  usage: string;
  budgetMin: string;
  budgetMax: string;
};

type SizeForm = {
  footLengthCm: string;
  footWidthCm: string;
  currentSize: string;
  fitPreference: string;
};

const modeOptions: { value: ChatAssistantMode; label: string }[] = [
  { value: "auto_answer", label: "Tự động trả lời" },
  { value: "shoe_advisor", label: "Tư vấn chọn giày" },
  { value: "size_support", label: "Tư vấn size" },
  { value: "order_support", label: "Hỗ trợ đơn hàng" },
];

export default function ChatbotTrainer() {
  const [mode, setMode] = useState<ChatAssistantMode>("auto_answer");
  const [message, setMessage] = useState("");
  const [chatBoxId, setChatBoxId] = useState<number | null>(null);
  const [history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [sizeInsights, setSizeInsights] = useState<SizeInsights | null>(null);
  const [ordersSummary, setOrdersSummary] = useState<OrderSummary[]>([]);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [detectedOrderCode, setDetectedOrderCode] = useState<string | null>(null);
  const [orderCodeInput, setOrderCodeInput] = useState("");
  const [advisorForm, setAdvisorForm] = useState<AdvisorForm>({
    categories: "",
    colors: "",
    usage: "",
    budgetMin: "",
    budgetMax: "",
  });
  const [sizeForm, setSizeForm] = useState<SizeForm>({
    footLengthCm: "",
    footWidthCm: "",
    currentSize: "",
    fitPreference: "",
  });
  const [isSending, setIsSending] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { categories } = useAdminCategories();
  const { colors: colorOptions } = useColors();

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const response = await chatAssistantApi.getSessions();
      if (response.data && Array.isArray(response.data)) {
        setSessions(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tải danh sách phiên chat"));
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const parsedPreferences = useMemo(() => {
    if (mode !== "shoe_advisor") return undefined;
    const prefs: any = {};
    if (selectedCategoryIds.length) {
      prefs.categoryIds = selectedCategoryIds;
    }
    if (selectedColors.length) {
      prefs.colors = selectedColors;
    }
    if (advisorForm.usage.trim()) {
      prefs.usage = advisorForm.usage.trim();
    }
    if (advisorForm.budgetMin) {
      prefs.budgetMin = Number(advisorForm.budgetMin);
    }
    if (advisorForm.budgetMax) {
      prefs.budgetMax = Number(advisorForm.budgetMax);
    }
    return Object.keys(prefs).length ? prefs : undefined;
  }, [mode, advisorForm, selectedCategoryIds, selectedColors]);

  const parsedSizeInfo = useMemo(() => {
    if (mode !== "size_support") return undefined;
    const info: any = {};
    if (sizeForm.footLengthCm) info.footLengthCm = Number(sizeForm.footLengthCm);
    if (sizeForm.footWidthCm) info.footWidthCm = Number(sizeForm.footWidthCm);
    if (sizeForm.currentSize.trim()) info.currentSize = sizeForm.currentSize.trim();
    if (sizeForm.fitPreference.trim()) info.fitPreference = sizeForm.fitPreference.trim();
    return Object.keys(info).length ? info : undefined;
  }, [mode, sizeForm]);

  const sendMessage = async () => {
    if (!message.trim()) {
      toast.error("Vui lòng nhập nội dung huấn luyện");
      return;
    }

    const userMessage = message.trim();
    
    // Thêm tin nhắn user ngay lập tức để hiển thị
    const tempUserEntry: ChatHistoryEntry = {
      id: Date.now(),
      role: "user",
      message: userMessage,
      createdAt: new Date().toISOString(),
    };
    
    setHistory((prev) => [...prev, tempUserEntry]);
    setMessage("");
    setIsSending(true);
    
    // Scroll xuống ngay sau khi thêm tin nhắn user
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 0);

    try {
      const response = await chatAssistantApi.sendMessage(
        {
          mode,
          message: userMessage,
          chatBoxId: chatBoxId ?? undefined,
          orderCode: orderCodeInput.trim() || undefined,
          preferences: parsedPreferences,
          sizeInfo: parsedSizeInfo,
        },
        true
      );
      if (response.data) {
        const data = response.data;
        setChatBoxId(data.chatBoxId);
        // Thay thế toàn bộ history bằng data từ API (đã bao gồm cả tin nhắn user và assistant)
        setHistory(data.history || []);
        setSuggestedProducts(data.suggestedProducts || []);
        setSizeInsights(data.sizeInsights || null);
        setOrdersSummary(data.ordersSummary || []);
        setOrderDetail(data.orderDetail || null);
        setDetectedOrderCode(data.detectedOrderCode || null);
        fetchSessions();
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 50);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể gửi tin nhắn"));
      // Xóa tin nhắn tạm và restore input
      setHistory((prev) => prev.filter((entry) => entry.id !== tempUserEntry.id));
      setMessage(userMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const loadSession = async (sessionId: number) => {
    try {
      const response = await chatAssistantApi.getSessionDetail(sessionId);
      if (response.data) {
        const data = response.data;
        setChatBoxId(data.chatBoxId);
        setHistory(data.history || []);
        setSuggestedProducts([]);
        setSizeInsights(null);
        setOrdersSummary([]);
        setOrderDetail(null);
        setDetectedOrderCode(null);
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 50);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tải phiên chat"));
    }
  };

  const getErrorMessage = (error: any, fallback: string) => {
    if (error?.message) return error.message;
    return fallback;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">AI Trainer</p>
        <h1 className="text-3xl font-bold tracking-tight">Huấn luyện & kiểm thử Chatbot</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
          Gửi tình huống thực tế, tinh chỉnh tham số và theo dõi phản hồi theo thời gian thực. Các yêu cầu sẽ
          được gửi tới API nội bộ{" "}
          <code className="px-1 py-0.5 rounded bg-gray-100 text-xs dark:bg-gray-800">/admin/chat-box/send</code>.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[5fr_3fr]">
        <Card className="min-h-[600px] max-h-[82vh] flex flex-col overflow-hidden">
          <CardHeader className="border-b flex-shrink-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="whitespace-nowrap">Khung chat huấn luyện</CardTitle>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select value={mode} onValueChange={(value: ChatAssistantMode) => setMode(value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Chọn chế độ" />
                  </SelectTrigger>
                  <SelectContent>
                    {modeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Mã đơn hàng (nếu có)"
                  value={orderCodeInput}
                  onChange={(e) => setOrderCodeInput(e.target.value)}
                  className="w-[180px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
            <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 space-y-3 py-4">
              {history.length === 0 && (
                <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                  Bắt đầu phiên huấn luyện bằng cách nhập câu hỏi bên dưới.
                </div>
              )}
              {history.map((entry) => (
                <div 
                  key={entry.id} 
                  className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      entry.role === "user"
                        ? "bg-blue-600 text-white"
                        : entry.role === "assistant"
                          ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                          : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{entry.message}</p>
                    <p
                      className={`mt-1.5 text-[10px] ${
                        entry.role === "user" ? "text-blue-200" : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {new Date(entry.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang suy nghĩ...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
              <Textarea
                rows={2}
                placeholder="Nhập câu hỏi... (Enter để gửi, Shift+Enter để xuống dòng)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
              />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500">
                  Chế độ: <strong>{modeOptions.find((m) => m.value === mode)?.label}</strong>
                </p>
                <Button onClick={sendMessage} disabled={isSending || !message.trim()} className="w-full sm:w-auto">
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Gửi tin nhắn
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Phiên gần đây</CardTitle>
                <p className="text-sm text-gray-500">Tiếp tục huấn luyện trên các phiên đã tạo.</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchSessions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessionsLoading && (
                <div className="flex items-center justify-center py-4 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang tải danh sách phiên...
                </div>
              )}
              {!sessionsLoading && sessions.length === 0 && (
                <p className="text-sm text-gray-500">Chưa có phiên huấn luyện nào.</p>
              )}
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`border rounded-lg p-3 flex flex-col gap-1 text-sm ${
                    chatBoxId === session.id ? "border-blue-500" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{session.modeLabel}</span>
                    <Badge variant="outline">{session.totalMessages} tin</Badge>
                  </div>
                  <p className="text-gray-600 truncate">{session.lastMessage || "Chưa có tin nhắn"}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {session.lastMessageAt
                        ? new Date(session.lastMessageAt).toLocaleString("vi-VN")
                        : "—"}
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => loadSession(session.id)}>
                      Mở
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cấu hình đầu vào</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mode === "shoe_advisor" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Danh mục ưu tiên</label>
                    <Select
                      onValueChange={(value) => {
                        const numeric = Number(value);
                        if (selectedCategoryIds.includes(numeric)) {
                          setSelectedCategoryIds((prev) => prev.filter((id) => id !== numeric));
                        } else {
                          setSelectedCategoryIds((prev) => [...prev, numeric]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategoryIds.map((id) => {
                        const cat = categories.find((c) => c.id === id);
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() =>
                              setSelectedCategoryIds((prev) => prev.filter((item) => item !== id))
                            }
                          >
                            {cat?.name || `ID ${id}`} ×
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">Màu sắc ưu tiên</label>
                    <Select
                      onValueChange={(value) => {
                        if (selectedColors.includes(value)) {
                          setSelectedColors((prev) => prev.filter((item) => item !== value));
                        } else {
                          setSelectedColors((prev) => [...prev, value]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn màu sắc" />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.name} value={color.name}>
                            {color.name} {color.hexCode ? `(#${color.hexCode})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2">
                      {selectedColors.map((color) => (
                        <Badge
                          key={color}
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() =>
                            setSelectedColors((prev) => prev.filter((item) => item !== color))
                          }
                        >
                          {color} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <LabeledInput
                    label="Nhu cầu sử dụng"
                    placeholder="Đi làm, đi học..."
                    value={advisorForm.usage}
                    onChange={(e) => setAdvisorForm({ ...advisorForm, usage: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <LabeledInput
                      label="Ngân sách từ (VND)"
                      type="number"
                      value={advisorForm.budgetMin}
                      onChange={(e) => setAdvisorForm({ ...advisorForm, budgetMin: e.target.value })}
                    />
                    <LabeledInput
                      label="Đến (VND)"
                      type="number"
                      value={advisorForm.budgetMax}
                      onChange={(e) => setAdvisorForm({ ...advisorForm, budgetMax: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {mode === "size_support" && (
                <div className="space-y-3">
                  <LabeledInput
                    label="Chiều dài bàn chân (cm)"
                    type="number"
                    value={sizeForm.footLengthCm}
                    onChange={(e) => setSizeForm({ ...sizeForm, footLengthCm: e.target.value })}
                  />
                  <LabeledInput
                    label="Chiều rộng bàn chân (cm)"
                    type="number"
                    value={sizeForm.footWidthCm}
                    onChange={(e) => setSizeForm({ ...sizeForm, footWidthCm: e.target.value })}
                  />
                  <LabeledInput
                    label="Size đang mang"
                    placeholder="EU 41"
                    value={sizeForm.currentSize}
                    onChange={(e) => setSizeForm({ ...sizeForm, currentSize: e.target.value })}
                  />
                  <LabeledInput
                    label="Sở thích (ôm chân, thoáng...)"
                    placeholder="Thích ôm vừa"
                    value={sizeForm.fitPreference}
                    onChange={(e) => setSizeForm({ ...sizeForm, fitPreference: e.target.value })}
                  />
                </div>
              )}

              {mode === "order_support" && (
                <div className="text-sm text-gray-500 space-y-2">
                  <p>Gợi ý: nhập mã đơn hoặc để AI tự dò từ câu hỏi.</p>
                  {detectedOrderCode && (
                    <Badge variant="outline" className="text-xs">
                      Đã phát hiện: #{detectedOrderCode}
                    </Badge>
                  )}
                </div>
              )}

              {mode === "auto_answer" && (
                <p className="text-sm text-gray-500">Chế độ hỏi đáp chung – không cần cấu hình thêm.</p>
              )}
            </CardContent>
          </Card>

          {suggestedProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Gợi ý sản phẩm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestedProducts.map((product) => (
                  <div key={product.skuId} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      {product.mainImage ? (
                        <img src={product.mainImage} alt={product.name} className="h-12 w-12 rounded-md object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500">IMG</div>
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {product.skuId}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-blue-600">
                      {product.price?.toLocaleString("vi-VN")} đ
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      {product.colors?.length ? <p>Màu: {product.colors.join(", ")}</p> : null}
                      {product.sizes?.length ? <p>Size: {product.sizes.join(", ")}</p> : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {sizeInsights && (
            <Card>
              <CardHeader>
                <CardTitle>Phân tích kích thước</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                {sizeInsights.input && (
                  <div>
                    <p className="font-semibold">Thông tin cung cấp:</p>
                    <ul className="list-disc ml-4">
                      {Object.entries(sizeInsights.input).map(([key, value]) => (
                        <li key={key}>
                          {key}: <strong>{String(value ?? "")}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {sizeInsights.history && sizeInsights.history.length > 0 && (
                  <div>
                    <p className="font-semibold">Lịch sử mua size:</p>
                    <ul className="list-disc ml-4">
                      {sizeInsights.history.map((item, index) => (
                        <li key={index}>
                          {item.productName} - size {item.size} ({item.skuId})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {sizeInsights.bestPractices && (
                  <div>
                    <p className="font-semibold">Gợi ý:</p>
                    <ul className="list-disc ml-4">
                      {sizeInsights.bestPractices.map((practice, index) => (
                        <li key={index}>{practice}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(ordersSummary.length > 0 || orderDetail) && (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-600">
                {ordersSummary.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-semibold">Đơn gần đây:</p>
                    {ordersSummary.map((order) => (
                      <div key={order.orderId} className="border rounded-md p-2">
                        <p className="font-medium">#{order.orderId}</p>
                        <p>Trạng thái: {order.status}</p>
                        <p>Tổng: {order.amount.toLocaleString("vi-VN")} đ</p>
                      </div>
                    ))}
                  </div>
                )}
                {orderDetail && (
                  <div className="space-y-2">
                    <p className="font-semibold">Chi tiết đơn #{orderDetail.orderId}</p>
                    <p>Thanh toán: {orderDetail.paymentStatus}</p>
                    <p>Địa chỉ: {orderDetail.deliveryAddress || "—"}</p>
                    {orderDetail.items?.length ? (
                      <div className="space-y-1">
                        {orderDetail.items.map((item, index) => (
                          <p key={index}>
                            • {item.productName} ({item.skuId}) - size {item.size}, màu {item.color} x{item.quantity}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

type LabeledInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

function LabeledInput({ label, ...props }: LabeledInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <Input {...props} />
    </div>
  );
}

