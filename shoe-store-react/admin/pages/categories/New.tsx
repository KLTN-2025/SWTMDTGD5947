import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useAdminCategories } from "../../lib/use-admin-categories";
import { Loader2, FolderPlus, ArrowLeft } from "lucide-react";

export default function CategoryNew() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const { categories, createCategory } = useAdminCategories();

  const save = async () => {
    if (!name.trim()) {
      alert("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      setSaving(true);
      await createCategory({
        name: name.trim(),
        parentId: parentId ? parseInt(parentId) : null,
      });
      navigate('/admin/categories');
    } catch (error) {
      // Error is already handled by the hook with toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderPlus className="h-6 w-6" />
            Thêm danh mục mới
          </h1>
          <p className="text-muted-foreground mt-1">
            Tạo danh mục mới để phân loại sản phẩm
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin danh mục</CardTitle>
          <CardDescription>
            Nhập thông tin cho danh mục mới
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
            <Select value={parentId} onValueChange={setParentId} disabled={saving}>
              <SelectTrigger id="parentId">
                <SelectValue placeholder="Chọn danh mục cha (nếu có)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không có (Danh mục gốc)</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Chọn danh mục cha để tạo cấu trúc phân cấp
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo danh mục
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
