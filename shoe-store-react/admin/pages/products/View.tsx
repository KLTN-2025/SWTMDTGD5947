import { useNavigate, useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminProduct } from "../../lib/use-admin-products";
import { Package } from "lucide-react";

export default function ProductView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { product, loading } = useAdminProduct(Number(id));

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

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không tìm thấy sản phẩm</p>
        <Button onClick={() => nav("/admin/products")} className="mt-4">Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chi tiết sản phẩm</h1>
          <p className="text-gray-600">Xem thông tin chi tiết và quản lý sản phẩm</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/products/${product.id}`}>
            <Button>Chỉnh sửa</Button>
          </Link>
          <Button variant="outline" onClick={() => nav("/admin/products")}>
            Quay lại
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{product.name}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">SKU: {product.skuId}</p>
              </div>
              <Badge variant={
                product.status === 'SOLD_OUT' ? "destructive" :
                product.quantity < 10 ? "secondary" : "outline"
              }>
                {product.status === 'SOLD_OUT' ? "Hết hàng" :
                 product.status === 'PRE_SALE' ? "Đặt trước" : "Còn hàng"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Images */}
            {product.images && product.images.length > 0 ? (
              <div>
                <h3 className="font-semibold mb-3">Hình ảnh sản phẩm</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.images.map((img) => (
                    <img
                      key={img.id}
                      src={`http://localhost:8009/${img.url}`}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Chưa có hình ảnh</p>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Mô tả</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Details Table */}
            <div>
              <h3 className="font-semibold mb-3">Thông tin chi tiết</h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium w-1/3">Mã SKU</TableCell>
                    <TableCell>{product.skuId}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Giá bán</TableCell>
                    <TableCell className="text-lg font-semibold text-blue-600">
                      {product.basePrice.toLocaleString("vi-VN")}₫
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Số lượng tồn kho</TableCell>
                    <TableCell>
                      <span className={product.quantity < 10 ? "text-red-600 font-semibold" : ""}>
                        {product.quantity} sản phẩm
                      </span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Trạng thái</TableCell>
                    <TableCell>
                      <Badge variant={
                        product.status === 'SOLD_OUT' ? "destructive" :
                        product.quantity < 10 ? "secondary" : "outline"
                      }>
                        {product.status === 'SOLD_OUT' ? "Hết hàng" :
                         product.status === 'PRE_SALE' ? "Đặt trước" : "Còn hàng"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Danh mục</TableCell>
                    <TableCell>
                      {product.categories && product.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {product.categories.map((cat) => (
                            <Badge key={cat.id} variant="outline">{cat.name}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Ngày tạo</TableCell>
                    <TableCell>
                      {new Date(product.createdAt).toLocaleString("vi-VN")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Cập nhật lần cuối</TableCell>
                    <TableCell>
                      {new Date(product.updatedAt).toLocaleString("vi-VN")}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Actions Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hành động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={`/admin/products/${product.id}`}>
                <Button className="w-full">Chỉnh sửa sản phẩm</Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => nav("/admin/products")}
              >
                Về danh sách
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thống kê nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Tổng giá trị kho</p>
                <p className="text-xl font-bold">
                  {(product.basePrice * product.quantity).toLocaleString("vi-VN")}₫
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Số lượng ảnh</p>
                <p className="text-xl font-bold">{product.images?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Số danh mục</p>
                <p className="text-xl font-bold">{product.categories?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
