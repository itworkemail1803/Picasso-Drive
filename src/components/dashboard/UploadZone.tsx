"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import clsx from "clsx";
import Image from "next/image";
import { toast } from "sonner";
import { useUploadStore } from "@/store/useUploadStore";
import { processUploadFile } from "@/utils/imageCompressor";
import { formatBytes } from "@/utils/formatters";
import { UploadQueueItem } from "@/types/image.types";
import { useQueryClient } from "@tanstack/react-query";

const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp,image/gif,image/avif";

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

// ── Upload với XHR để lấy progress thực ────────────────────────
function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.open("PUT", url);
    xhr.send(file);
  });
}

// ── Progress Bar ────────────────────────────────────────────────
function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="mt-2 h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-200"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// ── Queue Card ──────────────────────────────────────────────────
const UploadQueueCard = memo(function UploadQueueCard({
  item,
  progress,
  onRemove,
}: {
  item: UploadQueueItem;
  progress: number;
  onRemove: (id: string, previewUrl: string) => void;
}): JSX.Element {
  const isUploading = item.status === "processing";
  const isFailed = item.status === "failed";
  const isDone = item.status === "completed";

  return (
    <li className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-start gap-3">
        <Image
          src={item.previewUrl}
          alt={item.fileName}
          width={52}
          height={52}
          className="h-13 w-13 shrink-0 rounded-lg object-cover border border-white/[0.06]"
          unoptimized
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-200">
            {item.fileName}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] text-stone-400">
              {formatBytes(item.originalSize)}
            </span>
            <span className="text-[10px] text-stone-600">→</span>
            <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] text-stone-400">
              {formatBytes(item.processedSize)}
            </span>
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              −{item.savingsPercent}%
            </span>

            {isUploading && (
              <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                {progress < 100 ? `${progress}%` : "Đang lưu…"}
              </span>
            )}
            {isFailed && (
              <span className="rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-400">
                Failed
              </span>
            )}
          </div>

          {/* Progress bar — chỉ hiện khi đang upload */}
          {isUploading && <ProgressBar percent={progress} />}
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id, item.previewUrl)}
          disabled={isUploading}
          className="shrink-0 rounded-lg p-2 text-stone-600 hover:bg-white/[0.05] hover:text-stone-300 disabled:opacity-30 transition-colors"
          aria-label="Remove from queue"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );
});

// ── Main Component ──────────────────────────────────────────────
export function UploadZone({ userId }: { userId: string }): JSX.Element {
  const { queue, addItems, removeItem, updateItem } = useUploadStore();
  const queryClient = useQueryClient();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Progress per item: { [id]: 0-100 }
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  const setProgress = (id: string, percent: number) =>
    setProgressMap((prev) => ({ ...prev, [id]: percent }));

  const totalSavings = useMemo(() => {
    if (queue.length === 0) return 0;
    const original = queue.reduce((s, i) => s + i.originalSize, 0);
    const processed = queue.reduce((s, i) => s + i.processedSize, 0);
    return Math.max(0, Math.round(((original - processed) / original) * 100));
  }, [queue]);

  const processFiles = useCallback(
    async (rawFiles: File[]) => {
      if (!rawFiles.length) return;
      setIsProcessing(true);
      const imageFiles = rawFiles.filter(isImageFile);
      if (!imageFiles.length) {
        toast.error("Chỉ hỗ trợ file hình ảnh!");
        setIsProcessing(false);
        return;
      }
      try {
        const processed = await Promise.all(
          imageFiles.map((f) => processUploadFile(f)),
        );
        addItems(processed);
        toast.success(`Đã thêm ${processed.length} ảnh vào hàng đợi.`);
      } catch {
        toast.error("Lỗi xử lý ảnh. Vui lòng thử lại!");
      } finally {
        setIsProcessing(false);
      }
    },
    [addItems],
  );

  const handleUploadToCloud = useCallback(async () => {
    const itemsToUpload = queue.filter(
      (i) => i.status === "queued" || i.status === "failed",
    );
    if (!itemsToUpload.length) return;

    setIsUploading(true);
    let savedCount = 0;

    for (const item of itemsToUpload) {
      try {
        updateItem(item.id, { status: "processing" });
        setProgress(item.id, 0);

        // 1. Lấy presigned URL
        const res = await fetch("/api/media/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: item.fileName,
            fileType: item.mimeType,
          }),
        });
        if (!res.ok) throw new Error("Không thể tạo link upload");
        const { uploadUrl, filePath } = await res.json();

        // 2. Upload với XHR để có progress thực
        await uploadWithProgress(uploadUrl, item.file, (percent) => {
          setProgress(item.id, percent);
        });

        // 3. Lưu metadata
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${filePath}`;
        const saveRes = await fetch("/api/media/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: publicUrl,
            fileName: item.fileName,
            originalSize: item.originalSize,
            size: item.processedSize,
            filePath,
            albumId: null,
          }),
        });
        if (!saveRes.ok) throw new Error("Lỗi lưu metadata");

        savedCount++;
        setProgress(item.id, 100);
        removeItem(item.id);
      } catch (err: any) {
        toast.error(`${item.fileName}: ${err.message}`);
        updateItem(item.id, { status: "failed", errorMessage: err.message });
        setProgress(item.id, 0);
      }
    }

    if (savedCount > 0) {
      toast.success(`Đã upload thành công ${savedCount} ảnh!`);
      queryClient.invalidateQueries({ queryKey: ["media"] });
    }
    setIsUploading(false);
  }, [queue, removeItem, updateItem, queryClient]);

  const pendingCount = queue.filter(
    (i) => i.status === "queued" || i.status === "failed",
  ).length;

  return (
    <section className="w-full space-y-3 rounded-xl border border-white/[0.06] bg-stone-900/30 backdrop-blur-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-stone-200">Upload</h2>
          {queue.length > 0 && (
            <p className="text-[11px] text-stone-500 mt-0.5">
              {queue.length} file{queue.length > 1 ? "s" : ""} queued
              {totalSavings > 0 && ` · ${totalSavings}% avg compression`}
            </p>
          )}
        </div>
      </div>

      {/* Dropzone */}
      <label
        htmlFor="upload-input"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          processFiles(Array.from(e.dataTransfer.files));
        }}
        className={clsx(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 cursor-pointer transition-all duration-200",
          isDragging
            ? "border-amber-500/50 bg-amber-500/[0.04]"
            : "border-white/[0.07] hover:border-white/[0.12] hover:bg-white/[0.02]",
          isProcessing && "opacity-60 pointer-events-none",
        )}
      >
        <div
          className={clsx(
            "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
            isDragging
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
              : "border-white/[0.07] bg-white/[0.03] text-stone-500",
          )}
        >
          <ImagePlus size={18} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-stone-300">
            {isProcessing ? "Processing…" : "Drop images here"}
          </p>
          <p className="text-[11px] text-stone-600 mt-0.5">
            or click to browse · JPEG, PNG, WebP, AVIF
          </p>
        </div>
        <input
          id="upload-input"
          type="file"
          multiple
          accept={ACCEPTED_IMAGES}
          className="sr-only"
          onChange={(e) => processFiles(Array.from(e.target.files || []))}
        />
      </label>

      {/* Queue */}
      {queue.length > 0 && (
        <>
          <ul className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
            {queue.map((item) => (
              <UploadQueueCard
                key={item.id}
                item={item}
                progress={progressMap[item.id] ?? 0}
                onRemove={removeItem}
              />
            ))}
          </ul>

          <button
            disabled={isUploading || pendingCount === 0}
            onClick={handleUploadToCloud}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-amber-500/90 text-sm font-medium text-stone-900 transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-stone-900/30 border-t-stone-900 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <UploadCloud size={15} />
                Upload {pendingCount} file{pendingCount > 1 ? "s" : ""}
              </>
            )}
          </button>
        </>
      )}
    </section>
  );
}
