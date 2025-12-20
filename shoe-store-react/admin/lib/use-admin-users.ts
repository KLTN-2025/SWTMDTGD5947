import { useState, useEffect, useCallback } from 'react';
import { adminUserApi, AdminUser, CreateUserRequest, UpdateUserRequest, UserRole } from './admin-api';
import { toast } from 'sonner';
import { getErrorMessage } from './error-handler';

export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users
  const fetchUsers = useCallback(async (params?: Record<string, string>) => {
    try {
      setLoading(true);
      setError(null);
      const response = params 
        ? await adminUserApi.searchUsers(params)
        : await adminUserApi.getUsers();
      if (response.data) {
        // Laravel returns { users: [], pagination: {} }
        const data: any = response.data;
        if (Array.isArray(data)) {
          setUsers(data);
          setPagination(null);
        } else if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        } else {
          setUsers([]);
          setPagination(null);
        }
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể tải danh sách người dùng');
      setError(errorMsg);
      toast.error(errorMsg);
      setUsers([]); // Set empty array on error
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search users
  const searchUsers = useCallback(async (params: Record<string, string>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminUserApi.searchUsers(params);
      if (response.data) {
        // Handle both array and object responses
        const data: any = response.data;
        if (Array.isArray(data)) {
          setUsers(data);
          setPagination(null);
        } else if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        } else {
          setUsers([]);
          setPagination(null);
        }
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể tìm kiếm người dùng');
      setError(errorMsg);
      toast.error(errorMsg);
      setUsers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create user
  const createUser = useCallback(async (data: CreateUserRequest) => {
    try {
      const response = await adminUserApi.createUser(data);
      if (response.data) {
        setUsers(prev => [...prev, response.data!]);
        toast.success('Tạo người dùng thành công');
        return response.data;
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể tạo người dùng');
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Update user
  const updateUser = useCallback(async (id: number, data: UpdateUserRequest) => {
    try {
      const response = await adminUserApi.updateUser(id, data);
      if (response.data) {
        setUsers(prev => prev.map(u => u.id === id ? response.data! : u));
        toast.success('Cập nhật người dùng thành công');
        return response.data;
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể cập nhật người dùng');
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (id: number) => {
    try {
      await adminUserApi.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('Xóa người dùng thành công');
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể xóa người dùng');
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    pagination,
    loading,
    error,
    fetchUsers,
    searchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}

// Hook for single user
export function useAdminUser(id: number | null) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await adminUserApi.getUser(id);
      console.log('🔍 Raw API response:', response);
      console.log('🔍 Response.data:', response.data);
      if (response.data) {
        setUser(response.data);
        console.log('✅ User set in hook:', response.data);
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể tải thông tin người dùng');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id, fetchUser]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
  };
}

// Hook for roles
export function useRoles() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminUserApi.getRoles();
      if (response.data) {
        const data: any = response.data;
        if (Array.isArray(data)) {
          setRoles(data);
        } else if (data.roles && Array.isArray(data.roles)) {
          setRoles(data.roles);
        } else {
          setRoles([]);
        }
      }
    } catch (err: any) {
      const errorMsg = getErrorMessage(err, 'Không thể tải danh sách vai trò');
      setError(errorMsg);
      toast.error(errorMsg);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    error,
    refetch: fetchRoles,
  };
}
