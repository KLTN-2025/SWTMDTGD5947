import { useNavigate, useParams } from "react-router-dom";
import { useAdminUser } from "../../../lib/use-admin-users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Loader2, User, Mail, Phone, MapPin, Calendar, Shield, UserCheck, UserX, Key } from "lucide-react";
import { getImageUrl } from "@/lib/image-utils";

export default function ViewUser() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const userId = id ? parseInt(id) : null;
  
  const { user, loading } = useAdminUser(userId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy người dùng</p>
        <Button onClick={() => navigate("/admin/users")} className="mt-4">
          Quay lại
        </Button>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/users")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chi tiết người dùng</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Thông tin chi tiết của người dùng #{userId}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/admin/users/${userId}`)}>
          <Edit className="h-4 w-4 mr-2" />
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center text-center">
              {(() => {
                // Try fullImageUrl first (from backend), then imageUrl with getImageUrl
                const imageUrl = (user as any).fullImageUrl || getImageUrl(user.imageUrl);
                return imageUrl ? (
                  <img 
                    src={imageUrl}
                    alt={user.name}
                    className="h-32 w-32 rounded-full object-cover mb-4"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-4xl font-medium text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                );
              })()}
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">@{user.userName}</p>
              
              <div className="flex gap-2 mt-4">
                {user.isActive ? (
                  <Badge variant="default" className="bg-green-600">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Hoạt động
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <UserX className="h-3 w-3 mr-1" />
                    Không hoạt động
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Cards */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tên đăng nhập</p>
                    <p className="font-medium">@{user.userName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vai trò</p>
                    <Badge variant="outline" className="mt-1">
                      {user.role?.name || 'N/A'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phương thức đăng nhập</p>
                    <p className="font-medium">
                      {user.hasPassword ? 'Mật khẩu' : 'Chỉ Google'}
                      {user.provider && user.provider !== 'LOCAL' && ` + ${user.provider}`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Số điện thoại</p>
                    <p className="font-medium">{(user.profile as any)?.phone || (user.profile as any)?.phoneNumber || 'Chưa cập nhật'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày sinh</p>
                    <p className="font-medium">{formatDate(user.profile?.dateOfBirth)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:col-span-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Địa chỉ</p>
                    <p className="font-medium">{user.profile?.address || 'Chưa cập nhật'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin hệ thống</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
                  <p className="font-medium">{formatDate(user.updatedAt)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">ID người dùng</p>
                  <p className="font-medium font-mono">#{user.id}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <p className="font-medium">
                    {user.isActive ? (
                      <span className="text-green-600">Đang hoạt động</span>
                    ) : (
                      <span className="text-red-600">Không hoạt động</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
