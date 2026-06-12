"use client";

import Image from "next/image";
import { DragEvent, memo, MouseEvent, useCallback, useState } from "react";
import clsx from "clsx";
import { MediaItem } from "@/types/image.types";
import { ImageSkeleton } from "@/components/dashboard/image-grid/ImageSkeleton";
import { formatBytes } from "@/utils/formatters";
import { useDragStore } from "@/store/useDragStore";
import { writeDragPayload } from "@/utils/dragMedia";

const BLUR_DATA_URL =
  "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoQABAAPzmEuVOvKKWisAgB4CcJbACdLoAA";

interface ImageGridItemProps {
  item: MediaItem;
  isSelected: boolean;
  dragPayloadIds: readonly string[];
  onSelect: (id: string, event: MouseEvent<HTMLButtonElement>) => void;
  onOpen: (item: MediaItem) => void;
  onLoadError: (id: string) => void;
}

export const ImageGridItem = memo(function ImageGridItem({
  item,
  isSelected,
  dragPayloadIds,
  onSelect,
  onOpen,
  onLoadError,
}: ImageGridItemProps): JSX.Element | null {
  // 🎯 Cập nhật kiểu trả về có thể là null
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false); // 🎯 1. Thêm state quản lý ảnh lỗi (404 từ Supabase)

  // Only dragged cards subscribe to drag state — avoids grid-wide re-renders.
  const isDragActive = useDragStore((state) =>
    state.draggedMediaIds.includes(item.id),
  );
  const beginDrag = useDragStore((state) => state.beginDrag);
  const endDrag = useDragStore((state) => state.endDrag);

  const onDragStart = useCallback(
    (event: DragEvent<HTMLElement>) => {
      const ids = dragPayloadIds.length > 0 ? dragPayloadIds : [item.id];
      beginDrag(ids);
      writeDragPayload(event.dataTransfer, { mediaIds: [...ids] });
      if (
        event.dataTransfer.setDragImage &&
        event.currentTarget instanceof HTMLElement
      ) {
        event.dataTransfer.setDragImage(event.currentTarget, 40, 40);
      }
    },
    [beginDrag, dragPayloadIds, item.id],
  );

  const onDragEnd = useCallback(() => endDrag(), [endDrag]);

  // 🎯 2. Nếu ảnh không tồn tại trên Storage, chặn không render block này để Masonry tự dồn dòng
  if (isError) return null;

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={clsx(
        "group relative inline-block w-full break-inside-avoid overflow-hidden rounded-xl border bg-slate-950 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isSelected
          ? "border-blue-500 shadow-xl shadow-blue-500/10 scale-[0.99]"
          : "border-slate-900 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/50",
        isDragActive && "scale-[0.96] opacity-40 ring-1 ring-blue-500/50",
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation(); // Ngăn mở lightbox
          onSelect(item.id, e as any);
        }}
        className={clsx(
          "absolute left-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/30 transition-all",
          isSelected
            ? "bg-blue-500 border-blue-500"
            : "bg-black/40 hover:bg-black/60",
        )}
      >
        {isSelected && <span className="text-white text-xs">✓</span>}
      </button>
      <button
        type="button"
        aria-label={`Open image ${item.name}`}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey) return;
          onOpen(item);
        }}
        className="relative block h-full w-full text-left"
      >
        <div className="relative w-full overflow-hidden bg-slate-950">
          {!isLoaded ? <ImageSkeleton seed={item.id} /> : null}
          <Image
            src={item.previewUrl}
            alt={item.name}
            width={500}
            height={500}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className={clsx(
              "pointer-events-none h-auto w-full object-contain transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
              isLoaded
                ? "relative scale-100 blur-0 group-hover:scale-[1.03]"
                : "absolute top-0 left-0 scale-105 blur-xl opacity-0",
            )}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            unoptimized
            draggable={false}
            onLoad={() => setIsLoaded(true)}
            // 🎯 3. Thêm trình bắt sự kiện lỗi tải ảnh
            onError={() => onLoadError(item.id)}
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="flex items-center justify-between gap-2 transform translate-y-1 transition-transform duration-300 group-hover:translate-y-0">
              <p className="min-w-0 truncate text-xs font-medium text-slate-100">
                {item.name}
              </p>
              <span className="shrink-0 font-mono text-[10px] text-slate-400">
                {formatBytes(item.fileSize)}
              </span>
            </div>
          </div>
        </div>
      </button>
    </article>
  );
});
