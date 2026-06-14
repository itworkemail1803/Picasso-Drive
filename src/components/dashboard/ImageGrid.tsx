"use client";

import { memo, MouseEvent, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { MediaItem, ALBUM_TRASH_ID } from "@/types/image.types";
import { ImageGridItem } from "@/components/dashboard/image-grid/ImageGridItem";
import { MediaLightbox } from "@/components/dashboard/lightbox/MediaLightbox";
import { useAlbumStore } from "@/store/useAlbumStore";
import {
  CheckSquare,
  Square,
  Trash2,
  RotateCcw,
  FolderPlus,
  ArrowRight,
} from "lucide-react";

interface ImageGridProps {
  items: MediaItem[];
  onMediaLoadError: (id: string) => void;
  currentAlbumId?: string;
}

const EmptyState = memo(function EmptyState(): JSX.Element {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/20 p-6 text-center sm:p-8">
      <p className="text-sm text-slate-400">No images in this album.</p>
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

  // Lấy dữ liệu từ store
  const { restoreMedia, permanentlyDeleteMedia, moveMediaToAlbum, albums } =
    useAlbumStore();

  const isTrash = currentAlbumId === ALBUM_TRASH_ID;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(isAllSelected ? [] : items.map((item) => item.id));
  }, [isAllSelected, items]);

  const handleSelect = useCallback(
    (id: string, event: MouseEvent<HTMLButtonElement>) => {
      const isMulti = event.metaKey || event.ctrlKey;
      setSelectedIds((prev) =>
        isMulti
          ? prev.includes(id)
            ? prev.filter((sid) => sid !== id)
            : [...prev, id]
          : [id],
      );
    },
    [],
  );

  // --- Actions ---

  const handleMoveToAlbum = async (targetAlbumId: string) => {
    const promise = moveMediaToAlbum(selectedIds, targetAlbumId);
    toast.promise(promise, {
      loading: "Moving assets...",
      success: "Moved successfully!",
      error: "Failed to move assets",
    });
    setSelectedIds([]);
  };

  const handleRestore = async () => {
    const promise = restoreMedia(selectedIds);
    toast.promise(promise, {
      loading: "Restoring...",
      success: "Restored successfully!",
      error: "Failed to restore",
    });
    setSelectedIds([]);
  };

  const handlePermanentDelete = async () => {
    if (confirm(`Delete ${selectedIds.length} items permanently?`)) {
      const promise = permanentlyDeleteMedia(selectedIds);
      toast.promise(promise, {
        loading: "Deleting...",
        success: "Deleted permanently!",
        error: "Deletion failed",
      });
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
          <h2 className="text-sm font-medium uppercase tracking-wider text-slate-400">
            {isTrash ? "Trash Bin" : "Art Gallery Collection"}
          </h2>

          <div className="flex items-center gap-2">
            {/* Toolbar thông minh */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 p-1 animate-in fade-in zoom-in duration-200">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 rounded p-1.5 text-xs text-slate-300 hover:bg-slate-800"
                >
                  {isAllSelected ? (
                    <CheckSquare size={14} />
                  ) : (
                    <Square size={14} />
                  )}
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                {isTrash ? (
                  <>
                    <button
                      onClick={handleRestore}
                      className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-emerald-400 hover:bg-slate-800"
                    >
                      <RotateCcw size={14} /> Restore
                    </button>
                    <button
                      onClick={handlePermanentDelete}
                      className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-rose-400 hover:bg-slate-800"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                ) : (
                  <div className="relative flex items-center">
                    <FolderPlus size={14} className="ml-2 text-slate-400" />
                    <select
                      onChange={(e) => handleMoveToAlbum(e.target.value)}
                      className="bg-transparent text-xs text-slate-200 pl-2 pr-6 py-1 outline-none cursor-pointer hover:text-white"
                      value=""
                    >
                      <option value="" disabled>
                        Move to...
                      </option>
                      {albums.map((album) => (
                        <option
                          key={album.id}
                          value={album.id}
                          className="text-black"
                        >
                          {album.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs font-mono text-slate-500 ml-2">
              {items.length} assets{" "}
              {selectedIds.length > 0 ? `· ${selectedIds.length} selected` : ""}
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
                  selectedSet.has(item.id) ? selectedIds : [item.id]
                }
                onSelect={handleSelect}
                onOpen={(openedItem) => setActiveMediaId(openedItem.id)}
                onLoadError={onMediaLoadError}
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
