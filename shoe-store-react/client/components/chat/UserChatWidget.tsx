import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Loader2, Settings, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth, ROLES } from "@/state/auth";
import { chatAssistantApi, ChatAssistantMode, ChatHistoryEntry } from "@/lib/chat-assistant";
import { categoryApi } from "@/lib/category-api";
import { publicColorApi } from "@/lib/color-api";
import { toast } from "sonner";

const modeOptions: { value: ChatAssistantMode; label: string }[] = [
  { value: "auto_answer", label: "Hỏi đáp chung" },
  { value: "shoe_advisor", label: "Tư vấn chọn giày" },
  { value: "size_support", label: "Tư vấn size" },
  { value: "order_support", label: "Đơn hàng" },
];

export function UserChatWidget() {
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatAssistantMode>("auto_answer");
  const [message, setMessage] = useState("");
  const [chatBoxId, setChatBoxId] = useState<number | null>(null);
  const [history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [colors, setColors] = useState<{ id: number; name: string; hexCode?: string | null }[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [usage, setUsage] = useState("");
  const [budget, setBudget] = useState({ min: "", max: "" });
  const [sizeInfo, setSizeInfo] = useState({
    footLengthCm: "",
    footWidthCm: "",
    currentSize: "",
    fitPreference: "",
  });
  const [orderCode, setOrderCode] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isUser = !!user && user.roleId === ROLES.USER;

  useEffect(() => {
    if (!isOpen) return;

    if (categories.length === 0) {
      categoryApi.getCategories().then((res) => {
        const payload: any = res.data;
        if (Array.isArray(payload)) {
          setCategories(payload);
        } else if (Array.isArray(payload?.categories)) {
          setCategories(payload.categories);
        } else if (Array.isArray(payload?.data?.categories)) {
          setCategories(payload.data.categories);
        }
      });
    }

    if (colors.length === 0) {
      publicColorApi.getColors().then((res) => {
        const payload: any = res.data;
        if (Array.isArray(payload)) {
          setColors(payload);
        } else if (Array.isArray(payload?.colors)) {
          setColors(payload.colors);
        } else if (Array.isArray(payload?.data?.colors)) {
          setColors(payload.data.colors);
        }
      });
    }
  }, [isOpen, categories.length, colors.length]);

  useEffect(() => {
    if (isOpen) {
      chatAssistantApi.getSessions().then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const latest = res.data[0];
          chatAssistantApi.getSessionDetail(latest.id).then((detail) => {
            if (detail.data) {
              setChatBoxId(detail.data.chatBoxId);
              setHistory(detail.data.history || []);
              setTimeout(() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
              }, 50);
            }
          });
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const parsedPreferences = useMemo(() => {
    if (mode !== "shoe_advisor") return undefined;
    const prefs: any = {};
    if (selectedCategoryIds.length) prefs.categoryIds = selectedCategoryIds;
    if (selectedColors.length) prefs.colors = selectedColors;
    if (usage.trim()) prefs.usage = usage.trim();
    if (budget.min) prefs.budgetMin = Number(budget.min);
    if (budget.max) prefs.budgetMax = Number(budget.max);
    return Object.keys(prefs).length ? prefs : undefined;
  }, [mode, selectedCategoryIds, selectedColors, usage, budget]);

  const parsedSizeInfo = useMemo(() => {
    if (mode !== "size_support") return undefined;
    const info: any = {};
    if (sizeInfo.footLengthCm) info.footLengthCm = Number(sizeInfo.footLengthCm);
    if (sizeInfo.footWidthCm) info.footWidthCm = Number(sizeInfo.footWidthCm);
    if (sizeInfo.currentSize) info.currentSize = sizeInfo.currentSize;
    if (sizeInfo.fitPreference) info.fitPreference = sizeInfo.fitPreference;
    return Object.keys(info).length ? info : undefined;
  }, [mode, sizeInfo]);

  const sendMessage = async () => {
    if (!message.trim() || !isUser) return;

    const tempUserEntry: ChatHistoryEntry = {
      id: Date.now(),
      role: "user",
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };
    const thinkingEntry: ChatHistoryEntry = {
      id: Date.now() + 1,
      role: "assistant",
      message: "Đang suy nghĩ...",
      createdAt: new Date().toISOString(),
      meta: { placeholder: true },
    };
    setHistory((prev) => [...prev, tempUserEntry, thinkingEntry]);
    setMessage("");
    setIsSending(true);

    try {
      const response = await chatAssistantApi.sendMessage({
        mode,
        message: tempUserEntry.message,
        chatBoxId: chatBoxId ?? undefined,
        orderCode: orderCode.trim() || undefined,
        preferences: parsedPreferences,
        sizeInfo: parsedSizeInfo,
      });

      if (response.data) {
        setChatBoxId(response.data.chatBoxId);
        setHistory((prev) => [
          ...prev.filter((entry) => entry.meta?.placeholder !== true),
          ...(response.data.history || []),
        ]);
      }
    } catch (error) {
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");
      setHistory((prev) => prev.filter((entry) => entry.id !== thinkingEntry.id));
    } finally {
      setIsSending(false);
    }
  };

  if (!isUser || loading) {
    return null;
  }

  return (
    <>
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[360px] md:w-[430px] h-[82vh] z-50 shadow-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <CardTitle className="text-base">Shoes Assistant</CardTitle>
              <p className="text-xs text-gray-500">Trò chuyện cùng trợ lý của OCE</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                <Settings className={`h-4 w-4 ${isSettingsOpen ? "text-blue-500" : ""}`} />
              </Button>
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="max-w-2xl w-[90vw] md:w-[640px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Tùy chọn nâng cao</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4 space-y-4 text-sm">
                    {mode === "shoe_advisor" && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Danh mục</p>
                          <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                              <Badge
                                key={cat.id}
                                variant={selectedCategoryIds.includes(cat.id) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                  if (selectedCategoryIds.includes(cat.id)) {
                                    setSelectedCategoryIds((prev) => prev.filter((i) => i !== cat.id));
                                  } else {
                                    setSelectedCategoryIds((prev) => [...prev, cat.id]);
                                  }
                                }}
                              >
                                {cat.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">Màu sắc</p>
                          <div className="flex flex-wrap gap-2">
                            {colors.map((color) => (
                              <Badge
                                key={color.id}
                                variant={selectedColors.includes(color.name) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                  if (selectedColors.includes(color.name)) {
                                    setSelectedColors((prev) => prev.filter((c) => c !== color.name));
                                  } else {
                                    setSelectedColors((prev) => [...prev, color.name]);
                                  }
                                }}
                              >
                                {color.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Input
                          placeholder="Nhu cầu (đi làm, đi chơi...)"
                          value={usage}
                          onChange={(e) => setUsage(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Ngân sách từ"
                            value={budget.min}
                            onChange={(e) => setBudget((prev) => ({ ...prev, min: e.target.value }))}
                          />
                          <Input
                            type="number"
                            placeholder="Đến"
                            value={budget.max}
                            onChange={(e) => setBudget((prev) => ({ ...prev, max: e.target.value }))}
                          />
                        </div>
                      </>
                    )}

                    {mode === "size_support" && (
                      <div className="space-y-2">
                        <Input
                          type="number"
                          placeholder="Chiều dài bàn chân (cm)"
                          value={sizeInfo.footLengthCm}
                          onChange={(e) => setSizeInfo({ ...sizeInfo, footLengthCm: e.target.value })}
                        />
                        <Input
                          type="number"
                          placeholder="Chiều rộng (cm)"
                          value={sizeInfo.footWidthCm}
                          onChange={(e) => setSizeInfo({ ...sizeInfo, footWidthCm: e.target.value })}
                        />
                        <Input
                          placeholder="Size đang mang"
                          value={sizeInfo.currentSize}
                          onChange={(e) => setSizeInfo({ ...sizeInfo, currentSize: e.target.value })}
                        />
                        <Input
                          placeholder="Sở thích (ôm chân, thoáng...)"
                          value={sizeInfo.fitPreference}
                          onChange={(e) => setSizeInfo({ ...sizeInfo, fitPreference: e.target.value })}
                        />
                      </div>
                    )}

                    {mode === "order_support" && (
                      <Input
                        placeholder="Mã đơn hàng (nếu có)"
                        value={orderCode}
                        onChange={(e) => setOrderCode(e.target.value)}
                      />
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 flex-1 overflow-hidden pt-4">
            <Select value={mode} onValueChange={(value: ChatAssistantMode) => setMode(value)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Chọn chế độ hỗ trợ" />
              </SelectTrigger>
              <SelectContent>
                {modeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="border rounded-lg flex-1 overflow-y-auto p-3 space-y-3" ref={scrollRef}>
              {history.length === 0 && (
                <p className="text-sm text-gray-500 text-center mt-16">
                  Xin chào! Bạn cần trợ giúp điều gì?
                </p>
              )}
              {history.map((entry) => {
                const isUserMessage = entry.role === "user";
                return (
                  <div key={entry.id} className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow ${
                        isUserMessage
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                      }`}
                    >
                      {entry.message}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2">
              <Textarea
                rows={2}
                placeholder="Nhập câu hỏi của bạn..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button onClick={sendMessage} disabled={isSending || !message.trim()} className="w-full">
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    Gửi tin nhắn
                    <ChevronDown className="h-4 w-4 ml-2 rotate-90" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 z-40"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </>
  );
}

