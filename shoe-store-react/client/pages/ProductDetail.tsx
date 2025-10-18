import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProduct } from "@/lib/api";
import type { Product } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/state/cart";
import { useAuth } from "@/state/auth";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Reviews } from "@/components/product/Reviews";
import { ReviewStats } from "@/components/product/ReviewStats";
import { Star } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery<Product>({ queryKey: ["product", id], queryFn: () => fetchProduct(id!) });
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState<number | string | null>(null);
  const [qty, setQty] = useState(1);
  const { add, orders } = useCart();
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (data && data.sizes.length) setSize(data.sizes[0]);
  }, [data]);

  useEffect(() => {
    if (data) {
      document.title = `${data.title} | OCE Shoes`;
    }
  }, [data]);

  const images = useMemo(() => data?.images || [], [data]);

  return (
    <Layout>
      <section className="container py-8">
        {isLoading && <div className="py-20 text-center">Đang tải...</div>}
        {error && <div className="py-20 text-center text-destructive">Không tìm thấy sản phẩm.</div>}
        {!isLoading && data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="aspect-square overflow-hidden rounded-2xl border bg-card">
                <img src={images[activeImg] || data.thumbnail} alt={data.title} className="h-full w-full object-cover" />
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImg(idx)} className={`aspect-square rounded-lg overflow-hidden border ${idx===activeImg?"ring-2 ring-ring": ""}`}>
                    <img src={img} alt={`${data.title} ${idx+1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{data.title}</h1>
              <div className="mt-1 text-muted-foreground">{data.brand} • {data.color} • {data.type}</div>
              <div className="mt-4 text-3xl font-extrabold">{data.price.toLocaleString("vi-VN")}₫</div>
              <div className="mt-4">
                <div className="font-semibold mb-2">Chọn size</div>
                <div className="flex flex-wrap gap-2">
                  {data.sizes.map((s) => (
                    <button key={s} onClick={() => setSize(s)} className={`px-3 py-2 rounded-md border ${size===s?"bg-primary text-primary-foreground border-primary":"bg-secondary text-secondary-foreground"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <label htmlFor="qty" className="text-sm text-muted-foreground">Số lượng</label>
                <input id="qty" type="number" min={1} value={qty} onChange={(e)=> setQty(Math.max(1, parseInt(e.target.value||"1",10)))} className="h-10 w-20 rounded-md border px-3" />
              </div>
              <div className="mt-6 flex gap-3">
                <Button className="flex-1" onClick={() => size && add(data, size, qty)} disabled={!size}>Thêm vào giỏ</Button>
                <Button variant="secondary" asChild>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer">Chia sẻ</a>
                </Button>
              </div>

              <Separator className="my-6" />
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h3>Mô tả</h3>
                <p>{data.description}</p>
                <h4>Thông tin</h4>
                <ul>
                  <li>Thương hiệu: {data.brand}</li>
                  <li>Danh mục: {data.category}</li>
                  <li>Loại: {data.type}</li>
                  <li>Màu sắc: {data.color}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        {/* Reviews Section */}
        {!isLoading && data && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Đánh giá & Bình luận</h2>
            
            {/* Review Statistics */}
            <ReviewStats productId={String(data.id)} />
            
            {/* Write Review Form */}
            <div className="mb-8 p-6 border rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Viết đánh giá của bạn
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Chia sẻ trải nghiệm của bạn để giúp khách hàng khác có lựa chọn tốt hơn.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Đánh giá của bạn</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-colors hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({rating}/5 sao)
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Nhận xét chi tiết</label>
                  <Textarea
                    placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm: chất lượng, thiết kế, độ thoải mái..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {comment.length}/500 ký tự
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    className="px-8"
                    onClick={() => {
                      if (comment.trim().length < 10) {
                        toast.error("Vui lòng nhập ít nhất 10 ký tự để đánh giá");
                        return;
                      }
                      toast.success("Cảm ơn bạn đã đánh giá! Đánh giá sẽ được hiển thị sau khi được duyệt.");
                      setComment("");
                      setRating(5);
                    }}
                    disabled={!comment.trim()}
                  >
                    Gửi đánh giá
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setComment("");
                      setRating(5);
                    }}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <Reviews productId={String(data.id)} />
          </div>
        )}
        <div className="mt-10">
          <Link to="/products" className="text-primary">← Quay lại danh sách</Link>
        </div>
      </section>
    </Layout>
  );
}
