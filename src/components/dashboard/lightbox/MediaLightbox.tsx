"use client";

import Image from "next/image";
import {
  MouseEvent,
  WheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Minus,
  Plus,
  X,
  Info,
} from "lucide-react";
import clsx from "clsx";
import { MediaItem } from "@/types/image.types";
import {
  formatBytes,
  formatDate,
  formatSavingsPercent,
} from "@/utils/formatters";

interface MediaLightboxProps {
  isOpen: boolean;
  item: MediaItem | null;
  onClose: () => void;
}

interface Dimensions {
  width: number;
  height: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.3; // Tăng một chút để thao tác zoom nhạy bén hơn

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function MediaLightbox({
  isOpen,
  item,
  onClose,
}: MediaLightboxProps): JSX.Element | null {
  const [zoom, setZoom] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDesktopMeta, setShowDesktopMeta] = useState(false); // 🎯 Control panel hiển thị thông tin dạng mờ
  const [isMetaOpen, setIsMetaOpen] = useState(false);

  const dragState = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setZoom(1);
    setTranslate({ x: 0, y: 0 });
    setDimensions(null);
    setIsMetaOpen(false);
  }, [isOpen, item?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const canPan = zoom > 1;

  const onWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoom((prev) =>
      clampZoom(prev + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)),
    );
  }, []);

  const onMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!canPan) return;
      dragState.current = { active: true, x: event.clientX, y: event.clientY };
    },
    [canPan],
  );

  const onMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!dragState.current.active || !canPan) return;
      const deltaX = event.clientX - dragState.current.x;
      const deltaY = event.clientY - dragState.current.y;
      dragState.current = { active: true, x: event.clientX, y: event.clientY };
      setTranslate((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    },
    [canPan],
  );

  const stopPan = useCallback(() => {
    dragState.current.active = false;
  }, []);

  const resetViewport = useCallback(() => {
    setZoom(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const handleDownload = useCallback(async () => {
    if (!item || isDownloading) return;
    setIsDownloading(true);
    try {
      let downloadUrl = item.previewUrl;
      let revokeUrl = false;

      if (!downloadUrl.startsWith("blob:")) {
        const response = await fetch(item.previewUrl);
        const blob = await response.blob();
        downloadUrl = URL.createObjectURL(blob);
        revokeUrl = true;
      }

      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = item.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      if (revokeUrl) URL.revokeObjectURL(downloadUrl);
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, item]);

  const metadata = useMemo(() => {
    if (!item) return null;
    return [
      {
        label: "Original Size",
        value: formatBytes(item.originalSize ?? item.fileSize),
      },
      { label: "Compressed Size", value: formatBytes(item.fileSize) },
      {
        label: "Saved Space",
        value: formatSavingsPercent(item.originalSize, item.fileSize),
      },
      {
        label: "Format",
        value: item.mimeType.split("/")[1]?.toUpperCase() ?? "Unknown",
      },
      {
        label: "Dimensions",
        value: dimensions
          ? `${dimensions.width} × ${dimensions.height}`
          : "Loading…",
      },
      { label: "Date Created", value: formatDate(item.createdAt) },
    ];
  }, [dimensions, item]);

  if (!isOpen || !item) return null;

  const metadataPanel = (
    <div className="space-y-2.5 rounded-xl border border-white/5 bg-black/40 backdrop-blur-md p-3.5 shadow-inner">
      {metadata?.map((entry) => (
        <div
          key={entry.label}
          className="flex items-start justify-between gap-3 text-xs sm:text-sm"
        >
          <span className="text-slate-400 font-light">{entry.label}</span>
          <span className="text-right font-mono text-slate-200">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-stretch justify-between bg-black/95 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Image preview: ${item.name}`}
      onClick={onClose}
    >
      {/* 🎯 1. AMBIENT GLOW LAYER (ĐÈN HẮT TƯỜNG):
       * Nhân bản một bản ghi mờ cực lớn ở phía sau để tự động lấy màu sắc chủ đạo của ảnh hắt lên không gian.
       */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25 mix-blend-screen select-none">
        <Image
          src={item.previewUrl}
          alt="Ambient Background"
          fill
          className="object-cover scale-125 blur-[140px]"
          unoptimized
        />
      </div>

      {/* ─── 2. TOP TOOLBAR (KÍNH MỜ TRONG SUỐT) ─── */}
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 border-b border-white/5 bg-black/20 backdrop-blur-md px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium tracking-wide text-slate-100 sm:text-base">
            {item.name}
          </p>
        </div>

        {/* Studio Controls */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-white/5 bg-black/40 p-0.5 backdrop-blur-sm">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoom((prev) => clampZoom(prev - ZOOM_STEP));
              }}
              className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-slate-100 transition"
              aria-label="Zoom out"
            >
              <Minus size={14} />
            </button>
            <span className="w-12 text-center text-xs font-mono tabular-nums text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoom((prev) => clampZoom(prev + ZOOM_STEP));
              }}
              className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-slate-100 transition"
              aria-label="Zoom in"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resetViewport();
            }}
            className="h-9 rounded-md border border-white/5 bg-black/40 px-3 text-xs tracking-wider text-slate-300 hover:bg-white/10 transition"
          >
            RESET
          </button>

          {/* Toggle Metadata Panel (Desktop) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDesktopMeta(!showDesktopMeta);
            }}
            className={clsx(
              "hidden h-9 w-9 items-center justify-center rounded-md border transition md:flex",
              showDesktopMeta
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-white/5 bg-black/40 text-slate-400 hover:text-slate-100",
            )}
            aria-label="Toggle info"
          >
            <Info size={15} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-md bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-slate-100 transition"
            aria-label="Close lightbox"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* ─── 3. MAIN WORKSPACE ─── */}
      <div
        className="relative flex min-h-0 flex-1 flex-col md:flex-row"
        onClick={onClose}
      >
        {/* Pan/zoom Canvas */}
        <main
          className={clsx(
            "relative flex-1 overflow-hidden transition-all duration-300",
            canPan ? "cursor-grab active:cursor-grabbing" : "",
          )}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopPan}
          onMouseLeave={stopPan}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative h-full w-full transition-transform duration-150 ease-out"
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoom})`,
            }}
          >
            <Image
              src={item.previewUrl}
              alt={item.name}
              fill
              className="object-contain p-4 sm:p-8"
              unoptimized
              sizes="100vw"
              priority
              onLoadingComplete={(img) =>
                setDimensions({
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                })
              }
            />
          </div>
        </main>

        {/* ─── 4. DESKTOP SIDE PANEL (GLASSMORPHISM SIDEBAR) ─── */}
        <aside
          onClick={(e) => e.stopPropagation()}
          className={clsx(
            "hidden shrink-0 border-l border-white/5 bg-black/40 backdrop-blur-2xl p-5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:block",
            showDesktopMeta
              ? "w-80 opacity-100"
              : "w-0 p-0 opacity-0 overflow-hidden border-l-0",
          )}
        >
          <div className="flex h-full flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Artwork Toolkit
              </h3>
              {metadataPanel}
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.98] disabled:opacity-60"
            >
              <Download size={15} />
              {isDownloading ? "Generating Asset…" : "Download Master File"}
            </button>
          </div>
        </aside>
      </div>

      {/* ─── 5. MOBILE PANEL (COLLAPSIBLE FOOTER SHEET) ─── */}
      <aside
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 shrink-0 border-t border-white/5 bg-black/60 backdrop-blur-2xl md:hidden"
      >
        <button
          type="button"
          aria-expanded={isMetaOpen}
          onClick={() => setIsMetaOpen((prev) => !prev)}
          className="flex h-12 w-full items-center justify-between px-4 text-xs font-semibold uppercase tracking-wider text-slate-300"
        >
          <span className="flex items-center gap-1.5">
            <Info size={14} /> Spec Sheet
          </span>
          {isMetaOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>

        <div
          className={clsx(
            "overflow-y-auto px-4 pb-4 transition-all",
            isMetaOpen ? "block" : "hidden",
          )}
        >
          {metadataPanel}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              <Download size={15} />
              {isDownloading ? "Preparing…" : "Download"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex h-11 items-center justify-center rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5"
            >
              Exit Studio
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
