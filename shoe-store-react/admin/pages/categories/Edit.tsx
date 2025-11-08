import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminCategory, useAdminCategories } from "../../lib/use-admin-categories";
import { adminCategoryApi } from "../../lib/admin-api";
import { Loader2, FolderEdit, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function CategoryEdit() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const categoryId = id ? parseInt(id) : null;
  const { category, loading } = useAdminCategory(categoryId);
  const { categories } = useAdminCategories();
  
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setParentId(category.parentId ? category.parentId.toString() : "");
    }
  }, [category]);

  useEffect(() => {
    // Only redirect if loading is done AND category not found
    if (!loading && categoryId && !category) {
      console.log('Category not found, redirecting to list');
      navigate('/admin/categories');
    }
  }, [loading, category, categoryId, navigate]);

  const save = async () => {
    if (!name.trim()) {
      alert("Vui lòng nhập tên danh mục");
      return;
    }

    if (!categoryId) return;

    try {
      setSaving(true);
      await adminCategoryApi.updateCategory(categoryId, {
        name: name.trim(),
        parentId: parentId && parentId !== "none" ? parseInt(parentId) : null,
      });
      toast.success("Cập nhật danh mục thành công");
      navigate('/admin/categories');
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật danh mục");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!category) {
    return null;
  }

  // Filter out current category and its children from parent options
  const availableParents = categories.filter(c => 
    c.id !== categoryId && c.parentId !== categoryId
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderEdit className="h-6 w-6" />
            Chỉnh sửa danh mục
          </h1>
          <p className="text-muted-foreground mt-1">
            Cập nhật thông tin danh mục #{categoryId}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin danh mục</CardTitle>
          <CardDescription>
            Chỉnh sửa thông tin cho danh mục
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Tên danh mục <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="name"
              placeholder="Ví dụ: Giày thể thao, Giày da..." 
              value={name} 
              onChange={e => setName(e.target.value)}
              disabled={saving}
            />
            <p className="text-sm text-muted-foreground">
              Tên danh mục phải là duy nhất và không quá 50 ký tự
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">Danh mục cha (tùy chọn)</Label>
            <Select value={parentId || "none"} onValueChange={setParentId} disabled={saving}>
              <SelectTrigger id="parentId">
                <SelectValue placeholder="Chọn danh mục cha (nếu có)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không có (Danh mục gốc)</SelectItem>
                {availableParents.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Không thể chọn chính nó hoặc danh mục con làm danh mục cha
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cập nhật
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)} disabled={saving}>
              Hủy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
