import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchFeaturedProducts, fetchNewProducts } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
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
  Zap
} from "lucide-react";

export default function Index() {
  const { data: featuredData } = useQuery({ 
    queryKey: ["featured-products"], 
    queryFn: () => fetchFeaturedProducts(8) 
  });
  const { data: newData } = useQuery({ 
    queryKey: ["new-products"], 
    queryFn: () => fetchNewProducts(6) 
  });
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuredData?.products.map((p, index) => (
            <Link 
              key={p.id} 
              to={`/products/${p.id}`} 
              className="group rounded-2xl overflow-hidden border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-square overflow-hidden relative">
                <img 
                  src={p.images[0] || p.thumbnail} 
                  alt={p.title} 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                {p.discountPercentage && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    -{Math.round(p.discountPercentage)}%
                  </Badge>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-muted-foreground uppercase font-medium">{p.brand}</div>
                  {p.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">{p.rating}</span>
                    </div>
                  )}
                </div>
                <div className="font-medium line-clamp-1 mb-2">{p.title}</div>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-primary">{p.price.toLocaleString("vi-VN")}₫</div>
                  {p.stock && p.stock < 10 && (
                    <Badge variant="outline" className="text-xs">
                      Còn {p.stock}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {newData?.products.map((p) => (
            <Link 
              key={p.id} 
              to={`/products/${p.id}`} 
              className="group rounded-2xl overflow-hidden border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative"
            >
              <div className="aspect-square overflow-hidden relative">
                <img 
                  src={p.images[0] || p.thumbnail} 
                  alt={p.title} 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  NEW
                </Badge>
                {p.discountPercentage && (
                  <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                    -{Math.round(p.discountPercentage)}%
                  </Badge>
                )}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-muted-foreground uppercase font-medium">{p.brand}</div>
                  {p.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">{p.rating}</span>
                    </div>
                  )}
                </div>
                <div className="font-medium line-clamp-2 text-sm mb-2">{p.title}</div>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-green-600">{p.price.toLocaleString("vi-VN")}₫</div>
                  {p.stock && p.stock < 20 && (
                    <Badge variant="outline" className="text-xs">
                      Còn {p.stock}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Danh mục sản phẩm</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {k:"sneaker", label: "Sneaker", img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop"},
            {k:"thể thao", label: "Thể thao", img:"https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1200&auto=format&fit=crop"},
            {k:"công sở", label: "Công sở", img:"https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=1200&auto=format&fit=crop"},
            {k:"boot", label: "Boot", img:"https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop"}
          ].map((c)=> (
            <Link 
              key={c.k} 
              to={`/products?type=${encodeURIComponent(c.k)}`} 
              className="relative rounded-2xl overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <img 
                src={c.img} 
                alt={c.k} 
                className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="text-white font-bold text-lg mb-1">{c.label.toUpperCase()}</div>
                <div className="text-white/80 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                  Khám phá ngay
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Hot
                </Badge>
              </div>
            </Link>
          ))}
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
