import { useState, useMemo } from "react";
import { db } from "../lib/store";
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
  Users, 
  TrendingUp, 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Settings,
  Download,
  RefreshCw,
  Send,
  User,
  Zap
} from "lucide-react";

export default function Chatbot() {
  const [activeTab, setActiveTab] = useState("conversations");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [corpus, setCorpus] = useState(db.getChatbot().corpus);
  const [isTraining, setIsTraining] = useState(false);
  
  const chatMessages = db.listChatMessages();
  const chatHistories = db.listChatHistories();
  const customers = db.listCustomers();
  const categories = db.listCategories();
  
  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    return chatMessages.filter(msg => {
      const customer = customers.find(c => c.id === msg.userId);
      const histories = chatHistories.filter(h => h.chatBoxId === msg.id);
      const searchText = searchQuery.toLowerCase();
      
      return (
        customer?.name.toLowerCase().includes(searchText) ||
        customer?.email.toLowerCase().includes(searchText) ||
        histories.some(h => h.message.toLowerCase().includes(searchText))
      );
    });
  }, [chatMessages, customers, chatHistories, searchQuery]);
  
  // Calculate stats
  const totalConversations = chatMessages.length;
  const activeConversations = chatMessages.filter(msg => {
    const lastHistory = chatHistories
      .filter(h => h.chatBoxId === msg.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return lastHistory && new Date(lastHistory.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000;
  }).length;
  
  const totalMessages = chatHistories.length;
  const avgResponseTime = "2.3s"; // Mock data
  
  const handleTrain = async () => {
    setIsTraining(true);
    // Simulate training delay
    setTimeout(() => {
      db.updateChatbot({ corpus });
      setIsTraining(false);
      toast.success("Đã cập nhật và huấn luyện dữ liệu chatbot thành công!");
    }, 2000);
  };
  
  const handleDeleteConversation = (id: string) => {
    db.deleteChatMessage(id);
    if (selectedConversation === id) {
      setSelectedConversation(null);
    }
    toast.success("Đã xóa cuộc trò chuyện");
  };

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
          <Button variant="outline" size="sm">
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
                  <p className="text-2xl font-bold">{totalConversations}</p>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12%
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {activeConversations} đang hoạt động
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
                  <p className="text-2xl font-bold">{totalMessages}</p>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8%
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Hôm nay: {Math.floor(totalMessages / 7)}
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
                  <p className="text-2xl font-bold">{avgResponseTime}</p>
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Tốt
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mục tiêu: &lt;3s
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
                <p className="text-sm font-medium text-gray-600">Độ chính xác AI</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">94.2%</p>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    <Zap className="h-3 w-3 mr-1" />
                    Cao
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Cải thiện +2.1%
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
                    <span>Cuộc trò chuyện ({filteredConversations.length})</span>
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      placeholder="Tìm kiếm cuộc trò chuyện..." 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {filteredConversations.map(msg => {
                      const customer = customers.find(c => c.id === msg.userId);
                      const histories = chatHistories.filter(h => h.chatBoxId === msg.id);
                      const lastMessage = histories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                      const category = categories.find(c => c.id === msg.categoryId);
                      
                      return (
                        <div 
                          key={msg.id} 
                          className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedConversation === msg.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                          onClick={() => setSelectedConversation(msg.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={customer?.avatar} />
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium truncate">{customer?.name || 'Khách vãng lai'}</h4>
                                <span className="text-xs text-gray-500">
                                  {new Date(msg.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 truncate">
                                {lastMessage?.message || 'Chưa có tin nhắn'}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                {category && (
                                  <Badge variant="outline" className="text-xs">
                                    {category.name}
                                  </Badge>
                                )}
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{histories.length}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Detail */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                {selectedConversation ? (
                  <ChatDetail 
                    conversationId={selectedConversation}
                    onDelete={() => handleDeleteConversation(selectedConversation)}
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
                      {db.getChatbot().lastTrainedAt 
                        ? `Lần cuối: ${new Date(db.getChatbot().lastTrainedAt!).toLocaleString("vi-VN")}`
                        : 'Chưa huấn luyện'
                      }
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
                  <span>Thống kê tin nhắn theo ngày</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2">
                  {Array.from({length: 7}).map((_, i) => {
                    const height = Math.random() * 200 + 20;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-blue-500 rounded-t-md transition-all duration-300 hover:bg-blue-600"
                          style={{ height: `${height}px` }}
                        />
                        <div className="text-xs mt-2 text-gray-500">
                          {new Date(Date.now() - i * 86400000).toLocaleDateString('vi-VN', { weekday: 'short' })}
                        </div>
                      </div>
                    );
                  })}
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

// Chat Detail Component
function ChatDetail({ conversationId, onDelete }: { conversationId: string; onDelete: () => void }) {
  const chatMessage = db.listChatMessages().find(m => m.id === conversationId);
  const customer = db.listCustomers().find(c => c.id === chatMessage?.userId);
  const histories = db.getChatHistoriesByMessageId(conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const category = db.listCategories().find(c => c.id === chatMessage?.categoryId);

  if (!chatMessage) return null;

  return (
    <>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={customer?.avatar} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{customer?.name || 'Khách vãng lai'}</h3>
              <p className="text-sm text-gray-500">{customer?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {category && (
              <Badge variant="outline">{category.name}</Badge>
            )}
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto max-h-96 p-4">
        <div className="space-y-4">
          {histories.map(history => (
            <div 
              key={history.id} 
              className={`flex ${
                history.context === 'user_question' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div 
                className={`max-w-[70%] p-3 rounded-lg ${
                  history.context === 'user_question'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{history.message}</p>
                <p className={`text-xs mt-1 ${
                  history.context === 'user_question' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(history.createdAt).toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );
}
