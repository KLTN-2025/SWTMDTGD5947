import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAdminProducts } from "../../lib/use-admin-products";
import { useAdminCategories } from "../../lib/use-admin-categories";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProductNew() {
  const nav = useNavigate();
  const { createProduct } = useAdminProducts();
  const { categories } = useAdminCategories();
  
  const [skuId, setSkuId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [status, setStatus] = useState<'IN_STOCK' | 'SOLD_OUT' | 'PRE_SALE'>('IN_STOCK');
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(prev => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    if (!skuId || !name || basePrice <= 0 || quantity < 0) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setLoading(true);
      await createProduct({
        skuId,
        name,
        description,
        basePrice,
        quantity,
        status,
        category_ids: categoryIds,
        images,
      });
      // Hook already shows toast, just navigate
      nav("/admin/products");
    } catch (error: any) {
      // Hook already shows error toast
      console.error('Create product error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Thêm sản phẩm mới</h1>
        <p className="text-gray-600">Điền thông tin sản phẩm và upload ảnh</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SKU ID *</Label>
              <Input 
                placeholder="VD: SHOE-001" 
                value={skuId} 
                onChange={e => setSkuId(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái *</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_STOCK">Còn hàng</SelectItem>
                  <SelectItem value="SOLD_OUT">Hết hàng</SelectItem>
                  <SelectItem value="PRE_SALE">Đặt trước</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tên sản phẩm *</Label>
            <Input 
              placeholder="VD: Giày thể thao Nike Air Max" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea 
              placeholder="Mô tả chi tiết về sản phẩm..." 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Giá bán *</Label>
              <Input 
                type="number" 
                placeholder="0" 
                value={basePrice || ''} 
                onChange={e => setBasePrice(Number(e.target.value))} 
              />
            </div>
            <div className="space-y-2">
              <Label>Số lượng *</Label>
              <Input 
                type="number" 
                placeholder="0" 
                value={quantity || ''} 
                onChange={e => setQuantity(Number(e.target.value))} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh mục sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có danh mục nào</p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={categoryIds.includes(category.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setCategoryIds([...categoryIds, category.id]);
                      } else {
                        setCategoryIds(categoryIds.filter(id => id !== category.id));
                      }
                    }}
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category.name}
                  </label>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hình ảnh sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600">Click để chọn ảnh hoặc kéo thả vào đây</p>
              <p className="text-xs text-gray-400 mt-2">Hỗ trợ: JPG, PNG, GIF (tối đa 5MB)</p>
            </label>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {images.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save} disabled={loading}>
          {loading ? "Đang lưu..." : "Lưu sản phẩm"}
        </Button>
        <Button variant="outline" onClick={() => nav(-1)} disabled={loading}>
          Hủy
        </Button>
      </div>
    </div>
  );
}
