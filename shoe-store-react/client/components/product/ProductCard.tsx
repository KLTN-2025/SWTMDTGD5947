import { Product } from "@/lib/product-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { getImageUrl } from "@/lib/image-utils";

export function ProductCard({ product }: { product: Product }) {
  // Try fullUrl first (from backend), then url with getImageUrl
  const imageUrl = product.images[0]?.fullUrl || getImageUrl(product.images[0]?.url);
  
  const statusLabel = {
    'IN_STOCK': 'Còn hàng',
    'SOLD_OUT': 'Hết hàng',
    'PRE_SALE': 'Đặt trước'
  }[product.status];
  
  const statusVariant = {
    'IN_STOCK': 'default' as const,
    'SOLD_OUT': 'destructive' as const,
    'PRE_SALE': 'secondary' as const
  }[product.status];

  return (
    <div className="group rounded-xl border bg-card text-card-foreground overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
      <Link to={`/products/${product.id}`} className="relative aspect-square overflow-hidden bg-muted">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={product.name} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
        <div className="absolute right-2 top-2">
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <Link to={`/products/${product.id}`} className="font-semibold line-clamp-2 min-h-12 hover:text-primary transition-colors">
          {product.name}
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            {product.basePrice.toLocaleString("vi-VN")}₫
          </span>
        </div>
        {product.categories && product.categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.categories.slice(0, 2).map((cat) => (
              <span key={cat.id} className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs">
                {cat.name}
              </span>
            ))}
          </div>
        )}
        {product.colors && product.colors.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">Màu:</span>
            {product.colors.slice(0, 3).map((color) => (
              <Badge 
                key={color.id}
                variant="outline"
                className="text-xs"
                title={color.name}
              >
                {color.name}
                {color.hexCode && (
                  <span className="ml-1 text-muted-foreground">({color.hexCode})</span>
                )}
              </Badge>
            ))}
            {product.colors.length > 3 && (
              <span className="text-xs text-muted-foreground">+{product.colors.length - 3}</span>
            )}
          </div>
        )}
        <div className="mt-auto pt-4">
          <Button className="w-full" size="sm" asChild>
            <Link to={`/products/${product.id}`}>Xem chi tiết</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
