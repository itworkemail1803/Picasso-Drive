import imageCompression from "browser-image-compression";
import { UploadQueueItem } from "@/types/image.types";

const FIVE_MB = 5 * 1024 * 1024;

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function calculateSavings(originalSize: number, processedSize: number): number {
  if (originalSize <= 0) return 0;
  const percentage = ((originalSize - processedSize) / originalSize) * 100;
  return Math.max(0, Math.round(percentage));
}

async function compressToWebP(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.8,
    fileType: "image/webp"
  });
}

export async function processUploadFile(file: File): Promise<UploadQueueItem> {
  const processedFile = file.size > FIVE_MB ? await compressToWebP(file) : file;
  const previewUrl = URL.createObjectURL(processedFile);

  return {
    id: createId(),
    fileName: file.name,
    mimeType: processedFile.type || file.type,
    originalSize: file.size,
    processedSize: processedFile.size,
    savingsPercent: calculateSavings(file.size, processedFile.size),
    previewUrl,
    status: "queued",
    originalFile: file,
    processedFile,
    file: processedFile
  };
}
