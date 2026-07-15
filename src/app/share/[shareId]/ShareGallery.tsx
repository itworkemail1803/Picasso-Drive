"use client";

import { useCallback, useEffect, useState } from "react";
import type { ShareMediaItem } from "@/types/share.types";

interface ShareGalleryProps {
  shareId: string;
  albumName: string;
  ownerName: string | null;
  createdAt: string;
  expiresAt: string | null;
  media: ShareMediaItem[];
}

function formatBytes(bytes: number | bigint): string {
  const n = Number(bytes);
  if (n === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${parseFloat((n / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Image Card ─────────────────────────────────────────────────
function ShareImageCard({
  item,
  onClick,
}: {
  item: ShareMediaItem;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      onClick={onClick}
      className="group inline-block w-full break-inside-avoid mb-3 rounded-xl overflow-hidden border border-white/[0.06] bg-stone-900/50 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-2xl hover:shadow-black/50"
    >
      <div className="relative min-h-[120px] bg-stone-900">
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 min-h-[120px]" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`block w-full h-auto object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <div className="flex items-center justify-between w-full">
            <p className="text-[11px] text-stone-200 font-medium truncate">
              {item.name}
            </p>
            <span className="text-[10px] font-mono text-stone-400 shrink-0 ml-2">
              {formatBytes(item.fileSize)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Lightbox ───────────────────────────────────────────────────
function Lightbox({
  item,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  item: ShareMediaItem;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.05]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-stone-300 font-medium truncate max-w-xs">
          {item.name}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-stone-500 tabular-nums">
            {index + 1} / {total}
          </span>
          <a
            href={item.url}
            download={item.name}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-3 flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] text-xs text-stone-400 hover:text-stone-200 hover:bg-white/[0.06] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </a>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-stone-400 hover:text-stone-200 hover:bg-white/[0.06] transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image */}
      <div
        className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-0"
        onClick={onClose}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.name}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Bottom nav */}
      <div
        className="shrink-0 flex items-center justify-center gap-3 py-4 border-t border-white/[0.05]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onPrev}
          className="h-9 px-4 flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] text-sm text-stone-400 hover:text-stone-200 hover:bg-white/[0.06] transition-colors"
        >
          ‹ Prev
        </button>
        <span className="text-xs text-stone-600 font-mono tabular-nums">
          {formatBytes(item.fileSize)}
        </span>
        <button
          onClick={onNext}
          className="h-9 px-4 flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] text-sm text-stone-400 hover:text-stone-200 hover:bg-white/[0.06] transition-colors"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export function ShareGallery({
  albumName,
  ownerName,
  createdAt,
  expiresAt,
  media,
}: ShareGalleryProps): JSX.Element {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevImage = useCallback(
    () =>
      setLightboxIndex((i) =>
        i === null ? null : i === 0 ? media.length - 1 : i - 1,
      ),
    [media.length],
  );
  const nextImage = useCallback(
    () =>
      setLightboxIndex((i) =>
        i === null ? null : i === media.length - 1 ? 0 : i + 1,
      ),
    [media.length],
  );

  const handleDownloadAll = useCallback(async () => {
    if (isDownloading || media.length === 0) return;
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const folder = zip.folder(albumName) ?? zip;

      let completed = 0;
      const BATCH = 5;

      for (let i = 0; i < media.length; i += BATCH) {
        await Promise.all(
          media.slice(i, i + BATCH).map(async (item) => {
            try {
              const res = await fetch(item.url);
              if (!res.ok) return;
              const blob = await res.blob();
              const safe = item.name.replace(/[/\\?%*:|"<>]/g, "-");
              folder.file(safe, blob);
            } catch {
              /* bỏ qua ảnh lỗi */
            } finally {
              completed++;
              setDownloadProgress(Math.round((completed / media.length) * 100));
            }
          }),
        );
      }

      const blob = await zip.generateAsync(
        {
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        },
        (meta) => setDownloadProgress(Math.round(meta.percent)),
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${albumName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP Error:", err);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }, [isDownloading, media, albumName]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 font-sans">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.05] bg-stone-950/90 backdrop-blur-xl">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-[10px] font-semibold uppercase tracking-widest text-amber-400">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Shared Album
              </span>
              {expiresAt && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400">
                  Hết hạn {formatDate(expiresAt)}
                </span>
              )}
            </div>
            <h1 className="font-serif text-xl text-stone-100">{albumName}</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              {media.length} ảnh
              {ownerName && ` · Chia sẻ bởi ${ownerName}`}
              {" · "}
              {formatDate(createdAt)}
            </p>
          </div>

          {media.length > 0 && (
            <button
              onClick={handleDownloadAll}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/90 text-stone-900 text-sm font-medium hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isDownloading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-stone-900/30 border-t-stone-900 animate-spin" />
                  {downloadProgress > 0
                    ? `${downloadProgress}%`
                    : "Đang chuẩn bị…"}
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Tải tất cả (ZIP)
                </>
              )}
            </button>
          )}
        </div>

        {/* Progress bar */}
        {isDownloading && (
          <div className="h-0.5 bg-stone-800">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-200"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        )}
      </header>

      {/* ── Gallery ── */}
      <main className="max-w-[90rem] mx-auto px-4 sm:px-6 py-6">
        {media.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-stone-600">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mb-3 opacity-40"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-sm">Album này chưa có ảnh nào.</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 xl:columns-5 gap-3">
            {media.map((item, index) => (
              <ShareImageCard
                key={item.id}
                item={item}
                onClick={() => setLightboxIndex(index)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-8 border-t border-white/[0.04] text-xs text-stone-700">
        Powered by{" "}
        <span className="text-stone-500 font-medium">Picasso Drive</span>
      </footer>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && media[lightboxIndex] && (
        <Lightbox
          item={media[lightboxIndex]}
          index={lightboxIndex}
          total={media.length}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}
    </div>
  );
}
