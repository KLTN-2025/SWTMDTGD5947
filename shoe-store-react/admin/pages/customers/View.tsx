import { useNavigate, useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCustomer } from "../../lib/use-customers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Package, DollarSign, MessageSquare, ShoppingCart } from "lucide-react";

export default function CustomerView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { customer, loading } = useCustomer(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không tìm thấy khách hàng</p>
        <Button onClick={() => nav("/admin/customers")} className="mt-4">
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chi tiết khách hàng</h1>
          <p className="text-muted-foreground">Thông tin và lịch sử mua hàng</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/customers/${customer.id}`}>
            <Button>Sửa</Button>
          </Link>
          <Button variant="outline" onClick={() => nav(-1)}>
            Quay lại
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Customer Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin khách hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="w-24 h-24">
                <AvatarImage src={customer.fullImageUrl || customer.imageUrl} />
                <AvatarFallback className="text-2xl">
                  {customer.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-semibold">{customer.name}</h3>
              <p className="text-sm text-muted-foreground">@{customer.userName}</p>
              <p className="text-sm">{customer.email}</p>
              <Badge variant={customer.isActive ? "default" : "secondary"}>
                {customer.isActive ? "Đang hoạt động" : "Đã khóa"}
              </Badge>
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Số điện thoại:</span>
                <span>{customer.profile?.phoneNumber || "Chưa cập nhật"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Địa chỉ:</span>
                <span className="text-right">{customer.profile?.address || "Chưa cập nhật"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ngày tham gia:</span>
                <span>{new Date(customer.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Thống kê</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
                  <p className="text-2xl font-bold">{customer.totalOrders || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng chi tiêu</p>
                  <p className="text-2xl font-bold">
                    {customer.totalSpent ? customer.totalSpent.toLocaleString("vi-VN") + "₫" : "0₫"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đánh giá</p>
                  <p className="text-2xl font-bold">{customer.totalReviews || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giỏ hàng</p>
                  <p className="text-2xl font-bold">{customer.totalCartItems || 0} sản phẩm</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      {customer.recentOrders && customer.recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Đơn hàng gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.recentOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <Link to={`/admin/orders/${order.id}`} className="hover:underline">
                        #{order.id}
                      </Link>
                    </TableCell>
                      <TableCell>
                      {order.items && order.items.length > 0 ? (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const firstItem = order.items[0];
                            const imageUrl = firstItem.mainImage || 
                                           firstItem.productVariant?.product?.images?.[0]?.fullUrl ||
                                           firstItem.productVariant?.product?.images?.[0]?.url;
                            
                            return imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={firstItem.productVariant?.product?.name || "Sản phẩm"}
                                className="h-10 w-10 rounded object-cover border"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                        ) : (
                              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">N/A</span>
                              </div>
                            );
                          })()}
                          <div>
                            <div className="text-sm font-medium">
                              {order.items[0].productVariant?.product?.name || "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {order.items.length} {order.items.length === 1 ? 'sản phẩm' : 'sản phẩm'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        "-"
                        )}
                      </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.amount?.toLocaleString("vi-VN")}₫
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link to={`/admin/orders/${order.id}`}>
                        <Button size="sm" variant="secondary">
                          Xem chi tiết
                        </Button>
                      </Link>
                    </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
