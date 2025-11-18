import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  Bot, 
  MessageCircle, 
  TrendingUp, 
  Search, 
  Trash2, 
  Clock, 
  CheckCircle, 
  BarChart3,
  Download,
  RefreshCw,
  Send,
  User,
  Zap,
  Loader2
} from "lucide-react";
import { useAdminChatConversations, useAdminChatConversationDetail } from "../lib/use-chat-box";
import { adminChatBoxApi } from "../lib/admin-api";
import { getErrorMessage } from "../lib/error-handler";

export default function Chatbot() {
  const [activeTab, setActiveTab] = useState("conversations");
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 12;
  const [corpus, setCorpus] = useState("");
  const [isTraining, setIsTraining] = useState(false);
  const [lastTrainedAt, setLastTrainedAt] = useState<string | null>(null);

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
    if (selectedConversation === null) {
      setSelectedConversation(chatBoxes[0].id);
      return;
    }
    const exists = chatBoxes.some((chat) => chat.id === selectedConversation);
    if (!exists) {
      setSelectedConversation(chatBoxes[0].id);
    }
  }, [chatBoxes, selectedConversation]);

  const topMode = useMemo(() => {
    if (!stats?.modeBreakdown?.length) return null;
    return [...stats.modeBreakdown].sort((a, b) => b.count - a.count)[0];
  }, [stats?.modeBreakdown]);

  const modeOptions = useMemo(() => {
    const options = [{ value: "all", label: "Tất cả chế độ" }];
    if (stats?.availableModes) {
      Object.entries(stats.availableModes).forEach(([value, label]) => {
        options.push({ value, label });
      });
    }
    return options;
  }, [stats?.availableModes]);

  const handleTrain = () => {
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
      setLastTrainedAt(new Date().toISOString());
      toast.success("Huấn luyện dữ liệu chatbot thành công!");
    }, 1800);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleModeChange = (value: string) => {
    setModeFilter(value);
    setPage(1);
  };

  const handleConversationDeleted = () => {
    setSelectedConversation(null);
    refetch();
  };

  const totalPages = pagination?.last_page ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Chatbot AI</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Theo dõi cuộc trò chuyện và huấn luyện chatbot thông minh
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Xuất dữ liệu
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng cuộc trò chuyện</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{stats?.totalConversations ?? 0}</p>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.activeConversations ?? 0} đang hoạt động trong 24h
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng tin nhắn</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{stats?.totalMessages ?? 0}</p>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +Realtime
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Trang hiện tại: {chatBoxes.length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Send className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Thời gian phản hồi</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">--</p>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Đang thu thập
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Sẽ cập nhật khi đủ dữ liệu
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chế độ phổ biến</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">
                    {topMode ? `${topMode.count}` : '0'}
                  </p>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    <Zap className="h-3 w-3 mr-1" />
                    {topMode?.label || 'N/A'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {topMode ? `Mã: ${topMode.mode}` : 'Chưa có thống kê'}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Bot className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conversations">Cuộc trò chuyện</TabsTrigger>
          <TabsTrigger value="training">Huấn luyện AI</TabsTrigger>
          <TabsTrigger value="analytics">Phân tích</TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Cuộc trò chuyện ({pagination?.total ?? 0})</span>
                  </CardTitle>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input 
                        placeholder="Tìm kiếm tên, email hoặc nội dung..." 
                        value={searchQuery} 
                        onChange={e => handleSearchChange(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Select value={modeFilter} onValueChange={handleModeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn chế độ" />
                      </SelectTrigger>
                      <SelectContent>
                        {modeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
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
                    {chatBoxes.map(conversation => (
                      <div 
                        key={conversation.id} 
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversation === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
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
                              <h4 className="font-medium truncate">{conversation.user?.name || 'Khách vãng lai'}</h4>
                              <span className="text-xs text-gray-500">
                                {conversation.lastMessageAt
                                  ? new Date(conversation.lastMessageAt).toLocaleDateString('vi-VN')
                                  : '--'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage || 'Chưa có tin nhắn'}
                            </p>
                            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {conversation.modeLabel}
                                </Badge>
                                {conversation.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {conversation.category.name}
                                  </Badge>
                                )}
                              </div>
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
            </div>

            {/* Chat Detail */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                {selectedConversation ? (
                  <ChatDetail 
                    conversationId={selectedConversation}
                    onDeleted={handleConversationDeleted}
                  />
                ) : (
                  <CardContent className="flex items-center justify-center h-96">
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
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <span>Huấn luyện Chatbot AI</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Dữ liệu huấn luyện</label>
                  <Textarea 
                    rows={12} 
                    value={corpus} 
                    onChange={e => setCorpus(e.target.value)} 
                    placeholder="Nhập thông tin sản phẩm, FAQ, chính sách đổi trả, vận chuyển, khuyến mãi...\n\nVí dụ:\n- Sản phẩm Nike Air Max có size từ 38-45\n- Chính sách đổi trả trong 7 ngày\n- Miễn phí vận chuyển đơn hàng trên 500k\n- Bảo hành 6 tháng với lỗi nhà sản xuất"
                    className="min-h-[300px]"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Trạng thái huấn luyện</h4>
                    <p className="text-sm text-gray-600">
                      {lastTrainedAt 
                        ? `Lần cuối: ${new Date(lastTrainedAt).toLocaleString("vi-VN")}`
                        : 'Chưa huấn luyện'}
                    </p>
                  </div>
                  <Button onClick={handleTrain} disabled={isTraining}>
                    {isTraining ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Đang huấn luyện...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Huấn luyện AI
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Thống kê chế độ chat</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.modeBreakdown?.length ? (
                    stats.modeBreakdown.map((item) => (
                      <div key={item.mode} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{item.label}</span>
                          <span className="text-gray-500">{item.count} cuộc trò chuyện</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: stats.totalConversations
                                ? `${(item.count / stats.totalConversations) * 100}%`
                                : '0%',
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">Chưa có dữ liệu thống kê.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chủ đề phổ biến</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { topic: 'Tư vấn sản phẩm', count: 45, percentage: 65 },
                    { topic: 'Hỏi về size giày', count: 32, percentage: 46 },
                    { topic: 'Chính sách đổi trả', count: 28, percentage: 40 },
                    { topic: 'Thông tin vận chuyển', count: 21, percentage: 30 },
                    { topic: 'Khuyến mãi', count: 15, percentage: 22 }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.topic}</span>
                        <span className="text-gray-500">{item.count} lượt</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChatDetail({ conversationId, onDeleted }: { conversationId: number; onDeleted: () => void }) {
  const { detail, loading, refetch } = useAdminChatConversationDetail(conversationId);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await adminChatBoxApi.deleteConversation(conversationId);
      toast.success("Đã xoá cuộc trò chuyện");
      onDeleted();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "Không thể xoá cuộc trò chuyện"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <CardContent className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </CardContent>
    );
  }

  if (!detail) {
    return (
      <CardContent className="flex items-center justify-center h-96">
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
              <h3 className="font-semibold">{chatBox.user?.name || 'Khách vãng lai'}</h3>
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
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto max-h-96 p-4">
        <div className="space-y-4">
          {history.map(entry => {
            const isUser = entry.role === 'user';
            const isAssistant = entry.role === 'assistant';
            const bubbleClass = isUser
              ? 'bg-blue-500 text-white'
              : isAssistant
                ? 'bg-gray-100 text-gray-900'
                : 'bg-amber-100 text-amber-900';

            const alignClass = isUser ? 'justify-end' : 'justify-start';

            return (
              <div key={entry.id} className={`flex ${alignClass}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${bubbleClass}`}>
                  <p className="text-sm whitespace-pre-line">{entry.message}</p>
                  <p className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(entry.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
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
