import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartApi } from "@/state/cart-api";
import { useAuth } from "@/state/auth";

export function CartIcon() {
  const { user } = useAuth();
  const { totalItems, isLoading } = useCartApi();

  // Don't show cart icon if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <Button variant="ghost" size="sm" asChild className="relative">
      <Link to="/cart">
        <ShoppingCart className="w-5 h-5" />
        {totalItems > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {totalItems > 99 ? '99+' : totalItems}
          </Badge>
        )}
        {isLoading && (
          <div className="absolute -top-1 -right-1 w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        )}
      </Link>
    </Button>
  );
}
