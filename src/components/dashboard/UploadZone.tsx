"use client";

import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";
import { ImagePlus, Trash2, UploadCloud, XCircle } from "lucide-react";
import clsx from "clsx";
import Image from "next/image";
import { useUploadStore } from "@/store/useUploadStore";
import { processUploadFile } from "@/utils/imageCompressor";
import { formatBytes } from "@/utils/formatters";
import { UploadQueueItem } from "@/types/image.types";
import { useQueryClient } from "@tanstack/react-query";

const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp,image/gif,image/avif";

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

const UploadQueueCard = memo(function UploadQueueCard({
  item,
  onRemove,
}: {
  item: UploadQueueItem;
  onRemove: (id: string, previewUrl: string) => void;
}): JSX.Element {
  return (
    <li className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
      <div className="flex items-start gap-3">
        <Image
          src={item.previewUrl}
          alt={item.fileName}
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-md object-cover"
          unoptimized
        />
        <div className="min-w-0 flex-1">
          <p className="break-all text-sm font-medium text-slate-100">
            {item.fileName}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
              Original: {formatBytes(item.originalSize)}
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
              Compressed: {formatBytes(item.processedSize)}
            </span>
            <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-emerald-300">
              Saved {item.savingsPercent}%
            </span>
            {item.status === "queued" && (
              <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-400">
                Queued
              </span>
            )}
            {item.status === "processing" && (
              <span className="rounded bg-blue-900/40 px-2 py-0.5 text-blue-300 animate-pulse flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-blue-400" />
                Uploading...
              </span>
            )}
            {item.status === "failed" && (
              <span className="rounded bg-rose-900/40 px-2 py-0.5 text-rose-300 font-medium">
                Failed
              </span>
            )}
          </div>
          {item.errorMessage && (
            <p className="mt-1.5 text-xs text-rose-400 break-all">
              {item.errorMessage}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={item.status === "processing"}
          aria-label={`Remove ${item.fileName}`}
          onClick={() => onRemove(item.id, item.previewUrl)}
          className="h-11 w-11 shrink-0 rounded p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </li>
  );
});

interface UploadZoneProps {
  userId: string;
}

export function UploadZone({ userId }: UploadZoneProps): JSX.Element {
  const queue = useUploadStore((state) => state.queue);
  const addItems = useUploadStore((state) => state.addItems);
  const removeItem = useUploadStore((state) => state.removeItem);
  const updateItem = useUploadStore((state) => state.updateItem);

  const queryClient = useQueryClient();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const totalSavings = useMemo(() => {
    if (queue.length === 0) return 0;
    const original = queue.reduce((sum, item) => sum + item.originalSize, 0);
    const processed = queue.reduce((sum, item) => sum + item.processedSize, 0);
    if (original === 0) return 0;
    return Math.max(0, Math.round(((original - processed) / original) * 100));
  }, [queue]);

  const processFiles = useCallback(
    async (rawFiles: File[]) => {
      if (rawFiles.length === 0) return;
      setIsProcessing(true);
      setError(null);

      const imageFiles = rawFiles.filter(isImageFile);
      if (imageFiles.length === 0) {
        setError("Only image files are supported.");
        setIsProcessing(false);
        return;
      }

      try {
        const processed = await Promise.all(
          imageFiles.map((file) => processUploadFile(file)),
        );
        addItems(processed);
      } catch {
        setError("Failed to process one or more images. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [addItems],
  );

  const onDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(event.dataTransfer.files);
      await processFiles(droppedFiles);
    },
    [processFiles],
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files ?? []);
      await processFiles(selectedFiles);
      event.target.value = "";
    },
    [processFiles],
  );

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const input = document.getElementById("upload-input");
      if (input instanceof HTMLInputElement) input.click();
    }
  }, []);

  const handleRemoveItem = useCallback(
    (id: string, previewUrl: string) => {
      URL.revokeObjectURL(previewUrl);
      removeItem(id);
    },
    [removeItem],
  );

  const handleClearQueue = useCallback(() => {
    const itemsToClear = queue.filter((item) => item.status !== "processing");
    for (const item of itemsToClear) {
      URL.revokeObjectURL(item.previewUrl);
      removeItem(item.id);
    }
  }, [queue, removeItem]);

  const handleUploadToCloud = useCallback(async () => {
    const itemsToUpload = queue.filter(
      (item) => item.status === "queued" || item.status === "failed",
    );
    if (itemsToUpload.length === 0) return;

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);
    let savedCount = 0;

    for (const item of itemsToUpload) {
      try {
        updateItem(item.id, { status: "processing", errorMessage: undefined });

        // Bước 1: Lấy Presigned URL từ backend
        const res = await fetch("/api/media/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: item.fileName,
            fileType: item.mimeType,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to get signed upload URL");
        }

        const { uploadUrl, filePath } = await res.json();

        // Bước 2: Upload dữ liệu nhị phân trực tiếp lên Supabase Storage qua mã chữ ký
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": item.mimeType },
          body: item.file,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload file to Supabase Storage");
        }

        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${filePath}`;
        console.log(
          `[Picasso Drive] Upload successful! Public URL: ${publicUrl}`,
        );

        // Bước 3: Đồng bộ toàn bộ dữ liệu Metadata khớp 100% với Schema Prisma của Backend
        const saveRes = await fetch("/api/media/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: publicUrl,
            fileName: item.fileName,
            originalSize: item.originalSize, // Thêm dung lượng gốc trước khi nén
            storageSize: item.processedSize, // Thêm dung lượng nén thực tế lưu trữ
            filePath: filePath, // Thêm đường dẫn file tương đối trong bucket
            albumId: null, // Mặc định root nếu chưa gán album động
          }),
        });

        if (!saveRes.ok) {
          const saveErr = await saveRes.json().catch(() => ({}));
          throw new Error(
            saveErr.error || "Failed to save image metadata to database",
          );
        }

        console.log(
          `[Picasso Drive] Metadata saved to DB for: ${item.fileName}`,
        );
        savedCount++;

        URL.revokeObjectURL(item.previewUrl);
        removeItem(item.id);
      } catch (err: any) {
        console.error(`[Picasso Drive] Error uploading ${item.fileName}:`, err);
        updateItem(item.id, {
          status: "failed",
          errorMessage: err.message || "Upload failed",
        });
      }
    }

    setIsUploading(false);

    // Kích hoạt re-fetch dữ liệu tự động cho TanStack Query nếu có ảnh lưu thành công
    if (savedCount > 0) {
      queryClient.invalidateQueries({ queryKey: ["media"] });

      setSuccessMessage(
        `Đã lưu trữ và đồng bộ thành công ${savedCount} ảnh vào hệ thống!`,
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  }, [queue, removeItem, updateItem, queryClient]);

  return (
    <section className="w-full space-y-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-100 sm:text-lg">
            Smart Upload Workflow
          </h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Drop images for instant preview and auto-compression when size
            exceeds 5MB.
          </p>
        </div>
        {queue.length > 0 ? (
          <button
            type="button"
            disabled={isUploading}
            onClick={handleClearQueue}
            className="inline-flex h-11 items-center gap-1.5 rounded-md border border-slate-700 px-4 text-sm text-slate-200 transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle size={16} />
            Clear queue
          </button>
        ) : null}
      </header>

      <div
        role="button"
        aria-label="Upload image files"
        tabIndex={0}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onKeyDown={onKeyDown}
        className={clsx(
          "group relative flex min-h-44 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-5 transition",
          isDragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-700 bg-slate-950/50 hover:border-slate-500",
        )}
      >
        <label
          htmlFor="upload-input"
          className="flex cursor-pointer flex-col items-center gap-3 text-center"
        >
          {isProcessing ? (
            <UploadCloud className="animate-pulse text-blue-400" size={32} />
          ) : (
            <ImagePlus
              className="text-slate-300 transition group-hover:text-slate-100"
              size={32}
            />
          )}
          <div>
            <p className="text-sm font-medium text-slate-200">
              {isProcessing ? "Processing images…" : "Tap or drag images here"}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              JPG, PNG, WebP, GIF, AVIF
            </p>
          </div>
        </label>
        <input
          id="upload-input"
          type="file"
          multiple
          accept={ACCEPTED_IMAGES}
          className="sr-only"
          onChange={onInputChange}
          aria-label="Choose images to upload"
        />
      </div>

      {error ? (
        <div className="rounded-md border border-rose-900 bg-rose-900/20 px-3 py-2.5 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-800 bg-emerald-900/20 px-3 py-2.5 text-sm text-emerald-300">
          <span className="text-base">✓</span>
          {successMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-950/70 px-3 py-2.5 text-sm text-slate-300">
        <span>{queue.length} image(s) in queue</span>
        <span className="font-medium text-emerald-300">
          Total saved: {totalSavings}%
        </span>
      </div>

      <ul className="space-y-2">
        {queue.map((item) => (
          <UploadQueueCard
            key={item.id}
            item={item}
            onRemove={handleRemoveItem}
          />
        ))}
      </ul>

      {queue.length > 0 && (
        <button
          type="button"
          disabled={isUploading}
          onClick={handleUploadToCloud}
          className={clsx(
            "w-full flex h-11 items-center justify-center gap-2 rounded-md font-medium text-sm transition",
            isUploading
              ? "bg-blue-600/50 text-blue-200 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-[0.98]",
          )}
        >
          <UploadCloud
            size={16}
            className={clsx(isUploading && "animate-bounce")}
          />
          {isUploading ? "Uploading to Cloud..." : "Upload to Cloud"}
        </button>
      )}
    </section>
  );
}
