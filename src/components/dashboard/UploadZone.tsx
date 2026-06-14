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
import { toast } from "sonner"; // <--- Import Sonner
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
      {/* Giữ nguyên cấu trúc Card của bạn */}
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
            {item.status === "processing" && (
              <span className="rounded bg-blue-900/40 px-2 py-0.5 text-blue-300 animate-pulse">
                Uploading...
              </span>
            )}
            {item.status === "failed" && (
              <span className="rounded bg-rose-900/40 px-2 py-0.5 text-rose-300 font-medium">
                Failed
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.id, item.previewUrl)}
          className="h-11 w-11 shrink-0 rounded p-2.5 text-slate-400 transition hover:bg-slate-800"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </li>
  );
});

export function UploadZone({ userId }: { userId: string }): JSX.Element {
  const { queue, addItems, removeItem, updateItem } = useUploadStore();
  const queryClient = useQueryClient();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const totalSavings = useMemo(() => {
    if (queue.length === 0) return 0;
    const original = queue.reduce((sum, item) => sum + item.originalSize, 0);
    const processed = queue.reduce((sum, item) => sum + item.processedSize, 0);
    return Math.max(0, Math.round(((original - processed) / original) * 100));
  }, [queue]);

  const processFiles = useCallback(
    async (rawFiles: File[]) => {
      if (rawFiles.length === 0) return;
      setIsProcessing(true);

      const imageFiles = rawFiles.filter(isImageFile);
      if (imageFiles.length === 0) {
        toast.error("Chỉ hỗ trợ file hình ảnh!");
        setIsProcessing(false);
        return;
      }

      try {
        const processed = await Promise.all(
          imageFiles.map((file) => processUploadFile(file)),
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
      (item) => item.status === "queued" || item.status === "failed",
    );
    if (itemsToUpload.length === 0) return;

    setIsUploading(true);
    let savedCount = 0;

    for (const item of itemsToUpload) {
      try {
        updateItem(item.id, { status: "processing" });

        const res = await fetch("/api/media/upload-url", {
          method: "POST",
          body: JSON.stringify({
            fileName: item.fileName,
            fileType: item.mimeType,
          }),
        });
        if (!res.ok) throw new Error("Không thể tạo link upload");
        const { uploadUrl, filePath } = await res.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: item.file,
        });
        if (!uploadRes.ok) throw new Error("Lỗi upload lên Storage");

        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${filePath}`;

        const saveRes = await fetch("/api/media/save", {
          method: "POST",
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
        removeItem(item.id);
      } catch (err: any) {
        toast.error(`Lỗi upload ${item.fileName}: ${err.message}`);
        updateItem(item.id, { status: "failed", errorMessage: err.message });
      }
    }

    if (savedCount > 0) {
      toast.success(`Đã đồng bộ thành công ${savedCount} ảnh!`);
      queryClient.invalidateQueries({ queryKey: ["media"] });
    }
    setIsUploading(false);
  }, [queue, removeItem, updateItem, queryClient]);

  return (
    <section className="w-full space-y-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Smart Upload</h2>
        </div>
      </header>

      {/* Vùng Dropzone giữ nguyên, đã xóa các đoạn render `error` và `successMessage` */}
      <div
        onDrop={(e) => {
          e.preventDefault();
          processFiles(Array.from(e.dataTransfer.files));
        }}
        className="border-2 border-dashed border-slate-700 p-5 rounded-xl cursor-pointer"
      >
        <label htmlFor="upload-input" className="flex flex-col items-center">
          <ImagePlus size={32} />
          <p>Tap or drag images</p>
        </label>
        <input
          id="upload-input"
          type="file"
          multiple
          className="hidden"
          onChange={(e) => processFiles(Array.from(e.target.files || []))}
        />
      </div>

      <ul className="space-y-2">
        {queue.map((item) => (
          <UploadQueueCard key={item.id} item={item} onRemove={removeItem} />
        ))}
      </ul>

      {queue.length > 0 && (
        <button
          disabled={isUploading}
          onClick={handleUploadToCloud}
          className="w-full h-11 bg-blue-600 rounded text-white"
        >
          {isUploading ? "Uploading..." : "Upload to Cloud"}
        </button>
      )}
    </section>
  );
}
