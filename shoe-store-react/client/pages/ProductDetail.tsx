import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi, type Product } from "@/lib/product-api";
import { reviewApi } from "@/lib/review-api";
import { useEffect, useMemo, useState } from "react";
import { useCartApi } from "@/state/cart-api";
import { useAuth } from "@/state/auth";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star, Package, Tag, ShoppingCart, ArrowLeft, User, Share2 } from "lucide-react";
import { Reviews } from "@/components/product/Reviews";
import { ShareDialog } from "@/components/product/ShareDialog";

export default function ProductDetail() {
  const { id } = useParams();
  const { data: response, isLoading, error } = useQuery({ 
    queryKey: ["product", id], 
    queryFn: () => productApi.getProduct(Number(id!)),
    enabled: !!id
  });
  
  const product = response?.data;
  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const { addToCart, isLoading: cartLoading } = useCartApi();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (data: { productId: number; rating: number; comment?: string }) => {
      const response = await reviewApi.createReview(data);
      return response.data;
    },
    onSuccess: () => {
      // Refresh product data to get updated reviews
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      toast.success("Cảm ơn bạn đã đánh giá! Đánh giá của bạn đã được gửi thành công.");
      setComment("");
      setRating(5);
    },
    onError: (error: any) => {
      // Lấy message từ API response
      let message = 'Gửi đánh giá thất bại';
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      toast.error(message);
    }
  });

  // Auto-select first color if available
  useEffect(() => {
    if (product && product.colors && product.colors.length > 0 && !selectedColorId) {
      setSelectedColorId(product.colors[0].id);
    }
  }, [product, selectedColorId]);

  // Auto-select first variant
  useEffect(() => {
    if (product && product.variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [product, selectedVariantId]);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | OCE Shoes`;
    }
  }, [product]);

  const images = useMemo(() => product?.images || [], [product]);
  const selectedVariant = useMemo(() => 
    product?.variants.find(v => v.id === selectedVariantId),
    [product, selectedVariantId]
  );
  
  // Calculate average rating
  const averageRating = useMemo(() => {
    if (!product?.reviews || product.reviews.length === 0) return 0;
    const sum = product.reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / product.reviews.length).toFixed(1);
  }, [product]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return <Badge className="bg-green-500 hover:bg-green-600">Còn hàng</Badge>;
      case 'SOLD_OUT':
        return <Badge variant="destructive">Hết hàng</Badge>;
      case 'PRE_SALE':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Đặt trước</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <section className="container py-8">
        {isLoading && <div className="py-20 text-center">Đang tải...</div>}
        {error && <div className="py-20 text-center text-destructive">Không tìm thấy sản phẩm.</div>}
        {!isLoading && product && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Image Gallery */}
              <div>
                <div className="aspect-square overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <img 
                    src={images[activeImg]?.fullUrl || '/placeholder.svg'} 
                    alt={product.name} 
                    className="h-full w-full object-cover" 
                  />
                </div>
                {images.length > 1 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {images.map((img, idx) => (
                      <button 
                        key={img.id} 
                        onClick={() => setActiveImg(idx)} 
                        className={`aspect-square rounded-lg overflow-hidden border transition-all ${
                          idx === activeImg
                            ? "ring-2 ring-primary shadow-md" 
                            : "hover:ring-1 hover:ring-muted-foreground"
                        }`}
                      >
                        <img src={img.fullUrl} alt={`${product.name} ${idx+1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">SKU: {product.skuId}</span>
                      {getStatusBadge(product.status)}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                {product.reviews && product.reviews.length > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(Number(averageRating))
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{averageRating}</span>
                    <span className="text-sm text-muted-foreground">({product.reviews.length} đánh giá)</span>
                  </div>
                )}

                {/* Price */}
                <div className="mt-6">
                  {selectedVariant ? (
                    <div>
                      <div className="text-3xl font-extrabold text-primary">
                        {selectedVariant.price.toLocaleString("vi-VN")}₫
                      </div>
                      {selectedVariant.price !== product.basePrice && (
                        <div className="text-lg text-muted-foreground line-through mt-1">
                          {product.basePrice.toLocaleString("vi-VN")}₫
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-3xl font-extrabold">
                      {product.basePrice.toLocaleString("vi-VN")}₫
                    </div>
                  )}
                </div>

                {/* Categories */}
                {product.categories && product.categories.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    {product.categories.map((cat) => (
                      <Badge key={cat.id} variant="outline">{cat.name}</Badge>
                    ))}
                  </div>
                )}


                {/* Product Details - Moved up for better visibility */}
                <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
                  <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Thông tin chi tiết
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Mã sản phẩm:</div>
                    <div className="font-medium">{product.skuId}</div>
                    
                    <div className="text-muted-foreground">Danh mục:</div>
                    <div className="font-medium">{product.categories?.map(c => c.name).join(', ') || 'Chưa phân loại'}</div>
                    
                    <div className="text-muted-foreground">Trạng thái:</div>
                    <div className="font-medium">{
                      product.status === 'IN_STOCK' ? 'Còn hàng' : 
                      product.status === 'SOLD_OUT' ? 'Hết hàng' : 'Đặt trước'
                    }</div>
                    
                    <div className="text-muted-foreground">Số lượng:</div>
                    <div className="font-medium">{product.quantity}</div>
                  </div>
                </div>

                {/* Color Selection */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mt-6">
                    <div className="font-semibold mb-3">Chọn màu sắc</div>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button 
                          key={color.id} 
                          onClick={() => setSelectedColorId(color.id)} 
                          className={`px-4 py-3 rounded-lg border transition-all flex items-center gap-2 ${
                            selectedColorId === color.id
                              ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary ring-offset-2"
                              : "bg-secondary text-secondary-foreground hover:border-primary hover:shadow-sm"
                          }`}
                        >
                          <div className="font-medium">{color.name}</div>
                          {color.hexCode && (
                            <span className="text-xs text-muted-foreground">({color.hexCode})</span>
                          )}
                        </button>
                      ))}
                    </div>
                    {selectedColorId && product.colors.find(c => c.id === selectedColorId)?.description && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {product.colors.find(c => c.id === selectedColorId)?.description}
                      </div>
                    )}
                  </div>
                )}

                {/* Size Selection */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mt-6">
                    <div className="font-semibold mb-3">Chọn size</div>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant) => (
                        <button 
                          key={variant.id} 
                          onClick={() => setSelectedVariantId(variant.id)} 
                          className={`px-4 py-3 rounded-lg border transition-all ${
                            selectedVariantId === variant.id
                              ? "bg-primary text-primary-foreground border-primary shadow-md"
                              : "bg-secondary text-secondary-foreground hover:border-primary hover:shadow-sm"
                          }`}
                        >
                          <div className="font-medium">{variant.size.nameSize}</div>
                          {variant.price !== product.basePrice && (
                            <div className="text-xs mt-1">{variant.price.toLocaleString("vi-VN")}₫</div>
                          )}
                        </button>
                      ))}
                    </div>
                    {selectedVariant && selectedVariant.size.description && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {selectedVariant.size.description}
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity */}
                <div className="mt-6 flex items-center gap-3">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <label htmlFor="qty" className="text-sm font-medium">Số lượng:</label>
                  <input 
                    id="qty" 
                    type="number" 
                    min={1} 
                    max={product.quantity}
                    value={qty} 
                    onChange={(e)=> setQty(Math.max(1, Math.min(product.quantity, parseInt(e.target.value||"1",10))))} 
                    className="h-10 w-20 rounded-md border px-3 text-center" 
                  />
                  <span className="text-sm text-muted-foreground">({product.quantity} có sẵn)</span>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <Button 
                    className="flex-1" 
                    size="lg"
                    onClick={async () => {
                      if (!selectedVariant) {
                        toast.error("Vui lòng chọn size");
                        return;
                      }
                      if (product.colors && product.colors.length > 0 && !selectedColorId) {
                        toast.error("Vui lòng chọn màu sắc");
                        return;
                      }
                      await addToCart(selectedVariant.id, qty, selectedColorId);
                    }} 
                    disabled={!selectedVariant || product.status === 'SOLD_OUT' || cartLoading}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Thêm vào giỏ
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="lg"
                    onClick={() => setShareDialogOpen(true)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Chia sẻ
                  </Button>
                </div>

                <Separator className="my-6" />
                
                {/* Description */}
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold">Mô tả sản phẩm</h3>
                  <p className="text-muted-foreground">{product.description || 'Chưa có mô tả'}</p>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Đánh giá & Bình luận</h2>
              
              {/* Review Statistics */}
              {product.reviews && product.reviews.length > 0 && (
                <div className="mb-8 p-6 border rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold">{averageRating}</div>
                      <div className="flex items-center justify-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(Number(averageRating))
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {product.reviews.length} đánh giá
                      </div>
                    </div>
                    <Separator orientation="vertical" className="h-20" />
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">
                        Dựa trên {product.reviews.length} đánh giá từ khách hàng
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Write Review Form */}
              {user && (
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
                            className="transition-all hover:scale-110"
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
                        maxLength={500}
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
                          if (!product) return;
                          
                          if (comment.trim().length < 10) {
                            toast.error("Vui lòng nhập ít nhất 10 ký tự để đánh giá");
                            return;
                          }
                          
                          createReviewMutation.mutate({
                            productId: product.id,
                            rating: rating,
                            comment: comment.trim()
                          });
                        }}
                        disabled={!comment.trim() || createReviewMutation.isPending}
                      >
                        {createReviewMutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
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
              )}

              {/* Reviews List */}
              <Reviews reviews={product.reviews || []} productId={product.id} />
            </div>
          </>
        )}

        {/* Share Dialog */}
        {product && (
          <ShareDialog
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            productId={product.id}
            productName={product.name}
          />
        )}
        
        <div className="mt-10">
          <Link to="/products" className="inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </section>
    </Layout>
  );
}
