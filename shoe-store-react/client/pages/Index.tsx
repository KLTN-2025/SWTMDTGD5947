import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "@/lib/product-api";
import { ProductCard } from "@/components/product/ProductCard";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import { 
  ShoppingBag, 
  Truck, 
  RotateCcw, 
  Shield, 
  Star, 
  ArrowRight, 
  Sparkles,
  TrendingUp,
  Award,
  Heart,
  Clock,
  Zap,
  Users,
  Package,
  ShoppingCart,
  Eye,
  Percent,
  Flame,
  Footprints,
  Briefcase,
  Mountain
} from "lucide-react";

export default function Index() {
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const response = await productApi.getProducts({
        per_page: 8,
        sort_by: 'createdAt',
        sort_order: 'desc'
      });
      return response.data;
    }
  });

  const { data: newData, isLoading: newLoading } = useQuery({
    queryKey: ['new-products'],
    queryFn: async () => {
      const response = await productApi.getProducts({
        per_page: 6,
        sort_by: 'createdAt',
        sort_order: 'desc'
      });
      return response.data;
    }
  });

  // Statistics API
  const { data: statsData } = useQuery({
    queryKey: ['homepage-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/products/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const featuredProducts = featuredData?.products || [];
  const newProducts = newData?.products || [];
  const stats = (statsData as any)?.data || {};
  const navigate = useNavigate();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.25),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(14,165,233,0.25),transparent_50%)]" />
        <div className="container grid md:grid-cols-2 gap-10 py-16 md:py-24 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Bộ sưu tập mới
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Trending
              </Badge>
            </div>
            <h1 className="pb-2 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Bứt phá phong cách với bộ sưu tập giày mới
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Khám phá sneaker, thể thao, công sở với thiết kế hiện đại, tối ưu hiệu năng. 
              Giao diện trực quan, hình ảnh sắc nét.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
                onClick={() => navigate("/products")}
                className="flex items-center gap-2 group"
              >
                <ShoppingBag className="w-4 h-4" />
                Mua ngay
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => navigate("/categories")}
                className="flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                Khám phá danh mục
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur border">
                <Truck className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-sm">Giao hàng nhanh</div>
                  <div className="text-xs text-muted-foreground">Trong 24h</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur border">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-sm">Đổi trả dễ dàng</div>
                  <div className="text-xs text-muted-foreground">Trong 7 ngày</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur border">
                <Shield className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="font-medium text-sm">Bảo hành chính hãng</div>
                  <div className="text-xs text-muted-foreground">100% authentic</div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1542293787938-c9e299b88054?q=80&w=1600&auto=format&fit=crop" alt="Hero sneaker" className="rounded-3xl shadow-2xl" />
            <div className="absolute -bottom-6 -left-6 bg-background/80 backdrop-blur border rounded-2xl p-4 shadow-xl">
              <div className="text-xs text-muted-foreground">Bộ sưu tập mới</div>
              <div className="font-semibold">Summer 2025</div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="container py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-2xl p-6 text-center border border-blue-200/50">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-xl mx-auto mb-3">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {stats.totalProducts || '100+'}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-300">Sản phẩm</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-2xl p-6 text-center border border-green-200/50">
            <div className="flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-xl mx-auto mb-3">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {stats.totalCustomers || '1K+'}
            </div>
            <div className="text-sm text-green-600 dark:text-green-300">Khách hàng</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-2xl p-6 text-center border border-purple-200/50">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-xl mx-auto mb-3">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {stats.totalOrders || '500+'}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-300">Đơn hàng</div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 rounded-2xl p-6 text-center border border-orange-200/50">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-xl mx-auto mb-3">
              <Star className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {stats.averageRating || '4.8'}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-300">Đánh giá</div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="container py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <Badge variant="outline">Trending</Badge>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Sản phẩm nổi bật</h2>
            <p className="text-muted-foreground">Hình ảnh và dữ liệu được cập nhật trực tiếp.</p>
          </div>
          <Link 
            to="/products" 
            className="flex items-center gap-1 text-primary hover:gap-2 transition-all duration-200 font-medium"
          >
            Xem tất cả 
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {featuredLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-muted animate-pulse rounded-lg" />
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Flash Sale */}
      <section className="container py-8">
        <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1 mb-6 md:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-6 h-6 text-yellow-300" />
                <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 border-0">
                  Flash Sale
                </Badge>
                <Badge variant="outline" className="border-white/30 text-white">
                  <Clock className="w-3 h-3 mr-1" />
                  Còn 2 ngày
                </Badge>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Giảm giá lên đến <span className="text-yellow-300">50%</span>
              </h2>
              <p className="text-white/90 text-lg mb-4">
                Khuyến mãi đặc biệt cho bộ sưu tập giày thể thao cao cấp
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate("/products?sale=true")}
                className="bg-white text-red-600 hover:bg-white/90 font-semibold"
              >
                <Percent className="w-4 h-4 mr-2" />
                Mua ngay
              </Button>
            </div>
            <div className="flex-shrink-0">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=400&auto=format&fit=crop" 
                  alt="Flash Sale" 
                  className="w-48 h-48 object-cover rounded-2xl shadow-2xl"
                />
                <div className="absolute -top-3 -right-3 bg-yellow-400 text-red-600 rounded-full w-16 h-16 flex items-center justify-center font-bold text-lg">
                  50%
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Products */}
      <section className="container py-12 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/10 dark:to-emerald-950/10 rounded-3xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <Badge variant="outline" className="border-green-200 text-green-700">
                <Zap className="w-3 h-3 mr-1" />
                Mới ra mắt
              </Badge>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Sản phẩm mới nhất</h2>
            <p className="text-muted-foreground">Khám phá những sản phẩm vừa được bổ sung vào bộ sưu tập.</p>
          </div>
          <Link 
            to="/products?sort=newest" 
            className="flex items-center gap-1 text-green-600 hover:gap-2 transition-all duration-200 font-medium"
          >
            Xem tất cả 
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {newLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-muted animate-pulse rounded-lg" />
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="container py-12">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Danh mục sản phẩm</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(() => {
            // Helper function để lấy icon và gradient cho category
            const getCategoryStyle = (name: string, index: number) => {
              const styles = [
                { icon: Footprints, gradient: "from-blue-500 to-cyan-500", bg: "from-blue-50 to-cyan-50", dark: "dark:from-blue-950/20 dark:to-cyan-950/20" },
                { icon: Zap, gradient: "from-green-500 to-emerald-500", bg: "from-green-50 to-emerald-50", dark: "dark:from-green-950/20 dark:to-emerald-950/20" },
                { icon: Briefcase, gradient: "from-purple-500 to-violet-500", bg: "from-purple-50 to-violet-50", dark: "dark:from-purple-950/20 dark:to-violet-950/20" },
                { icon: Mountain, gradient: "from-orange-500 to-red-500", bg: "from-orange-50 to-red-50", dark: "dark:from-orange-950/20 dark:to-red-950/20" }
              ];
              
              // Tìm style dựa trên tên hoặc sử dụng index
              if (name.toLowerCase().includes('sneaker') || name.toLowerCase().includes('giày')) return styles[0];
              if (name.toLowerCase().includes('thể thao') || name.toLowerCase().includes('sport')) return styles[1];
              if (name.toLowerCase().includes('công sở') || name.toLowerCase().includes('office')) return styles[2];
              if (name.toLowerCase().includes('boot') || name.toLowerCase().includes('cao cổ')) return styles[3];
              
              return styles[index % styles.length];
            };

            const displayCategories = [
              {id: 1, name: "Sneaker", slug: "sneaker"},
              {id: 2, name: "Thể thao", slug: "the-thao"},
              {id: 3, name: "Công sở", slug: "cong-so"},
              {id: 4, name: "Boot", slug: "boot"}
            ];

            return displayCategories.map((c, index) => {
              const style = getCategoryStyle(c.name, index);
              const IconComponent = style.icon;
              
              return (
                <Link 
                  key={c.id || c.slug} 
                  to={`/products?category=${encodeURIComponent(c.slug || c.name)}`} 
                  className={`group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-br ${style.bg} ${style.dark} border border-white/20`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${style.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                      {c.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Khám phá ngay
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Badge variant="secondary" className="text-xs">
                      Hot
                    </Badge>
                  </div>
                </Link>
              );
            });
          })()}
        </div>
      </section>

      {/* SEO sections */}
      <section className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <Badge variant="outline">Chính hãng 100%</Badge>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Giày chính hãng – Đẳng cấp và thoải mái</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              OCE Shoes mang đến trải nghiệm mua sắm trực tuyến hiện đại với bộ sưu tập giày đa dạng: 
              sneaker, chạy bộ, tập luyện, công sở. Chúng tôi cập nhật dữ liệu và hình ảnh trực quan 
              giúp bạn dễ dàng lựa chọn sản phẩm phù hợp.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 border rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Dịch vụ khách hàng</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Đăng ký/Đăng nhập, đăng nhập Google, quên mật khẩu</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Quản lý đơn hàng: theo dõi trạng thái, hủy/đổi trả</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Đánh giá sản phẩm và chia sẻ mạng xã hội</span>
                </li>
              </ul>
            </div>
            
            <div className="p-6 border rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold">Cam kết chất lượng</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>Sản phẩm chính hãng, có tem bảo hành</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>Kiểm tra chất lượng trước khi giao hàng</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>Hỗ trợ đổi trả miễn phí trong 7 ngày</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
