"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { MediaItem, MediaQueryParams } from "@/types/image.types";

const MEDIA_QUERY_KEY = "media";

export interface UseMediaResult {
  mediaItems: MediaItem[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errorMessage: string | null;
  refetch: () => Promise<unknown>;
}

// Hàm fetch dữ liệu thật từ API Route của Next.js thay thế cho mock API cũ
async function fetchRealMedia(
  params: Required<MediaQueryParams>,
): Promise<{ items: MediaItem[]; total: number }> {
  // Tạo Query Parameters để đính kèm vào URL
  const searchParams = new URLSearchParams({
    search: params.search,
    albumId: params.albumId,
    sortBy: params.sortBy,
    userId: params.userId ?? "", // 🎯 Đính kèm userId lên Backend
  });

  const res = await fetch(`/api/media?${searchParams.toString()}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error || "Không thể tải danh sách hình ảnh từ server",
    );
  }

  return res.json();
}

export function useMedia(params: MediaQueryParams = {}): UseMediaResult {
  // Chuẩn hóa params và đưa userId vào dependency array của useMemo
  const normalizedParams = useMemo<Required<MediaQueryParams>>(
    () => ({
      search: params.search?.trim() ?? "",
      albumId: params.albumId?.trim() ?? "all",
      sortBy: params.sortBy ?? "date-desc",
      userId: params.userId?.trim() ?? "", // 🎯 Chuẩn hóa userId
    }),
    [params.albumId, params.search, params.sortBy, params.userId],
  );

  const query = useQuery({
    // 🎯 Thêm normalizedParams vào queryKey giúp React Query tự động
    // re-fetch ảnh mới ngay lập tức khi user chuyển đổi Album, tìm kiếm hoặc khi userId thay đổi
    queryKey: [MEDIA_QUERY_KEY, normalizedParams],
    queryFn: () => fetchRealMedia(normalizedParams),
    staleTime: 2 * 60_000, // Cache dữ liệu tạm thời trong 2 phút
    gcTime: 10 * 60_000, // Giữ dữ liệu trong bộ nhớ rác 10 phút trước khi xóa hẳn
    placeholderData: keepPreviousData, // Giữ lại giao diện ảnh cũ trong lúc đang tải ảnh mới (tránh bị giật màn hình)
  });

  return {
    mediaItems: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    errorMessage: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
