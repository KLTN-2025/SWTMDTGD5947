import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { categoryApi } from "@/lib/category-api";
import { Badge } from "@/components/ui/badge";
import { Loader2, FolderTree } from "lucide-react";

export default function CategoriesPage() {
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoryApi.getCategories();
      return response.data;
    }
  });

  // Backend might return object with 'categories' key or direct array
  const categories = Array.isArray(categoriesData) 
    ? categoriesData 
    : ((categoriesData as any)?.categories || []);
  
  // Tách danh mục cha và con
  const parentCategories = categories.filter(cat => !cat.parentId);
  const childCategories = categories.filter(cat => cat.parentId);

  return (
    <Layout>
      <section className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FolderTree className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Danh mục sản phẩm</h1>
          </div>
          <p className="text-muted-foreground">Khám phá sản phẩm theo danh mục</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Chưa có danh mục nào
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => {
              const children = categories.filter(cat => cat.parentId === category.id);
              const isParent = !category.parentId;
              
              return (
                <div 
                  key={category.id} 
                  className="relative group border rounded-lg p-6 hover:shadow-lg transition-all duration-300 bg-white"
                >
                  <Link 
                    to={`/products?category_id=${category.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      {children.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {children.length} mục con
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {category.parent ? `Thuộc ${category.parent.name}` : 'Danh mục chính'}
                    </p>
                  </Link>

                  {/* Dropdown hiển thị khi hover - chỉ cho danh mục cha có con */}
                  {children.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                      <div className="p-4">
                        <p className="text-sm font-medium text-muted-foreground mb-3">
                          Danh mục con của {category.name}:
                        </p>
                        <div className="space-y-2">
                          {children.map((child) => (
                            <Link
                              key={child.id}
                              to={`/products?category_id=${child.id}`}
                              className="block px-3 py-2 text-sm rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <Link
                            to={`/products?category_id=${category.id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            Xem tất cả sản phẩm {category.name} →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
}
