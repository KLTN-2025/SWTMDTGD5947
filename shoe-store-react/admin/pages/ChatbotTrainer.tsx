import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  RefreshCw,
  Bot,
  User,
  Settings,
  MessageSquare,
  Plus,
} from "lucide-react";
import {
  chatAssistantApi,
  ChatAssistantMode,
  ChatHistoryEntry,
  ChatSessionSummary,
} from "../lib/chat-assistant";
import { useAdminCategories } from "../lib/use-admin-categories";
import { useColors } from "../lib/use-colors";

type AdvisorForm = {
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
  const [detectedOrderCode, setDetectedOrderCode] = useState<string | null>(null);
  const [orderCodeInput, setOrderCodeInput] = useState("");
  const [advisorForm, setAdvisorForm] = useState<AdvisorForm>({
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
  const [showSettings, setShowSettings] = useState(false);

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
    if (selectedCategoryIds.length) prefs.categoryIds = selectedCategoryIds;
    if (selectedColors.length) prefs.colors = selectedColors;
    if (advisorForm.usage.trim()) prefs.usage = advisorForm.usage.trim();
    if (advisorForm.budgetMin) prefs.budgetMin = Number(advisorForm.budgetMin);
    if (advisorForm.budgetMax) prefs.budgetMax = Number(advisorForm.budgetMax);
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
      toast.error("Vui lòng nhập nội dung");
      return;
    }

    const userMessage = message.trim();
    const tempId = Date.now();
    const tempUserEntry: ChatHistoryEntry = {
      id: tempId,
      role: "user",
      message: userMessage,
      createdAt: new Date().toISOString(),
    };

    setHistory((prev) => [...prev, tempUserEntry]);
    setMessage("");
    setIsSending(true);

    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);

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
        setHistory(data.history || []);
        setDetectedOrderCode(data.detectedOrderCode || null);
        fetchSessions();
        setTimeout(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể gửi tin nhắn"));
      setHistory((prev) => prev.filter((e) => e.id !== tempId));
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
        setDetectedOrderCode(null);
        setTimeout(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể tải phiên chat"));
    }
  };

  const startNewChat = () => {
    setChatBoxId(null);
    setHistory([]);
    setDetectedOrderCode(null);
    setMessage("");
  };

  const getErrorMessage = (error: any, fallback: string) => {
    return error?.message || fallback;
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Sidebar - Sessions */}
      <div className="w-72 flex-shrink-0 bg-white dark:bg-gray-900 rounded-lg border flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">Phiên chat</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={startNewChat}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchSessions}>
              <RefreshCw className={`h-4 w-4 ${sessionsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => loadSession(session.id)}
              className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                chatBoxId === session.id
                  ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-xs text-blue-600">{session.modeLabel}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {session.totalMessages}
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs truncate">
                {session.lastMessage || "Chưa có tin nhắn"}
              </p>
            </button>
          ))}
          {!sessionsLoading && sessions.length === 0 && (
            <p className="text-center text-gray-400 text-xs py-8">Chưa có phiên nào</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">AI Assistant Trainer</h1>
              <p className="text-xs text-gray-500">
                {modeOptions.find((m) => m.value === mode)?.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={mode} onValueChange={(v: ChatAssistantMode) => setMode(v)}>
              <SelectTrigger className="w-44 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showSettings ? "secondary" : "outline"}
              size="icon"
              className="h-9 w-9"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 border-b bg-gray-50 dark:bg-gray-800/50 flex-shrink-0 space-y-4">
            {mode === "auto_answer" && (
              <p className="text-sm text-gray-500">Chế độ hỏi đáp chung – không cần cấu hình thêm.</p>
            )}

            {mode === "order_support" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Nhập mã đơn hàng hoặc để AI tự dò từ câu hỏi.</p>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-20">Mã đơn:</label>
                  <Input
                    value={orderCodeInput}
                    onChange={(e) => setOrderCodeInput(e.target.value)}
                    placeholder="VD: ORD123"
                    className="w-48 h-9"
                  />
                  {detectedOrderCode && (
                    <Badge variant="outline" className="text-xs">
                      Đã phát hiện: #{detectedOrderCode}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {mode === "shoe_advisor" && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-20">Danh mục:</label>
                  <Select
                    onValueChange={(v) => {
                      const id = Number(v);
                      setSelectedCategoryIds((prev) =>
                        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                      );
                    }}
                  >
                    <SelectTrigger className="w-48 h-9">
                      <SelectValue placeholder="Chọn danh mục..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCategoryIds.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {selectedCategoryIds.map((id) => (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="cursor-pointer text-xs"
                          onClick={() => setSelectedCategoryIds((prev) => prev.filter((x) => x !== id))}
                        >
                          {categories.find((c) => c.id === id)?.name} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-20">Màu sắc:</label>
                  <Select
                    onValueChange={(v) => {
                      setSelectedColors((prev) =>
                        prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
                      );
                    }}
                  >
                    <SelectTrigger className="w-48 h-9">
                      <SelectValue placeholder="Chọn màu sắc..." />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.name} value={color.name}>
                          <div className="flex items-center gap-2">
                            {color.hexCode && (
                              <span
                                className="w-3 h-3 rounded-full border"
                                style={{ backgroundColor: color.hexCode }}
                              />
                            )}
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedColors.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {selectedColors.map((color) => (
                        <Badge
                          key={color}
                          variant="outline"
                          className="cursor-pointer text-xs"
                          onClick={() => setSelectedColors((prev) => prev.filter((x) => x !== color))}
                        >
                          {color} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-20">Nhu cầu:</label>
                  <Input
                    value={advisorForm.usage}
                    onChange={(e) => setAdvisorForm({ ...advisorForm, usage: e.target.value })}
                    placeholder="Đi làm, đi học, chạy bộ..."
                    className="w-48 h-9"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-20">Ngân sách:</label>
                  <Input
                    type="number"
                    value={advisorForm.budgetMin}
                    onChange={(e) => setAdvisorForm({ ...advisorForm, budgetMin: e.target.value })}
                    placeholder="Từ (VND)"
                    className="w-32 h-9"
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    value={advisorForm.budgetMax}
                    onChange={(e) => setAdvisorForm({ ...advisorForm, budgetMax: e.target.value })}
                    placeholder="Đến (VND)"
                    className="w-32 h-9"
                  />
                </div>
              </div>
            )}

            {mode === "size_support" && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-32">Chiều dài bàn chân:</label>
                  <Input
                    type="number"
                    value={sizeForm.footLengthCm}
                    onChange={(e) => setSizeForm({ ...sizeForm, footLengthCm: e.target.value })}
                    placeholder="cm"
                    className="w-24 h-9"
                  />
                  <span className="text-xs text-gray-400">cm</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-32">Chiều rộng bàn chân:</label>
                  <Input
                    type="number"
                    value={sizeForm.footWidthCm}
                    onChange={(e) => setSizeForm({ ...sizeForm, footWidthCm: e.target.value })}
                    placeholder="cm"
                    className="w-24 h-9"
                  />
                  <span className="text-xs text-gray-400">cm</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-32">Size đang mang:</label>
                  <Input
                    value={sizeForm.currentSize}
                    onChange={(e) => setSizeForm({ ...sizeForm, currentSize: e.target.value })}
                    placeholder="VD: EU 41, US 8"
                    className="w-32 h-9"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 w-32">Sở thích fit:</label>
                  <Input
                    value={sizeForm.fitPreference}
                    onChange={(e) => setSizeForm({ ...sizeForm, fitPreference: e.target.value })}
                    placeholder="Ôm chân, thoáng, vừa vặn..."
                    className="w-48 h-9"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Bắt đầu cuộc trò chuyện</p>
              <p className="text-xs mt-1">Nhập tin nhắn bên dưới để huấn luyện AI</p>
            </div>
          )}
          {history.map((entry) => (
            <div
              key={entry.id}
              className={`flex gap-3 ${entry.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  entry.role === "user"
                    ? "bg-blue-600"
                    : "bg-gradient-to-br from-purple-500 to-pink-500"
                }`}
              >
                {entry.role === "user" ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  entry.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{entry.message}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    entry.role === "user" ? "text-blue-200" : "text-gray-400"
                  }`}
                >
                  {new Date(entry.createdAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">Đang trả lời...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t flex-shrink-0 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn... (Enter để gửi)"
              disabled={isSending}
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={isSending || !message.trim()}
              className="h-11 px-4"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
