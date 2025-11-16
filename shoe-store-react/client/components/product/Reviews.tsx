import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewApi } from "@/lib/review-api";
import { toast } from "sonner";
import { useAuth } from "@/state/auth";
import type { ProductReview } from "@/lib/product-api";

interface ReviewsProps {
  reviews: ProductReview[];
  productId: number;
}


const StarRating = ({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
};

const ReviewCard = ({ review, productId, onUpdate, onDelete }: { 
  review: ProductReview; 
  productId: number;
  onUpdate: () => void;
  onDelete: () => void;
}) => {
  const { user } = useAuth();
  const [showFullComment, setShowFullComment] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editComment, setEditComment] = useState(review.comment || '');
  const queryClient = useQueryClient();
  
  const isLongComment = (review.comment?.length || 0) > 150;
  const userName = review.user?.name || 'Người dùng';
  const userAvatar = review.user?.fullImageUrl || review.user?.imageUrl;
  const isOwner = user && review.userId === user.id;

  // Update review mutation
  const updateReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; comment?: string }) => {
      const response = await reviewApi.updateReview(review.id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId.toString()] });
      toast.success("Cập nhật đánh giá thành công");
      setIsEditDialogOpen(false);
      onUpdate();
    },
    onError: (error: any) => {
      let message = 'Cập nhật đánh giá thất bại';
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      toast.error(message);
    }
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async () => {
      await reviewApi.deleteReview(review.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId.toString()] });
      toast.success("Xóa đánh giá thành công");
      onDelete();
    },
    onError: (error: any) => {
      let message = 'Xóa đánh giá thất bại';
      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      toast.error(message);
    }
  });

  const handleUpdate = () => {
    if (editComment.trim().length < 10) {
      toast.error("Vui lòng nhập ít nhất 10 ký tự để đánh giá");
      return;
    }
    updateReviewMutation.mutate({
      rating: editRating,
      comment: editComment.trim()
    });
  };

  const handleDelete = () => {
    if (confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      deleteReviewMutation.mutate();
    }
  };

  return (
    <>
      <div className="border rounded-xl p-6 bg-card">
        <div className="flex items-start gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={userAvatar} />
            <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{userName}</h4>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditRating(review.rating);
                          setEditComment(review.comment || '');
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Chỉnh sửa đánh giá</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Đánh giá</label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditRating(star)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= editRating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-gray-200 text-gray-200"
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-sm text-muted-foreground ml-2">{editRating}/5</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Nhận xét</label>
                          <Textarea
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            maxLength={500}
                            className="min-h-[100px] resize-none"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {editComment.length}/500 ký tự
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Hủy
                          </Button>
                          <Button 
                            onClick={handleUpdate}
                            disabled={updateReviewMutation.isPending || editComment.trim().length < 10}
                          >
                            {updateReviewMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteReviewMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <StarRating rating={review.rating} />
              <span className="text-sm text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            
            <div className="mb-3">
              <p className="text-sm leading-relaxed">
                {review.comment && isLongComment && !showFullComment
                  ? `${review.comment.substring(0, 150)}...`
                  : review.comment || 'Không có nhận xét'}
              </p>
              {isLongComment && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs"
                  onClick={() => setShowFullComment(!showFullComment)}
                >
                  {showFullComment ? "Thu gọn" : "Xem thêm"}
                </Button>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
};

export function Reviews({ reviews, productId }: ReviewsProps) {
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "rating">("newest");
  const [filterRating, setFilterRating] = useState<number | null>(null);

  // Calculate rating statistics
  const totalReviews = reviews.length;
  const averageRating = useMemo(() => {
    if (totalReviews === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
  }, [reviews, totalReviews]);
  
  const ratingCounts = useMemo(() => {
    return [5, 4, 3, 2, 1].map(rating => 
      reviews.filter(review => review.rating === rating).length
    );
  }, [reviews]);

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];
    
    // Filter by rating
    if (filterRating !== null && filterRating !== undefined) {
      filtered = filtered.filter(review => review.rating === filterRating);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "rating":
          return b.rating - a.rating;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [reviews, filterRating, sortBy]);
  
  const handleUpdate = () => {
    // Callback for update - can be used to refresh if needed
  };
  
  const handleDelete = () => {
    // Callback for delete - can be used to refresh if needed
  };

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      {totalReviews > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-xl bg-muted/30">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
            <StarRating rating={Math.round(averageRating)} size="w-6 h-6" />
            <div className="text-sm text-muted-foreground mt-2">
              {totalReviews} đánh giá
            </div>
          </div>
        
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating, idx) => (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-sm w-3">{rating}</span>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{
                    width: `${totalReviews > 0 ? (ratingCounts[idx] / totalReviews) * 100 : 0}%`
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-8">
                {ratingCounts[idx]}
              </span>
            </div>
          ))}
        </div>
      </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-xl bg-muted/30">
          Chưa có đánh giá nào cho sản phẩm này
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border rounded-md px-3 py-1"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="rating">Điểm cao nhất</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Lọc:</span>
          <div className="flex gap-1">
            <Button
              variant={filterRating === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRating(null)}
            >
              Tất cả
            </Button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <Button
                key={rating}
                variant={filterRating === rating ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterRating(rating)}
                className="flex items-center gap-1"
              >
                {rating} <Star className="w-3 h-3 fill-current" />
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <ReviewCard 
              key={review.id} 
              review={review} 
              productId={productId}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {filterRating ? `Không có đánh giá ${filterRating} sao nào.` : 'Không có đánh giá nào phù hợp với bộ lọc.'}
          </div>
        )}
      </div>

    </div>
  );
}
