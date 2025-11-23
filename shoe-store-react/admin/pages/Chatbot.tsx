import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { MessageCircle, Search, Trash2, RefreshCw, User, Loader2 } from "lucide-react";
import { useAdminChatConversations, useAdminChatConversationDetail } from "../lib/use-chat-box";
import { adminChatBoxApi } from "../lib/admin-api";
import { getErrorMessage } from "../lib/error-handler";

export default function Chatbot() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 12;

  const { chatBoxes, stats, pagination, loading, refetch } = useAdminChatConversations({
    search: searchQuery || undefined,
    mode: modeFilter !== "all" ? modeFilter : undefined,
    per_page: perPage,
    page,
  });

  useEffect(() => {
    if (!chatBoxes || chatBoxes.length === 0) {
      setSelectedConversation(null);
      return;
    }
    if (selectedConversation === null || !chatBoxes.some((c) => c.id === selectedConversation)) {
      setSelectedConversation(chatBoxes[0].id);
    }
  }, [chatBoxes, selectedConversation]);

  const modeOptions = useMemo(() => {
    const base = [{ value: "all", label: "Tất cả chế độ" }];
    if (stats?.availableModes) {
      Object.entries(stats.availableModes).forEach(([value, label]) => {
        base.push({ value, label });
      });
    }
    return base;
  }, [stats?.availableModes]);

  const quickStats = [
    { label: "Hội thoại", value: stats?.totalConversations ?? 0 },
    { label: "Hoạt động 24h", value: stats?.activeConversations ?? 0 },
    { label: "Tin nhắn", value: stats?.totalMessages ?? 0 },
  ];

  const totalPages = pagination?.last_page ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Chatbot</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Theo dõi các hội thoại giữa khách hàng và trợ lý AI
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase text-gray-500">{stat.label}</p>
              <p className="text-2xl font-semibold mt-2">{stat.value}</p>
          </CardContent>
        </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
              <span>Cuộc trò chuyện ({stats?.totalConversations ?? 0})</span>
              <Badge variant="secondary">{stats?.activeConversations ?? 0} active</Badge>
                  </CardTitle>
            <div className="space-y-3">
                  <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                  placeholder="Tìm theo tên, email hoặc nội dung..."
                      value={searchQuery} 
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                      className="pl-10"
                    />
              </div>
              <Select
                value={modeFilter}
                onValueChange={(value) => {
                  setModeFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
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
                  </div>
                </CardHeader>
                <CardContent className="p-0">
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                </div>
              )}

              {!loading && chatBoxes.length === 0 && (
                <div className="py-10 text-center text-gray-500">
                  Chưa có cuộc trò chuyện nào.
                </div>
              )}

              {chatBoxes.map((conversation) => (
                        <div 
                  key={conversation.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                    selectedConversation === conversation.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                          }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.user?.avatar || undefined} />
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{conversation.user?.name || "Khách vãng lai"}</h4>
                                <span className="text-xs text-gray-500">
                          {conversation.lastMessageAt
                            ? new Date(conversation.lastMessageAt).toLocaleDateString("vi-VN")
                            : "--"}
                                </span>
                              </div>
                      <p className="text-xs text-gray-500 truncate">{conversation.user?.email}</p>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.lastMessage || "Chưa có tin nhắn"}
                              </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <Badge variant="outline">{conversation.modeLabel}</Badge>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3 text-gray-400" />
                          <span>{conversation.totalMessages}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
              ))}
            </div>

            {pagination && pagination.last_page > 1 && (
              <div className="flex items-center justify-between p-4 border-t text-sm text-gray-600">
                <span>Trang {pagination.current_page}/{pagination.last_page}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.current_page === 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  >
                    Trước
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.current_page === totalPages}
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

              <Card className="h-full">
                {selectedConversation ? (
                  <ChatDetail 
                    conversationId={selectedConversation}
              onDeleted={() => {
                setSelectedConversation(null);
                refetch();
              }}
                  />
                ) : (
            <CardContent className="flex items-center justify-center h-[70vh]">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Chọn cuộc trò chuyện</h3>
                      <p className="text-gray-500">Chọn một cuộc trò chuyện để xem chi tiết</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
  );
}

function ChatDetail({ conversationId, onDeleted }: { conversationId: number; onDeleted: () => void }) {
  const { detail, loading, refetch } = useAdminChatConversationDetail(conversationId);
  const [isDeleting, setIsDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [detail]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await adminChatBoxApi.deleteConversation(conversationId);
      toast.success("Đã xoá cuộc trò chuyện");
      onDeleted();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể xoá cuộc trò chuyện"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
                    return (
      <CardContent className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </CardContent>
    );
  }

  if (!detail) {
    return (
      <CardContent className="flex items-center justify-center h-[70vh]">
        <p className="text-gray-500 text-sm">Không tìm thấy dữ liệu cuộc trò chuyện</p>
              </CardContent>
  );
}

  const { chatBox, history } = detail;

  return (
    <>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={chatBox.user?.avatar || undefined} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{chatBox.user?.name || "Khách vãng lai"}</h3>
              <p className="text-sm text-gray-500">{chatBox.user?.email}</p>
              {chatBox.user?.phoneNumber && (
                <p className="text-xs text-gray-400">{chatBox.user.phoneNumber}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{chatBox.modeLabel}</Badge>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto h-[70vh] p-4" ref={scrollRef}>
        <div className="space-y-4">
          {history.map((entry) => {
            const isUser = entry.role === "user";
            const isAssistant = entry.role === "assistant";
            const bubbleClass = isUser
              ? "bg-blue-500 text-white"
              : isAssistant
                ? "bg-gray-100 text-gray-900"
                : "bg-amber-100 text-amber-900";
            const alignClass = isUser ? "justify-end" : "justify-start";

            return (
              <div key={entry.id} className={`flex ${alignClass}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${bubbleClass}`}>
                  <p className="text-sm whitespace-pre-line">{entry.message}</p>
                  <p className={`text-xs mt-1 ${isUser ? "text-blue-100" : "text-gray-500"}`}>
                    {new Date(entry.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            );
          })}
        </div>
      </CardContent>
    </>
  );
}
