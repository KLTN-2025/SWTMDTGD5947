import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  adminChatBoxApi,
  ChatBoxDetailResponse,
  ChatBoxListResponse,
  ChatBoxSummary,
  ChatBoxStats,
} from './admin-api';
import { toast } from 'sonner';
import { getErrorMessage } from './error-handler';

interface ConversationFilters {
  search?: string;
  mode?: string;
  per_page?: number;
  page?: number;
}

export function useAdminChatConversations(filters?: ConversationFilters) {
  const [chatBoxes, setChatBoxes] = useState<ChatBoxSummary[]>([]);
  const [stats, setStats] = useState<ChatBoxStats | null>(null);
  const [pagination, setPagination] = useState<ChatBoxListResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const memoizedFilters = useMemo(() => filters, [
    filters?.search,
    filters?.mode,
    filters?.per_page,
    filters?.page,
  ]);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminChatBoxApi.getConversations(memoizedFilters);
      if (response.data) {
        const data = response.data;
        setChatBoxes(data.chatBoxes || []);
        setStats(data.stats || null);
        setPagination(data.pagination || null);
      }
    } catch (err: any) {
      const message = getErrorMessage(err, 'Không thể tải danh sách chatbox');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    chatBoxes,
    stats,
    pagination,
    loading,
    error,
    refetch: fetchConversations,
  };
}

export function useAdminChatConversationDetail(chatBoxId?: number | string | null) {
  const [detail, setDetail] = useState<ChatBoxDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!chatBoxId) {
      setDetail(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await adminChatBoxApi.getConversation(Number(chatBoxId));
      if (response.data) {
        setDetail(response.data);
      }
    } catch (err: any) {
      const message = getErrorMessage(err, 'Không thể tải chi tiết cuộc trò chuyện');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [chatBoxId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    detail,
    loading,
    error,
    refetch: fetchDetail,
  };
}

