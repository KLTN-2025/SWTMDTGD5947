import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Facebook, MessageCircle, Loader2 } from "lucide-react";
import { shareApi } from "@/lib/share-api";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  productName?: string;
}

export function ShareDialog({ open, onOpenChange, productId, productName }: ShareDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleShare = async (type: "facebook" | "messenger") => {
    try {
      setLoading(true);
      const response = await shareApi.getProductShareLinks(productId);
      
      if (response.data) {
        const link = type === "facebook" 
          ? response.data.shareLinks.facebookPost
          : response.data.shareLinks.messenger;
        
        // Kiểm tra link có hợp lệ không
        if (!link) {
          toast.error("Không thể tạo link chia sẻ");
          return;
        }

        // Mở link trong popup window với kích thước phù hợp
        const width = type === "facebook" ? 600 : 700;
        const height = type === "facebook" ? 400 : 500;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        const popup = window.open(
          link,
          "share",
          `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1`
        );
        
        // Kiểm tra popup có mở được không (có thể bị chặn bởi popup blocker)
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          toast.error("Trình duyệt đã chặn popup. Vui lòng cho phép popup và thử lại.");
          // Fallback: mở trong tab mới
          window.open(link, '_blank');
        } else {
          onOpenChange(false);
          toast.success(`Đang mở ${type === "facebook" ? "Facebook" : "Messenger"}...`);
        }
      }
    } catch (error: any) {
      console.error('Share error:', error);
      const message = error?.response?.data?.message || "Không thể lấy link chia sẻ";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Chia sẻ sản phẩm
          </DialogTitle>
          <DialogDescription>
            {productName && `Chia sẻ "${productName}" với bạn bè`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={() => handleShare("facebook")}
            disabled={loading}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Facebook className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">Chia sẻ lên Facebook</div>
                <div className="text-sm text-muted-foreground">
                  Đăng bài viết lên trang cá nhân
                </div>
              </div>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={() => handleShare("messenger")}
            disabled={loading}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">Gửi qua Messenger</div>
                <div className="text-sm text-muted-foreground">
                  Chia sẻ với bạn bè qua tin nhắn
                </div>
              </div>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

