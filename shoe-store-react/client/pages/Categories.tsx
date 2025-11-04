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
  const parentCategories = categories.filter(cat => !cat.parentId);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parentCategories.map((category) => {
              const childCategories = categories.filter(cat => cat.parentId === category.id);
              return (
                <div key={category.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <Link 
                    to={`/products?category_id=${category.id}`}
                    className="block group"
                  >
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                  </Link>
                  
                  {childCategories.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-muted-foreground mb-2">Danh mục con:</p>
                      <div className="flex flex-wrap gap-2">
                        {childCategories.map((child) => (
                          <Link
                            key={child.id}
                            to={`/products?category_id=${child.id}`}
                          >
                            <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                              {child.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Link
                    to={`/products?category_id=${category.id}`}
                    className="mt-4 inline-block text-sm text-primary hover:underline"
                  >
                    Xem tất cả →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </Layout>
  );
}
