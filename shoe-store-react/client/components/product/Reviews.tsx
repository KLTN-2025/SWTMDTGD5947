import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, ThumbsDown } from "lucide-react";

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  verified: boolean;
  helpful: number;
  size?: string | number;
  images?: string[];
}

interface ReviewsProps {
  productId: string;
}

// Mock reviews data
const mockReviews: Review[] = [
  {
    id: "1",
    userName: "Nguyễn Văn An",
    userAvatar: "/placeholder.svg",
    rating: 5,
    comment: "Sản phẩm rất chất lượng, đúng như mô tả. Giao hàng nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop tiếp!",
    createdAt: "2024-10-15",
    verified: true,
    helpful: 12,
    size: "42",
    images: ["/placeholder.svg"]
  },
  {
    id: "2",
    userName: "Trần Thị Bình",
    rating: 4,
    comment: "Giày đẹp, chất liệu tốt nhưng hơi chật so với size thông thường. Nên chọn size lớn hơn 1 size.",
    createdAt: "2024-10-12",
    verified: true,
    helpful: 8,
    size: "38"
  },
  {
    id: "3",
    userName: "Lê Minh Cường",
    rating: 5,
    comment: "Tuyệt vời! Đi rất êm chân, thiết kế đẹp. Giá cả hợp lý. Recommend!",
    createdAt: "2024-10-10",
    verified: false,
    helpful: 15,
    size: "41"
  },
  {
    id: "4",
    userName: "Phạm Thu Hà",
    rating: 3,
    comment: "Sản phẩm ổn nhưng màu sắc hơi khác so với hình ảnh. Chất lượng tạm được.",
    createdAt: "2024-10-08",
    verified: true,
    helpful: 3,
    size: "37"
  }
];

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

const ReviewCard = ({ review }: { review: Review }) => {
  const [showFullComment, setShowFullComment] = useState(false);
  const isLongComment = review.comment.length > 150;

  return (
    <div className="border rounded-xl p-6 bg-card">
      <div className="flex items-start gap-4">
        <Avatar className="w-10 h-10">
          <AvatarImage src={review.userAvatar} />
          <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold">{review.userName}</h4>
            {review.verified && (
              <Badge variant="secondary" className="text-xs">
                Đã mua hàng
              </Badge>
            )}
            {review.size && (
              <Badge variant="outline" className="text-xs">
                Size {review.size}
              </Badge>
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
              {isLongComment && !showFullComment
                ? `${review.comment.substring(0, 150)}...`
                : review.comment}
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
          
          {review.images && review.images.length > 0 && (
            <div className="flex gap-2 mb-3">
              {review.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Review ${idx + 1}`}
                  className="w-16 h-16 rounded-lg object-cover border"
                />
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <ThumbsUp className="w-4 h-4" />
              <span>Hữu ích ({review.helpful})</span>
            </button>
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <ThumbsDown className="w-4 h-4" />
              <span>Không hữu ích</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function Reviews({ productId }: ReviewsProps) {
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "rating">("newest");
  const [filterRating, setFilterRating] = useState<number | null>(null);

  // Calculate rating statistics
  const totalReviews = mockReviews.length;
  const averageRating = mockReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => 
    mockReviews.filter(review => review.rating === rating).length
  );

  // Filter and sort reviews
  let filteredReviews = mockReviews;
  if (filterRating) {
    filteredReviews = filteredReviews.filter(review => review.rating === filterRating);
  }

  filteredReviews.sort((a, b) => {
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

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
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
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Không có đánh giá nào phù hợp với bộ lọc.
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredReviews.length > 0 && (
        <div className="text-center">
          <Button variant="outline">
            Xem thêm đánh giá
          </Button>
        </div>
      )}
    </div>
  );
}
