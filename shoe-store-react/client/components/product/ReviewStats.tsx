import { Star, TrendingUp, Users, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReviewStatsProps {
  productId: string;
}

export function ReviewStats({ productId }: ReviewStatsProps) {
  // Mock statistics data
  const stats = {
    totalReviews: 127,
    averageRating: 4.3,
    ratingDistribution: [
      { rating: 5, count: 68, percentage: 53.5 },
      { rating: 4, count: 32, percentage: 25.2 },
      { rating: 3, count: 18, percentage: 14.2 },
      { rating: 2, count: 6, percentage: 4.7 },
      { rating: 1, count: 3, percentage: 2.4 }
    ],
    highlights: [
      { label: "Chất lượng tốt", count: 89 },
      { label: "Đúng size", count: 76 },
      { label: "Giao hàng nhanh", count: 65 },
      { label: "Đóng gói cẩn thận", count: 54 }
    ],
    verifiedPurchases: 98
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Overall Rating */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 p-6 rounded-xl border">
        <div className="text-center">
          <div className="text-4xl font-bold text-yellow-600 mb-2">
            {stats.averageRating}
          </div>
          <div className="flex justify-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(stats.averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            {stats.totalReviews} đánh giá
          </div>
          <div className="flex items-center justify-center gap-1 mt-2">
            <Award className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-600">
              {stats.verifiedPurchases} đã mua hàng
            </span>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="p-6 border rounded-xl">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Phân bố đánh giá
        </h4>
        <div className="space-y-3">
          {stats.ratingDistribution.map((item) => (
            <div key={item.rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12">
                <span className="text-sm">{item.rating}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-8">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Highlights */}
      <div className="p-6 border rounded-xl">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Điểm nổi bật
        </h4>
        <div className="space-y-3">
          {stats.highlights.map((highlight, index) => (
            <div key={index} className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {highlight.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {highlight.count} lượt
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-muted-foreground text-center">
            Dựa trên phân tích từ {stats.totalReviews} đánh giá
          </div>
        </div>
      </div>
    </div>
  );
}
