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

// 🎯 Cập nhật params type để chấp nhận phân trang
interface ExtendedMediaParams extends MediaQueryParams {
  page?: number;
  limit?: number;
}

async function fetchRealMedia(
  params: Required<ExtendedMediaParams>,
): Promise<{ items: MediaItem[]; total: number }> {
  const searchParams = new URLSearchParams({
    search: params.search,
    albumId: params.albumId,
    sortBy: params.sortBy,
    userId: params.userId ?? "",
    page: params.page.toString(), // 🎯 Gửi page lên backend
    limit: params.limit.toString(), // 🎯 Gửi limit lên backend
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

export function useMedia(params: ExtendedMediaParams = {}): UseMediaResult {
  // 🎯 Chuẩn hóa tất cả tham số, bao gồm page/limit để React Query track
  const normalizedParams = useMemo<Required<ExtendedMediaParams>>(
    () => ({
      search: params.search?.trim() ?? "",
      albumId: params.albumId?.trim() ?? "all",
      sortBy: params.sortBy ?? "date-desc",
      userId: params.userId?.trim() ?? "",
      page: params.page ?? 1, // Mặc định trang 1
      limit: params.limit ?? 50, // Mặc định lấy 50 items
    }),
    [
      params.albumId,
      params.search,
      params.sortBy,
      params.userId,
      params.page,
      params.limit,
    ],
  );

  const query = useQuery({
    queryKey: [MEDIA_QUERY_KEY, normalizedParams],
    queryFn: () => fetchRealMedia(normalizedParams),
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
    // 🎯 keepPreviousData giúp UI không bị flash khi chuyển trang
    placeholderData: keepPreviousData,
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
