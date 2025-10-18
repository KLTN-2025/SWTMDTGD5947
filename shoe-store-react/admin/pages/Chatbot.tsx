import { useState } from "react";
import { db } from "../lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Chatbot() {
  const current = db.getChatbot();
  const [corpus, setCorpus] = useState(current.corpus);

  const train = () => {
    db.updateChatbot({ corpus });
    toast.success("Đã cập nhật và huấn luyện dữ liệu chatbot");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý Chatbot</h1>
        <p className="text-muted-foreground">Cập nhật dữ liệu sản phẩm/FAQ để chatbot tư vấn chính xác</p>
      </div>
      <div className="space-y-3">
        <Textarea rows={10} value={corpus} onChange={e => setCorpus(e.target.value)} placeholder="Dữ liệu: thông tin sản phẩm, size, đổi trả, vận chuyển, khuyến mãi..." />
        <div className="flex gap-2">
          <Button onClick={train}>Huấn luyện</Button>
          {current.lastTrainedAt && <div className="text-sm text-muted-foreground">Lần cuối: {new Date(current.lastTrainedAt).toLocaleString("vi-VN")}</div>}
        </div>
      </div>
    </div>
  );
}
