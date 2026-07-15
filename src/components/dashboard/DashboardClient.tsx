"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { UploadZone } from "@/components/dashboard/UploadZone";
import { ImageGrid } from "@/components/dashboard/ImageGrid";
import { useUploadStore } from "@/store/useUploadStore";
import { useAlbumStore } from "@/store/useAlbumStore";
import { useMediaStore } from "@/store/useMediaStore";
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
  const queue = useUploadStore((s) => s.queue);

  // ── Album store (albums + navigation) ──
  const albums = useAlbumStore((s) => s.albums);
  const activeAlbumId = useAlbumStore((s) => s.activeAlbumId);
  const setActiveAlbum = useAlbumStore((s) => s.setActiveAlbum);
  const fetchAlbums = useAlbumStore((s) => s.fetchAlbums);

  // ── Media store (overrides + deleted ids) ──
  const mediaOverrides = useMediaStore((s) => s.mediaOverrides);
  const deletedMediaIds = useMediaStore((s) => s.deletedMediaIds);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const brokenMediaIdsRef = useRef<Set<string>>(new Set());
  const [renderTrigger, setRenderTrigger] = useState(0);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  // Sync store → local filters (sidebar click)
  useEffect(() => {
    if (activeAlbumId !== filters.albumId) {
      setFilters((prev) => ({ ...prev, albumId: activeAlbumId }));
    }
  }, [activeAlbumId]);

  // Sync local filters → store (FilterBar change)
  useEffect(() => {
    if (filters.albumId !== activeAlbumId) {
      setActiveAlbum(filters.albumId);
    }
  }, [filters.albumId, setActiveAlbum]);

  const queryFilters = useMemo(
    () => ({ ...filters, albumId: ALBUM_ALL_ID, page }),
    [filters.search, filters.sortBy, page],
  );

  const {
    mediaItems: cachedMedia,
    total,
    isLoading,
    isError,
    errorMessage,
  } = useMedia({ ...queryFilters, userId, page, limit: 50 });

  const hasMore = total > page * 50;

  const queuedItems = useMemo(() => mapQueueToMediaItems(queue), [queue]);

  const handleMediaLoadError = useCallback((id: string) => {
    if (!brokenMediaIdsRef.current.has(id)) {
      brokenMediaIdsRef.current.add(id);
      setRenderTrigger((prev) => prev + 1);
    }
  }, []);

  const baseMergedMedia = useMemo(() => {
    const map = new Map<string, MediaItem>();
    cachedMedia.forEach((item) => map.set(item.id, item));
    queuedItems.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  }, [cachedMedia, queuedItems]);

  const mergedMedia = useMemo(() => {
    const combined = applyMediaOverrides(baseMergedMedia, mediaOverrides);

    const clientFiltered = combined.filter((item) => {
      if (deletedMediaIds.includes(item.id)) return false;
      if (item.isDeleted) return filters.albumId === ALBUM_TRASH_ID;
      if (filters.albumId === ALBUM_TRASH_ID) return false;
      if (filters.albumId === ALBUM_ALL_ID) return true;
      return item.albumId === filters.albumId;
    });

    const searchFiltered = filterVisibleMedia(clientFiltered, {
      albumId: filters.albumId,
      search: filters.search,
    });

    return sortMediaItems(
      searchFiltered.filter((item) => !brokenMediaIdsRef.current.has(item.id)),
      filters.sortBy,
    );
  }, [
    baseMergedMedia,
    filters.albumId,
    filters.search,
    filters.sortBy,
    mediaOverrides,
    deletedMediaIds,
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
        .filter((a) => a.id !== "trash")
        .map((a) => ({ id: a.id, label: a.name })),
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
          {isLoading && <p>Loading media library…</p>}
          {isError && (
            <p className="text-rose-300">
              Failed to load media: {errorMessage ?? "Unknown error"}
            </p>
          )}
          {!isLoading && !isError && (
            <p>
              Library: {allMediaForSidebar.length} item(s) · Showing{" "}
              {mergedMedia.length} in view.
            </p>
          )}
        </section>

        <ImageGrid
          items={mergedMedia}
          onMediaLoadError={handleMediaLoadError}
          currentAlbumId={filters.albumId}
        />

        {hasMore && (
          <div className="flex justify-center p-6">
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={isLoading}
              className="rounded-full border border-slate-700 bg-slate-900 px-6 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {isLoading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
