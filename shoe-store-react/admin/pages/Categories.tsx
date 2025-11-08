import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAdminCategories } from "../lib/use-admin-categories";
import { Loader2, FolderTree, Folder, Eye, Pencil, Trash2, Plus } from "lucide-react";

export default function Categories() {
  const navigate = useNavigate();
  const { categories, loading, deleteCategory } = useAdminCategories();

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      try {
        await deleteCategory(id);
      } catch (error) {
        // Error is already handled by the hook with toast
      }
    }
  };

  // Get parent category name
  const getParentName = (parentId?: number | null) => {
    if (!parentId) return null;
    const parent = categories.find(c => c.id === parentId);
    return parent?.name;
  };

  // Count children
  const countChildren = (categoryId: number) => {
    return categories.filter(c => c.parentId === categoryId).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderTree className="h-6 w-6" />
            Quản lý Danh mục
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý danh mục sản phẩm và cấu trúc phân cấp
          </p>
        </div>
        <Button onClick={() => navigate('/admin/categories/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm danh mục
        </Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>Tên danh mục</TableHead>
              <TableHead>Danh mục cha</TableHead>
              <TableHead className="text-center">Danh mục con</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  <Folder className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Chưa có danh mục nào</p>
                  <p className="text-sm mt-1">Tạo danh mục đầu tiên để bắt đầu</p>
                </TableCell>
              </TableRow>
            ) : (
              categories.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    #{c.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-primary" />
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.parentId ? (
                      <Badge variant="secondary" className="font-normal">
                        {getParentName(c.parentId) || `ID: ${c.parentId}`}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Danh mục gốc</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {countChildren(c.id) > 0 ? (
                      <Badge variant="outline">
                        {countChildren(c.id)} danh mục
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Navigating to view:', `/admin/categories/${c.id}/view`);
                          navigate(`/admin/categories/${c.id}/view`);
                        }}
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Navigating to edit:', `/admin/categories/${c.id}`);
                          navigate(`/admin/categories/${c.id}`);
                        }}
                        title="Chỉnh sửa"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(c.id)}
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
