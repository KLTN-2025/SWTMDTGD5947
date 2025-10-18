import { Product } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Link } from "react-router-dom";
import { useCart } from "@/state/cart";

export function ProductCard({ p }: { p: Product }) {
  const shareUrl = encodeURIComponent(window.location.origin + `/products/${p.id}`);
  const text = encodeURIComponent(`${p.title} - ${p.brand}`);
  const { add } = useCart();
  const defaultSize = p.sizes[0];
  return (
    <div className="group rounded-xl border bg-card text-card-foreground overflow-hidden flex flex-col">
      <Link to={`/products/${p.id}`} className="relative aspect-square overflow-hidden">
        <img src={p.images[0] || p.thumbnail} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {typeof p.discountPercentage === "number" && (
          <div className="absolute left-2 top-2">
            <Badge className="bg-destructive text-destructive-foreground">-{Math.round(p.discountPercentage)}%</Badge>
          </div>
        )}
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{p.brand}</span>
          <span className="text-xs text-muted-foreground">Màu: {p.color}</span>
        </div>
        <Link to={`/products/${p.id}`} className="mt-1 font-semibold line-clamp-2 min-h-10">{p.title}</Link>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold">{p.price.toLocaleString("vi-VN")}₫</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {p.sizes.map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs">{s}</span>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button className="flex-1" onClick={() => add(p, defaultSize, 1)}>Thêm vào giỏ</Button>
          <Button variant="secondary" asChild>
            <a aria-label="Chia sẻ Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noreferrer">FB</a>
          </Button>
          <Button variant="secondary" asChild>
            <a aria-label="Chia sẻ X/Twitter" href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${text}`} target="_blank" rel="noreferrer">X</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
