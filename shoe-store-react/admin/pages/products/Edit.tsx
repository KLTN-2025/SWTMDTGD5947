import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { useAdminProduct } from "../../lib/use-admin-products";
import { adminProductApi } from "../../lib/admin-api";
import { toast } from "sonner";
import { Upload, X, Trash2 } from "lucide-react";

export default function ProductEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const { product, loading: loadingProduct } = useAdminProduct(Number(id));
  
  const [skuId, setSkuId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [status, setStatus] = useState<'IN_STOCK' | 'SOLD_OUT' | 'PRE_SALE'>('IN_STOCK');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setSkuId(product.skuId);
      setName(product.name);
      setDescription(product.description || "");
      setBasePrice(product.basePrice);
      setQuantity(product.quantity);
      setStatus(product.status);
    }
  }, [product]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...files]);
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const deleteExistingImage = async (imageId: number) => {
    if (!confirm("Đồng ý xóa ảnh này?")) return;
    
    try {
      await adminProductApi.deleteProductImage(imageId);
      toast.success("Xóa ảnh thành công");
      window.location.reload(); // Reload to refresh images
    } catch (error: any) {
      toast.error(error.message || "Xóa ảnh thất bại");
    }
  };

  const save = async () => {
    if (!id || !skuId || !name || basePrice <= 0 || quantity < 0) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setLoading(true);
      await adminProductApi.updateProduct(Number(id), {
        skuId,
        name,
        description,
        basePrice,
        quantity,
        status,
        images: newImages.length > 0 ? newImages : undefined,
      });
      toast.success("Cập nhật sản phẩm thành công");
      nav("/admin/products");
    } catch (error: any) {
      toast.error(error.message || "Cập nhật sản phẩm thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không tìm thấy sản phẩm</p>
        <Button onClick={() => nav("/admin/products")} className="mt-4">Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Cập nhật sản phẩm</h1>
        <p className="text-gray-600">Chỉnh sửa thông tin và ảnh sản phẩm</p>
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
          <CardTitle>Hình ảnh sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Images */}
          {product.images && product.images.length > 0 && (
            <div>
              <Label className="mb-2 block">Ảnh hiện tại</Label>
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={`http://localhost:8009/${img.url}`}
                      alt="Product"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => deleteExistingImage(img.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Images */}
          <div>
            <Label className="mb-2 block">Thêm ảnh mới</Label>
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
          </div>

          {/* New Images Preview */}
          {newImages.length > 0 && (
            <div>
              <Label className="mb-2 block">Ảnh mới sẽ thêm</Label>
              <div className="grid grid-cols-4 gap-4">
                {newImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save} disabled={loading}>
          {loading ? "Đang cập nhật..." : "Cập nhật sản phẩm"}
        </Button>
        <Button variant="outline" onClick={() => nav(-1)} disabled={loading}>
          Hủy
        </Button>
      </div>
    </div>
  );
}
