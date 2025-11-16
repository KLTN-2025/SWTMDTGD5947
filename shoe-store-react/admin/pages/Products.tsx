import { useEffect, useState } from "react";
import { useAdminProducts } from "../lib/use-admin-products";
import { useAdminCategories } from "../lib/use-admin-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle,
  TrendingUp,
  Grid3X3,
  List,
  Download,
  Upload
} from "lucide-react";

export default function Products() {
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  
  // Use real API with server-side filtering
  const { products, loading, deleteProduct: apiDeleteProduct, searchProducts } = useAdminProducts();
  const { categories } = useAdminCategories();
  
  // Server-side search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      // Build search params - create fresh object each time
      const params: Record<string, string> = {};
      
      if (q && q.trim()) params.keyword = q.trim();
      if (categoryFilter !== "all") params.category_id = categoryFilter;
      
      // Map stock filter to status
      if (stockFilter === "out") {
        params.status = "SOLD_OUT";
      } else if (stockFilter === "available") {
        params.status = "IN_STOCK";
      }
      // Note: "low" stock can't be filtered by status, need quantity check
      
      // Call search API with params object
      console.log('Search params:', params);
      searchProducts(params);
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(timer);
  }, [q, categoryFilter, stockFilter]);
  
  // Client-side filter for "low stock" since backend doesn't support it
  const visible = stockFilter === "low" 
    ? products.filter(p => p.quantity < 10 && p.quantity > 0)
    : products;

  const remove = async (id: number) => { 
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      try {
        await apiDeleteProduct(id);
      } catch (error) {
        // Error already handled by hook with toast
      }
    }
  };

  // Calculate stats
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.quantity < 10).length;
  const outOfStockProducts = products.filter(p => p.quantity === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.basePrice * p.quantity), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý sản phẩm</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý toàn bộ sản phẩm trong cửa hàng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link to="/admin/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm sản phẩm
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs font-medium text-gray-600">Tổng sản phẩm</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-md">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{lowStockProducts}</div>
              <p className="text-xs font-medium text-gray-600">Sắp hết hàng</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-md">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{outOfStockProducts}</div>
              <p className="text-xs font-medium text-gray-600">Hết hàng</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">{totalValue.toLocaleString("vi-VN")}₫</div>
              <p className="text-xs font-medium text-gray-600">Giá trị tồn kho</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Tìm kiếm sản phẩm..." 
                value={q} 
                onChange={e => setQ(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tồn kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="available">Còn hàng</SelectItem>
                <SelectItem value="low">Sắp hết</SelectItem>
                <SelectItem value="out">Hết hàng</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách sản phẩm ({visible.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          )}
          {!loading && viewMode === "table" && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Giá bán</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map(p => {
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {p.images && p.images.length > 0 && (
                              <img 
                                src={`http://localhost:8009/${p.images[0].url}`} 
                                alt={p.name} 
                                className="w-10 h-10 object-cover rounded" 
                              />
                            )}
                            <span>{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{p.skuId}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {p.categories && p.categories.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {p.categories.map(cat => (
                                  <Badge key={cat.id} variant="outline" className="text-xs">
                                    {cat.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {p.colors && p.colors.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {p.colors.map(color => (
                                  <Badge 
                                    key={color.id} 
                                    variant="outline" 
                                    className="text-xs flex items-center gap-1"
                                  >
                                    {color.hexCode && (
                                      <span 
                                        className="w-2 h-2 rounded-full border border-gray-300"
                                        style={{ backgroundColor: color.hexCode }}
                                      />
                                    )}
                                    {color.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {(!p.categories || p.categories.length === 0) && (!p.colors || p.colors.length === 0) && "—"}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {p.basePrice.toLocaleString("vi-VN")}₫
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{p.quantity}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            p.status === 'SOLD_OUT' ? "destructive" : 
                            p.quantity < 10 ? "secondary" : "outline"
                          }>
                            {p.status === 'SOLD_OUT' ? "Hết hàng" : 
                             p.quantity < 10 ? "Sắp hết" : "Còn hàng"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/admin/products/${p.id}/view`}>
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link to={`/admin/products/${p.id}`}>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visible.map(p => {
                return (
                  <Card key={p.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      {p.images && p.images.length > 0 ? (
                        <img 
                          src={`http://localhost:8009/${p.images[0].url}`} 
                          alt={p.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <Badge 
                        className="absolute top-2 right-2"
                        variant={
                          p.status === 'SOLD_OUT' ? "destructive" : 
                          p.quantity < 10 ? "secondary" : "outline"
                        }
                      >
                        {p.status === 'SOLD_OUT' ? "Hết hàng" : 
                         p.quantity < 10 ? "Sắp hết" : "Còn hàng"}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-medium line-clamp-2">{p.name}</h3>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span className="text-xs text-gray-400">SKU: {p.skuId}</span>
                          {p.categories && p.categories.length > 0 && (
                            <Badge variant="outline" className="text-xs">{p.categories[0].name}</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-lg">{p.basePrice.toLocaleString("vi-VN")}₫</div>
                          <div className="text-sm text-gray-500">SL: {p.quantity}</div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Link to={`/admin/products/${p.id}/view`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full">
                              <Eye className="h-4 w-4 mr-1" />
                              Xem
                            </Button>
                          </Link>
                          <Link to={`/admin/products/${p.id}`} className="flex-1">
                            <Button size="sm" className="w-full">
                              <Edit className="h-4 w-4 mr-1" />
                              Sửa
                            </Button>
                          </Link>
                          <Button size="sm" variant="destructive" onClick={() => remove(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
          {!loading && visible.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-gray-500 mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              <Button variant="outline" onClick={() => {
                setQ("");
                setCategoryFilter("all");
                setStockFilter("all");
              }}>
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
