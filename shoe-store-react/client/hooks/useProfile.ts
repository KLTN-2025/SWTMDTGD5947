import { useState, useEffect, useCallback } from 'react';
import { profileApi, ProfileData, UpdateProfileRequest, ChangePasswordRequest } from '@/lib/profile-api';
import { ApiError } from '@/lib/api-client';
import { toast } from 'sonner';

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await profileApi.getProfile();
      if (response.data) {
        setProfile(response.data);
      }
    } catch (err: any) {
      const errorMsg = err instanceof ApiError ? err.message : 'Không thể tải thông tin cá nhân';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    try {
      const response = await profileApi.updateProfile(data);
      if (response.data) {
        setProfile(response.data);
        toast.success('Cập nhật thông tin thành công');
        return response.data;
      }
    } catch (err: any) {
      const errorMsg = err instanceof ApiError ? err.message : 'Không thể cập nhật thông tin';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (data: ChangePasswordRequest) => {
    try {
      await profileApi.changePassword(data);
      toast.success('Đổi mật khẩu thành công');
    } catch (err: any) {
      const errorMsg = err instanceof ApiError ? err.message : 'Không thể đổi mật khẩu';
      toast.error(errorMsg);
      throw err;
    }
  }, []);

  // Load profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    changePassword,
  };
}
