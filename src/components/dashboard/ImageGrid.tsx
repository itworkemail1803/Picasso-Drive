"use client";

import { memo, MouseEvent, useCallback, useMemo, useState } from "react";
import { MediaItem, ALBUM_TRASH_ID } from "@/types/image.types"; // Đảm bảo import ALBUM_TRASH_ID
import { ImageGridItem } from "@/components/dashboard/image-grid/ImageGridItem";
import { MediaLightbox } from "@/components/dashboard/lightbox/MediaLightbox";
import { useAlbumStore } from "@/store/useAlbumStore";

interface ImageGridProps {
  items: MediaItem[];
  onMediaLoadError: (id: string) => void; // 🎯 Khai báo Prop nhận callback báo lỗi từ cha
  currentAlbumId?: string; // 🎯 Thêm prop này để biết đang ở album nào
}

const EmptyState = memo(function EmptyState(): JSX.Element {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/20 p-6 text-center sm:p-8">
      <p className="text-sm text-slate-400">
        No images in this album. Upload or drag images into an album.
      </p>
    </div>
  );
});

export function ImageGrid({
  items,
  onMediaLoadError,
  currentAlbumId,
}: ImageGridProps): JSX.Element {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);

  const restoreMedia = useAlbumStore((state) => state.restoreMedia);
  const permanentlyDeleteMedia = useAlbumStore(
    (state) => state.permanentlyDeleteMedia,
  );

  const isTrash = currentAlbumId === ALBUM_TRASH_ID;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const dragPayloadIds = useMemo(() => {
    return selectedIds.length === 0 ? [] : selectedIds;
  }, [selectedIds]);

  const handleSelect = useCallback(
    (id: string, event: MouseEvent<HTMLButtonElement>) => {
      console.log("Clicked ID:", id); // 🎯 Thêm dòng này
      const isMulti = event.metaKey || event.ctrlKey;
      setSelectedIds((prev) => {
        const next = !isMulti
          ? prev.length === 1 && prev[0] === id
            ? []
            : [id]
          : prev.includes(id)
            ? prev.filter((sid) => sid !== id)
            : [...prev, id];

        console.log("Updated SelectedIds:", next); // 🎯 Thêm dòng này
        return next;
      });
    },
    [],
  );

  // 🎯 Xử lý hành động Thùng rác
  const handleRestore = async () => {
    await restoreMedia(selectedIds);
    setSelectedIds([]);
  };

  const handlePermanentDelete = async () => {
    if (confirm("Are you sure? This action cannot be undone.")) {
      await permanentlyDeleteMedia(selectedIds);
      setSelectedIds([]);
    }
  };

  const activeMedia = useMemo(
    () => items.find((item) => item.id === activeMediaId) ?? null,
    [activeMediaId, items],
  );

  return (
    <>
      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-400 sm:text-base">
            {isTrash ? "Trash Bin" : "Art Gallery Collection"}
          </h2>

          <div className="flex items-center gap-3">
            {/* 🎯 Toolbar hành động chỉ hiện khi ở Trash và có chọn ảnh */}
            {isTrash && selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRestore}
                  className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 transition"
                >
                  Restore ({selectedIds.length})
                </button>
                <button
                  onClick={handlePermanentDelete}
                  className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700 transition"
                >
                  Delete Forever
                </button>
              </div>
            )}

            <p className="text-xs font-mono text-slate-500">
              {items.length} assets
              {selectedIds.length > 0
                ? ` · ${selectedIds.length} selected`
                : ""}
            </p>
          </div>
        </header>

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="columns-2 gap-4 space-y-4 sm:columns-3 md:columns-4 xl:columns-5">
            {items.map((item) => (
              <ImageGridItem
                key={item.id}
                item={item}
                isSelected={selectedSet.has(item.id)}
                dragPayloadIds={
                  selectedSet.has(item.id) ? dragPayloadIds : [item.id]
                }
                onSelect={handleSelect}
                onOpen={(openedItem) => setActiveMediaId(openedItem.id)}
                onLoadError={onMediaLoadError} // 🎯 Truyền callback tiếp xuống cho ImageGridItem nhận diện
              />
            ))}
          </div>
        )}
      </section>

      <MediaLightbox
        isOpen={activeMedia !== null}
        item={activeMedia}
        onClose={() => setActiveMediaId(null)}
      />
    </>
  );
}
