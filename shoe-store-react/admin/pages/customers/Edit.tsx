import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, UserCog, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { customerApi } from "../../lib/admin-api";
import { useCustomer } from "../../lib/use-customers";
import { getImageUrl } from "@/lib/image-utils";

export default function CustomerEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const customerId = id ? parseInt(id) : null;

  const { customer, loading: customerLoading } = useCustomer(customerId);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    userName: "",
    email: "",
    password: "",
    isActive: true,
    phoneNumber: "",
    address: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  // Load customer data
  useEffect(() => {
    if (customer) {
      const newFormData = {
        name: customer.name || "",
        userName: customer.userName || "",
        email: customer.email || "",
        password: "",
        isActive: customer.isActive ?? true,
        phoneNumber: customer.profile?.phoneNumber || "",
        address: customer.profile?.address || "",
      };
      setFormData(newFormData);

      // Set image preview
      const imageUrl = customer.fullImageUrl || getImageUrl(customer.imageUrl);
      if (imageUrl) {
        setImagePreview(imageUrl);
      }
    }
  }, [customer]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    // Reset to original image if exists
    if (customer) {
      const imageUrl = customer.fullImageUrl || getImageUrl(customer.imageUrl);
      setImagePreview(imageUrl || null);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) return;

    if (!customer) {
      toast.error("Đang tải dữ liệu, vui lòng thử lại");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Họ tên không được để trống");
      return;
    }
    if (!formData.userName.trim()) {
      toast.error("Tên đăng nhập không được để trống");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email không được để trống");
      return;
    }

    setLoading(true);
    try {
      const response = await customerApi.updateCustomer(customerId, {
        name: formData.name,
        userName: formData.userName,
        email: formData.email,
        password: formData.password || undefined,
        isActive: formData.isActive,
        image: imageFile || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address || undefined,
      });

      if (response.data) {
        toast.success("Cập nhật khách hàng thành công");
        navigate("/admin/customers");
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || "Cập nhật khách hàng thất bại";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy khách hàng</p>
        <Button onClick={() => navigate("/admin/customers")} className="mt-4">
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/customers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCog className="h-8 w-8" />
            Chỉnh sửa khách hàng
          </h1>
          <p className="text-muted-foreground">Cập nhật thông tin khách hàng</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
                <CardDescription>Thông tin đăng nhập và tài khoản</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Họ tên <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Nhập họ tên"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userName">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="userName"
                    placeholder="Nhập tên đăng nhập"
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu mới</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Để trống nếu không đổi mật khẩu"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Chỉ nhập nếu muốn thay đổi mật khẩu
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Trạng thái hoạt động</Label>
                    <p className="text-sm text-muted-foreground">
                      Cho phép khách hàng đăng nhập và sử dụng hệ thống
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin liên hệ</CardTitle>
                <CardDescription>Thông tin liên hệ và địa chỉ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Số điện thoại</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Nhập số điện thoại"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    placeholder="Nhập địa chỉ"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ảnh đại diện</CardTitle>
                <CardDescription>Upload ảnh đại diện mới cho khách hàng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <Label htmlFor="image" className="cursor-pointer">
                      <Button type="button" variant="outline" asChild>
                        <span>Chọn ảnh</span>
                      </Button>
                    </Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/customers")}>
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Cập nhật khách hàng
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
