/**
 * ERROR HANDLING EXAMPLES
 * 
 * Các ví dụ thực tế về cách xử lý lỗi trong admin panel
 */

import { toast } from 'sonner';
import { getErrorMessaggetErrorCode, isErrorCode } from './error-handler';
import { adminUserApi } from './admin-api';

// ============================================================================
// EXAMPLE 1: Basic Error Handling
// ============================================================================

async function deleteUserBasic(userId: number) {
  try {
    await adminUserApi.deleteUser(userId);
    toast.success('Xóa người dùng thành công');
  } catch (error) {
    // Sử dụng helper function - RECOMMENDED
    toast.error(getErrorMessage(error, 'Xóa người dùng thất bại'));
  }
}

// ============================================================================
// EXAMPLE 2: Handling Specific Error Codes
// ============================================================================

async function deleteUserWithCodeCheck(userId: number) {
  try {
    await adminUserApi.deleteUser(userId);
    toast.success('Xóa người dùng thành công');
  } catch (error) {
    // Kiểm tra error code cụ thể
    if (isErrorCode(error, 'CANNOT_DELETE_SELF')) {
      toast.warning('Bạn không thể xóa chính mình');
    } else if (isErrorCode(error, 'USER_HAS_ORDERS')) {
      toast.error('Không thể xóa người dùng đã có đơn hàng');
    } else {
      toast.error(getErrorMessage(error, 'Xóa người dùng thất bại'));
    }
  }
}

// ============================================================================
// EXAMPLE 3: React Query Mutation with Error Handling
// ============================================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';

function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: number) => {
      return await adminUserApi.deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Xóa người dùng thành công');
    },
    onError: (error) => {
      // Xử lý lỗi với helper function
      if (isErrorCode(error, 'CANNOT_DELETE_SELF')) {
        toast.warning(getErrorMessage(error, 'Không thể xóa'));
      } else {
        toast.error(getErrorMessage(error, 'Xóa người dùng thất bại'));
      }
    },
  });
}

// ============================================================================
// EXAMPLE 4: Form Submission with Validation Errors
// ============================================================================

import { ApiError } from '@/lib/api-client';

async function createUserWithValidation(formData: any) {
  try {
    const response = await adminUserApi.createUser(formData);
    toast.success('Tạo người dùng thành công');
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      // Xử lý validation errors
      const validationErrors = error.getValidationErrors();
      if (validationErrors) {
        // Hiển thị từng lỗi validation
        Object.entries(validationErrors).forEach(([field, messages]) => {
          toast.error(`${field}: ${messages.join(', ')}`);
        });
        return;
      }
    }
    
    // Lỗi khác
    toast.error(getErrorMessage(error, 'Tạo người dùng thất bại'));
  }
}

// ============================================================================
// EXAMPLE 5: Multiple Error Codes Handling
// ============================================================================

async function updateOrderStatus(orderId: number, status: string) {
  try {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    toast.success('Cập nhật trạng thái thành công');
  } catch (error) {
    const errorCode = getErrorCode(error);
    
    switch (errorCode) {
      case 'SAME_STATUS':
        toast.info('Trạng thái không thay đổi');
        break;
      case 'INVALID_STATUS_TRANSITION':
        toast.error('Không thể chuyển sang trạng thái này');
        break;
      case 'ORDER_ALREADY_CANCELLED':
        toast.warning('Đơn hàng đã bị hủy');
        break;
      default:
        toast.error(getErrorMessage(error, 'Cập nhật trạng thái thất bại'));
    }
  }
}

// ============================================================================
// EXAMPLE 6: Component with Error State
// ============================================================================

import { useState } from 'react';

function DeleteUserButton({ userId }: { userId: number }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await adminUserApi.deleteUser(userId);
      toast.success('Xóa người dùng thành công');
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Xóa người dùng thất bại');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <button onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? 'Đang xóa...' : 'Xóa'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Async/Await with Try-Catch in useEffect
// ============================================================================

import { useEffect } from 'react';

function UserDetailPage({ userId }: { userId: number }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await adminUserApi.getUser(userId);
        setUser(response.data);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Không thể tải thông tin người dùng'));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Không tìm thấy người dùng</div>;

  return <div>{/* Render user details */}</div>;
}

// ============================================================================
// ANTI-PATTERNS - KHÔNG NÊN LÀM
// ============================================================================

// ❌ DON'T: Truy cập trực tiếp nested structure
async function deleteUserBad1(userId: number) {
  try {
    await adminUserApi.deleteUser(userId);
  } catch (error: any) {
    // ❌ Không nên - cấu trúc có thể thay đổi
    toast.error(error?.response?.data?.message || 'Lỗi');
  }
}

// ❌ DON'T: Không xử lý lỗi
async function deleteUserBad2(userId: number) {
  // ❌ Không có try-catch - lỗi sẽ không được xử lý
  await adminUserApi.deleteUser(userId);
}

// ❌ DON'T: Catch nhưng không làm gì
async function deleteUserBad3(userId: number) {
  try {
    await adminUserApi.deleteUser(userId);
  } catch (error) {
    // ❌ Catch nhưng không xử lý - người dùng không biết có lỗi
    console.error(error);
  }
}

// ❌ DON'T: Hardcode message nhiều nơi
async function deleteUserBad4(userId: number) {
  try {
    await adminUserApi.deleteUser(userId);
  } catch (error: any) {
    // ❌ Hardcode message - khó maintain
    toast.error('Xóa người dùng thất bại. Vui lòng thử lại sau.');
  }
}

