import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminCategory, useAdminCategories } from "../../lib/use-admin-categories";
import { useAdminProducts } from "../../lib/use-admin-products";
import { Loader2, FolderOpen, Pencil, ArrowLeft, Package, FolderTree } from "lucide-react";

export default function CategoryView() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const categoryId = id ? parseInt(id) : null;
  const { category, loading: categoryLoading } = useAdminCategory(categoryId);
  const { categories } = useAdminCategories();
  const { products, loading: productsLoading } = useAdminProducts();

  useEffect(() => {
    // Only redirect if loading is done AND category not found
    if (!categoryLoading && categoryId && !category) {
      console.log('Category not found, redirecting to list');
      navigate('/admin/categories');
    }
  }, [categoryLoading, category, categoryId, navigate]);

  // Filter products by category
  const categoryProducts = useMemo(() => {
    if (!category || !products) return [];
    return products.filter(p => 
      p.categories?.some((cat: any) => cat.id === category.id)
    );
  }, [products, category]);

  // Get parent category
  const parentCategory = useMemo(() => {
    if (!category?.parentId || !categories) return null;
    return categories.find(c => c.id === category.parentId);
  }, [category, categories]);

  // Get child categories
  const childCategories = useMemo(() => {
    if (!category || !categories) return [];
    return categories.filter(c => c.parentId === category.id);
  }, [category, categories]);

  if (categoryLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6" />
            {category.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Chi tiết danh mục và sản phẩm liên quan
          </p>
        </div>
        <Button onClick={() => navigate(`/admin/categories/${category.id}`)}>
          <Pencil className="h-4 w-4 mr-2" />
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Category Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Thông tin danh mục
            </CardTitle>
            <CardDescription>ID: #{category.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Tên danh mục</p>
              <p className="font-medium">{category.name}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Danh mục cha</p>
              {parentCategory ? (
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => navigate(`/admin/categories/${parentCategory.id}/view`)}
                >
                  {parentCategory.name}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">Danh mục gốc</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Danh mục con</p>
              {childCategories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {childCategories.map(child => (
                    <Badge 
                      key={child.id}
                      variant="outline" 
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => navigate(`/admin/categories/${child.id}/view`)}
                    >
                      {child.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Không có</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Số sản phẩm</p>
              <p className="text-2xl font-bold">{categoryProducts.length}</p>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Sản phẩm ({categoryProducts.length})
            </CardTitle>
            <CardDescription>
              Danh sách sản phẩm thuộc danh mục này
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryProducts.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Chưa có sản phẩm nào</p>
                <p className="text-sm mt-1">Danh mục này chưa có sản phẩm nào</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Ảnh</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Giá</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryProducts.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.images[0] ? (
                          <img src={p.images[0].url} alt={p.name} className="h-12 w-12 rounded object-cover" />
                        ) : (
                          <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <span 
                          className="hover:underline cursor-pointer text-primary"
                          onClick={() => navigate(`/admin/products/${p.id}/view`)}
                        >
                          {p.name}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {p.skuId}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          p.status === 'IN_STOCK' ? 'default' : 
                          p.status === 'PRE_SALE' ? 'secondary' : 'destructive'
                        }>
                          {p.status === 'IN_STOCK' ? 'Còn hàng' : 
                           p.status === 'PRE_SALE' ? 'Đặt trước' : 'Hết hàng'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {p.basePrice.toLocaleString("vi-VN")}₫
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
