"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { UploadZone } from "@/components/dashboard/UploadZone";
import { ImageGrid } from "@/components/dashboard/ImageGrid";
import { useUploadStore } from "@/store/useUploadStore";
import { useAlbumStore } from "@/store/useAlbumStore";
import {
  ALBUM_ALL_ID,
  ALBUM_TRASH_ID,
  MediaItem,
  MediaQueryParams,
} from "@/types/image.types";
import { useMedia } from "@/hooks/useMedia";
import { FilterBar, FilterOption } from "@/components/dashboard/FilterBar";
import { AlbumSidebar } from "@/components/dashboard/AlbumSidebar";
import { applyMediaOverrides, filterVisibleMedia } from "@/utils/mergeMedia";

const DEFAULT_FILTERS: {
  search: string;
  albumId: string;
  sortBy: Required<MediaQueryParams>["sortBy"];
} = {
  search: "",
  albumId: ALBUM_ALL_ID,
  sortBy: "date-desc",
};

function mapQueueToMediaItems(
  queue: ReturnType<typeof useUploadStore.getState>["queue"],
): MediaItem[] {
  return queue.map((item) => ({
    id: item.id,
    name: item.fileName,
    albumId: "uploads",
    createdAt: new Date(item.originalFile.lastModified).toISOString(),
    fileSize: item.processedSize,
    originalSize: item.originalSize,
    mimeType: item.mimeType,
    previewUrl: item.previewUrl,
    isDeleted: false,
  }));
}

function sortMediaItems(
  items: MediaItem[],
  sortBy: MediaQueryParams["sortBy"],
): MediaItem[] {
  const sorted = [...items];
  switch (sortBy) {
    case "date-asc":
      return sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case "date-desc":
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case "size-asc":
      return sorted.sort((a, b) => a.fileSize - b.fileSize);
    case "size-desc":
      return sorted.sort((a, b) => b.fileSize - a.fileSize);
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted;
  }
}

interface DashboardClientProps {
  userId: string;
}

export function DashboardClient({ userId }: DashboardClientProps): JSX.Element {
  const queue = useUploadStore((state) => state.queue);
  const mediaOverrides = useAlbumStore((state) => state.mediaOverrides);
  const albums = useAlbumStore((state) => state.albums);
  const setActiveAlbum = useAlbumStore((state) => state.setActiveAlbum);
  const fetchAlbums = useAlbumStore((state) => state.fetchAlbums);
  const activeAlbumId = useAlbumStore((state) => state.activeAlbumId);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const brokenMediaIdsRef = useRef<Set<string>>(new Set());
  const [renderTrigger, setRenderTrigger] = useState(0);
  const deletedMediaIds = useAlbumStore((state) => state.deletedMediaIds);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  useEffect(() => {
    // Chỉ cập nhật nếu thực sự có sự khác biệt để tránh loop
    if (activeAlbumId !== filters.albumId) {
      setFilters((prev) => ({ ...prev, albumId: activeAlbumId }));
    }
  }, [activeAlbumId]); // Chỉ phụ thuộc vào Store thay đổi

  // Khi filter local thay đổi (người dùng click vào UI filter), cập nhật ngược lại vào Store
  useEffect(() => {
    if (filters.albumId !== activeAlbumId) {
      setActiveAlbum(filters.albumId);
    }
  }, [filters.albumId, setActiveAlbum]);

  // Luôn lấy toàn bộ danh sách làm trục dữ liệu đối sánh cho Client xử lý phân vùng hiển thị
  const queryFilters = useMemo(
    () => ({
      ...filters,
      albumId: ALBUM_ALL_ID,
    }),
    [filters.search, filters.sortBy],
  );

  const {
    mediaItems: cachedMedia,
    isLoading,
    isError,
    errorMessage,
  } = useMedia({ ...queryFilters, userId });

  const queuedItems = useMemo(() => mapQueueToMediaItems(queue), [queue]);

  const handleMediaLoadError = useCallback((id: string) => {
    if (!brokenMediaIdsRef.current.has(id)) {
      brokenMediaIdsRef.current.add(id);
      setRenderTrigger((prev) => prev + 1);
    }
  }, []);

  const baseMergedMedia = useMemo(() => {
    const mediaMap = new Map<string, MediaItem>();

    cachedMedia.forEach((item) => {
      mediaMap.set(item.id, item);
    });

    queuedItems.forEach((item) => {
      mediaMap.set(item.id, item);
    });

    return Array.from(mediaMap.values());
  }, [cachedMedia, queuedItems]);

  // 🎯 BỘ LỌC ĐA KỊCH BẢN CHUẨN SENIOR (Xử lý dứt điểm rác và phân tách album)
  const mergedMedia = useMemo(() => {
    const combined = applyMediaOverrides(baseMergedMedia, mediaOverrides);

    const clientFiltered = combined.filter((item) => {
      if (deletedMediaIds.includes(item.id)) return false;
      // Logic: Nếu ảnh đã nằm trong Trash (do override hoặc DB gốc)
      if (item.isDeleted) {
        return filters.albumId === ALBUM_TRASH_ID;
      }

      // Nếu ảnh không nằm trong Trash:
      // Nếu user đang xem Trash -> Loại bỏ ảnh này
      if (filters.albumId === ALBUM_TRASH_ID) return false;

      // Nếu user đang xem "All", hiển thị tất cả ảnh không bị xóa
      if (filters.albumId === ALBUM_ALL_ID) return true;

      // Nếu user đang xem album cụ thể
      return item.albumId === filters.albumId;
    });

    // Thực thi tiếp bộ lọc tìm kiếm text (Nếu có)
    const searchFiltered = filterVisibleMedia(clientFiltered, {
      albumId: filters.albumId,
      search: filters.search,
    });

    const cleanVisible = searchFiltered.filter(
      (item) => !brokenMediaIdsRef.current.has(item.id),
    );

    return sortMediaItems(cleanVisible, filters.sortBy);
  }, [
    baseMergedMedia,
    filters.albumId,
    filters.search,
    filters.sortBy,
    mediaOverrides,
    renderTrigger,
  ]);

  const allMediaForSidebar = useMemo(() => {
    const combined = applyMediaOverrides(baseMergedMedia, mediaOverrides);
    return combined.filter(
      (item) =>
        !brokenMediaIdsRef.current.has(item.id) &&
        !deletedMediaIds.includes(item.id),
    );
  }, [baseMergedMedia, mediaOverrides, renderTrigger, deletedMediaIds]);

  const albumOptions = useMemo<FilterOption[]>(
    () => [
      { id: ALBUM_ALL_ID, label: "All Albums" },
      ...albums
        .filter((album) => album.id !== "trash")
        .map((album) => ({ id: album.id, label: album.name })),
    ],
    [albums],
  );

  const handleSidebarAlbumSelect = useCallback((albumId: string) => {
    setFilters((prev) => ({ ...prev, albumId }));
  }, []);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <AlbumSidebar
        allMedia={allMediaForSidebar}
        onAlbumSelect={handleSidebarAlbumSelect}
      />

      <div className="min-w-0 flex-1 space-y-4">
        <UploadZone userId={userId} />

        <FilterBar
          filters={filters}
          albumOptions={albumOptions}
          onFiltersChange={setFilters}
        />

        <section className="rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2.5 text-sm text-slate-300 sm:px-4 sm:py-3">
          {isLoading ? <p>Loading media library…</p> : null}
          {isError ? (
            <p className="text-rose-300">
              Failed to load media: {errorMessage ?? "Unknown error"}
            </p>
          ) : null}
          {!isLoading && !isError ? (
            <p>
              Library: {allMediaForSidebar.length} item(s) · Showing{" "}
              {mergedMedia.length} in view.
            </p>
          ) : null}
        </section>

        <ImageGrid
          items={mergedMedia}
          onMediaLoadError={handleMediaLoadError}
          currentAlbumId={filters.albumId}
        />
      </div>
    </div>
  );
}
