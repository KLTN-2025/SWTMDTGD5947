import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { useCustomers } from "../lib/use-customers";
import { customerApi } from "../lib/admin-api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [minSpent, setMinSpent] = useState<string>("");
  const [maxSpent, setMaxSpent] = useState<string>("");
  const [minOrders, setMinOrders] = useState<string>("");
  const [maxOrders, setMaxOrders] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(1);
  
  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);
  
  // Memoize params to prevent creating new object on every render
  const params = useMemo(() => ({
    search: debouncedSearch || undefined,
    is_active: isActive,
    min_spent: minSpent ? parseFloat(minSpent) : undefined,
    max_spent: maxSpent ? parseFloat(maxSpent) : undefined,
    min_orders: minOrders ? parseInt(minOrders) : undefined,
    max_orders: maxOrders ? parseInt(maxOrders) : undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    per_page: 15,
    page: page,
  }), [debouncedSearch, isActive, minSpent, maxSpent, minOrders, maxOrders, sortBy, sortOrder, page]);
  
  const { customers, loading, pagination, refetch } = useCustomers(params);

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
      return;
    }

    try {
      await customerApi.deleteCustomer(id);
      toast.success("Xóa khách hàng thành công");
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Xóa khách hàng thất bại");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setIsActive(undefined);
    setMinSpent("");
    setMaxSpent("");
    setMinOrders("");
    setMaxOrders("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters = isActive !== undefined || minSpent || maxSpent || minOrders || maxOrders || sortBy !== "createdAt" || sortOrder !== "desc";

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground" />;
    }
    return sortOrder === "asc" 
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Khách hàng</h1>
          <p className="text-muted-foreground">Danh sách, chỉnh sửa, xóa khách hàng</p>
        </div>
        <Link to="/admin/customers/new">
          <Button>Thêm khách hàng</Button>
        </Link>
      </div>

      {/* Search and Basic Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Tìm kiếm và lọc</CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Xóa bộ lọc
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="w-4 h-4 mr-1" />
                Bộ lọc nâng cao
                {showAdvancedFilters ? (
                  <ChevronUp className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={isActive === undefined ? "default" : "outline"}
                onClick={() => setIsActive(undefined)}
              >
                Tất cả
              </Button>
              <Button
                variant={isActive === true ? "default" : "outline"}
                onClick={() => setIsActive(true)}
              >
                Đang hoạt động
              </Button>
              <Button
                variant={isActive === false ? "default" : "outline"}
                onClick={() => setIsActive(false)}
              >
                Đã khóa
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sắp xếp:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Ngày tạo</SelectItem>
                  <SelectItem value="name">Tên</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="totalSpent">Tổng chi tiêu</SelectItem>
                  <SelectItem value="totalOrders">Số đơn hàng</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tổng chi tiêu tối thiểu (₫)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minSpent}
                  onChange={(e) => {
                    setMinSpent(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tổng chi tiêu tối đa (₫)</label>
                <Input
                  type="number"
                  placeholder="Không giới hạn"
                  value={maxSpent}
                  onChange={(e) => {
                    setMaxSpent(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Số đơn hàng tối thiểu</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minOrders}
                  onChange={(e) => {
                    setMinOrders(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Số đơn hàng tối đa</label>
                <Input
                  type="number"
                  placeholder="Không giới hạn"
                  value={maxOrders}
                  onChange={(e) => {
                    setMaxOrders(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center hover:text-foreground"
                  >
                    Khách hàng
                    {getSortIcon("name")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("email")}
                    className="flex items-center hover:text-foreground"
                  >
                    Email
                    {getSortIcon("email")}
                  </button>
                </TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("totalOrders")}
                    className="flex items-center hover:text-foreground"
                  >
                    Đơn hàng
                    {getSortIcon("totalOrders")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("totalSpent")}
                    className="flex items-center hover:text-foreground"
                  >
                    Chi tiêu
                    {getSortIcon("totalSpent")}
                  </button>
                </TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Không có khách hàng nào
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {customer.fullImageUrl || customer.imageUrl ? (
                          <img
                            src={customer.fullImageUrl || customer.imageUrl}
                            alt={customer.name}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-muted-foreground">@{customer.userName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.profile?.phoneNumber || "-"}
                    </TableCell>
                    <TableCell>{customer.totalOrders || 0}</TableCell>
                    <TableCell className="font-medium">
                      {customer.totalSpent ? customer.totalSpent.toLocaleString("vi-VN") + "₫" : "0₫"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.isActive ? "default" : "secondary"}>
                        {customer.isActive ? "Đang hoạt động" : "Đã khóa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link to={`/admin/customers/${customer.id}/view`}>
                        <Button size="sm" variant="secondary">
                          Xem
                        </Button>
                      </Link>
                      <Link to={`/admin/customers/${customer.id}`}>
                        <Button size="sm">Sửa</Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {pagination.from} - {pagination.to} trong tổng số {pagination.total} khách hàng
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              Trước
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                let pageNum;
                if (pagination.last_page <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= pagination.last_page - 2) {
                  pageNum = pagination.last_page - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.last_page}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
