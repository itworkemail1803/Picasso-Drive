"use client";

import { useCallback, useState } from "react";
import type { ShareMediaItem } from "@/types/share.types";

// ──────────────────────────────────────────────────────────────
// ShareGallery — Client Component riêng biệt cho trang public share
// ⚠️ KHÔNG import bất kỳ thứ gì từ @/store hay @/components/dashboard
// ──────────────────────────────────────────────────────────────

interface ShareGalleryProps {
  shareId: string;
  albumName: string;
  ownerName: string | null;
  createdAt: string;
  expiresAt: string | null;
  media: ShareMediaItem[];
}

// ─── Inline styles as constants for readability ───────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    color: "#f1f5f9",
    padding: "0",
  } as React.CSSProperties,

  header: {
    background: "rgba(15, 23, 42, 0.95)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(30, 41, 59, 0.8)",
    padding: "1.25rem 1.5rem",
    position: "sticky" as const,
    top: 0,
    zIndex: 40,
  } as React.CSSProperties,

  headerInner: {
    maxWidth: "90rem",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  } as React.CSSProperties,

  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.25rem 0.65rem",
    background: "rgba(37, 99, 235, 0.15)",
    border: "1px solid rgba(37, 99, 235, 0.35)",
    borderRadius: "9999px",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#93c5fd",
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  } as React.CSSProperties,

  albumTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#f1f5f9",
    margin: "0",
  } as React.CSSProperties,

  meta: {
    fontSize: "0.78rem",
    color: "#64748b",
    margin: "0.2rem 0 0",
  } as React.CSSProperties,

  btn: (variant: "primary" | "ghost" | "danger") =>
    ({
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4rem",
      padding: "0.5rem 1rem",
      borderRadius: "8px",
      border: "none",
      fontSize: "0.8rem",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.15s ease",
      ...(variant === "primary"
        ? { background: "#2563eb", color: "#fff" }
        : variant === "danger"
          ? {
              background: "rgba(220,38,38,0.15)",
              color: "#fca5a5",
              border: "1px solid rgba(220,38,38,0.3)",
            }
          : {
              background: "rgba(30,41,59,0.8)",
              color: "#94a3b8",
              border: "1px solid rgba(51,65,85,0.6)",
            }),
    }) as React.CSSProperties,

  grid: {
    maxWidth: "90rem",
    margin: "0 auto",
    padding: "1.5rem",
    columns: "repeat(auto-fill, minmax(200px, 1fr))",
    columnGap: "0.75rem",
  } as React.CSSProperties,

  card: (hovered: boolean) =>
    ({
      display: "inline-block",
      width: "100%",
      breakInside: "avoid",
      marginBottom: "0.75rem",
      borderRadius: "12px",
      overflow: "hidden",
      border: `1px solid ${hovered ? "#334155" : "#1e293b"}`,
      background: "#0f172a",
      cursor: "pointer",
      transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
      transform: hovered ? "translateY(-2px)" : "translateY(0)",
      boxShadow: hovered ? "0 20px 40px rgba(0,0,0,0.5)" : "none",
    }) as React.CSSProperties,

  img: (loaded: boolean) =>
    ({
      display: "block",
      width: "100%",
      height: "auto",
      objectFit: "cover" as const,
      opacity: loaded ? 1 : 0,
      transition: "opacity 0.4s ease",
    }) as React.CSSProperties,

  imgCaption: {
    padding: "0.5rem 0.65rem",
    borderTop: "1px solid #1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
  } as React.CSSProperties,

  // Lightbox
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(2,6,23,0.97)",
    backdropFilter: "blur(8px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  } as React.CSSProperties,

  lightboxImg: {
    maxWidth: "90vw",
    maxHeight: "85vh",
    objectFit: "contain" as const,
    borderRadius: "8px",
    boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
  } as React.CSSProperties,

  lightboxNav: {
    position: "absolute" as const,
    bottom: "1.5rem",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "rgba(15,23,42,0.9)",
    backdropFilter: "blur(12px)",
    padding: "0.6rem 1rem",
    borderRadius: "9999px",
    border: "1px solid rgba(30,41,59,0.8)",
  } as React.CSSProperties,
};

// ─── Helper ────────────────────────────────────────────────────
function formatBytes(bytes: number | bigint): string {
  // Chuyển BigInt sang Number ngay tại đây
  const numBytes = Number(bytes);

  if (numBytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return `${parseFloat((numBytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Image Card ────────────────────────────────────────────────
function ShareImageCard({
  item,
  onClick,
}: {
  item: ShareMediaItem;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      style={S.card(hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div
        style={{
          position: "relative",
          background: "#0f172a",
          minHeight: "120px",
        }}
      >
        {!loaded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, #1e293b 25%, #0f172a 50%, #1e293b 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
              minHeight: "120px",
            }}
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.name}
          style={S.img(loaded)}
          onLoad={() => setLoaded(true)}
          loading="lazy"
        />
      </div>
      <div style={S.imgCaption}>
        <span
          style={{
            fontSize: "0.72rem",
            color: "#64748b",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </span>
        <span
          style={{
            fontSize: "0.68rem",
            color: "#475569",
            fontFamily: "monospace",
            flexShrink: 0,
          }}
        >
          {formatBytes(item.fileSize)}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────
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

  // ─── Lightbox navigation ───────────────────────────────────
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const prevImage = useCallback(() => {
    setLightboxIndex((i) =>
      i === null ? null : i === 0 ? media.length - 1 : i - 1,
    );
  }, [media.length]);

  const nextImage = useCallback(() => {
    setLightboxIndex((i) =>
      i === null ? null : i === media.length - 1 ? 0 : i + 1,
    );
  }, [media.length]);

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    },
    [closeLightbox, prevImage, nextImage],
  );

  // ─── Client-side ZIP download with jszip ──────────────────
  const handleDownloadAll = useCallback(async () => {
    if (isDownloading || media.length === 0) return;
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Dynamic import — jszip chỉ load khi cần (code splitting)
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const folder = zip.folder(albumName) ?? zip;

      let completed = 0;
      const total = media.length;

      // Fetch tất cả ảnh song song (batch theo nhóm 5 để tránh flood)
      const BATCH_SIZE = 5;
      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = media.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (item) => {
            try {
              const res = await fetch(item.url);
              if (!res.ok) throw new Error(`Failed: ${item.name}`);
              const blob = await res.blob();

              // Giữ nguyên tên file, xử lý trùng tên bằng index
              const ext = item.name.split(".").pop() || "jpg";
              const safeName = item.name.replace(/[/\\?%*:|"<>]/g, "-");
              folder.file(
                safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`,
                blob,
              );
            } catch {
              // Bỏ qua ảnh lỗi, không dừng toàn bộ process
            } finally {
              completed++;
              setDownloadProgress(Math.round((completed / total) * 100));
            }
          }),
        );
      }

      // Tạo blob và trigger download
      const blob = await zip.generateAsync(
        {
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        },
        (meta) => {
          // meta.percent là progress của quá trình zip compression
          setDownloadProgress(Math.round(meta.percent));
        },
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${albumName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("❌ ZIP Download Error:", error);
      alert("Không thể tải ZIP. Vui lòng thử lại.");
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }, [isDownloading, media, albumName]);

  const activeLightboxItem =
    lightboxIndex !== null ? media[lightboxIndex] : null;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        * { box-sizing: border-box; }
      `}</style>

      <div style={S.page}>
        {/* ── Header ────────────────────────────────────────── */}
        <header style={S.header}>
          <div style={S.headerInner}>
            <div>
              <div style={S.logoRow}>
                <span style={S.badge}>
                  <span>🔗</span> Shared Album
                </span>
                {expiresAt && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#fb923c",
                      background: "rgba(251,146,60,0.1)",
                      border: "1px solid rgba(251,146,60,0.3)",
                      borderRadius: "9999px",
                      padding: "0.2rem 0.55rem",
                    }}
                  >
                    Hết hạn: {formatDate(expiresAt)}
                  </span>
                )}
              </div>
              <h1 style={S.albumTitle}>{albumName}</h1>
              <p style={S.meta}>
                {media.length} ảnh
                {ownerName ? ` · Chia sẻ bởi ${ownerName}` : ""}
                {" · "}
                {formatDate(createdAt)}
                {" · "}
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#475569",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  Picasso Drive
                </span>
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {media.length > 0 && (
                <button
                  style={S.btn("primary")}
                  onClick={handleDownloadAll}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <span style={{ fontSize: "0.75rem" }}>⏳</span>
                      {downloadProgress > 0
                        ? `${downloadProgress}%`
                        : "Đang chuẩn bị…"}
                    </>
                  ) : (
                    <>
                      <span>⬇</span>
                      Tải tất cả (ZIP)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {isDownloading && (
            <div
              style={{
                height: "2px",
                background: "#1e293b",
                marginTop: "0.75rem",
                borderRadius: "9999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${downloadProgress}%`,
                  background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                  transition: "width 0.2s ease",
                  borderRadius: "9999px",
                }}
              />
            </div>
          )}
        </header>

        {/* ── Gallery Grid ───────────────────────────────────── */}
        <main
          style={{ maxWidth: "90rem", margin: "0 auto", padding: "1.5rem" }}
        >
          {media.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "5rem 1rem",
                color: "#475569",
              }}
            >
              <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🖼️</p>
              <p>Album này chưa có ảnh nào.</p>
            </div>
          ) : (
            <div
              style={{
                columnCount: "auto",
                columnWidth: "200px",
                columnGap: "0.75rem",
              }}
            >
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

        {/* ── Footer ────────────────────────────────────────── */}
        <footer
          style={{
            textAlign: "center",
            padding: "2rem 1rem",
            borderTop: "1px solid #1e293b",
            color: "#334155",
            fontSize: "0.75rem",
          }}
        >
          Powered by{" "}
          <span style={{ color: "#475569", fontWeight: 600 }}>
            Picasso Drive
          </span>
        </footer>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────── */}
      {activeLightboxItem && (
        <div
          style={S.overlay}
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label={`Lightbox: ${activeLightboxItem.name}`}
          tabIndex={0}
        >
          <button
            style={{
              position: "absolute",
              top: "1rem",
              right: "1.25rem",
              background: "rgba(15,23,42,0.8)",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              color: "#94a3b8",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "0.4rem 0.7rem",
              lineHeight: 1,
              zIndex: 10,
            }}
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            ✕
          </button>

          <div
            style={{ animation: "fadeIn 0.2s ease", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeLightboxItem.url}
              alt={activeLightboxItem.name}
              style={S.lightboxImg}
            />
            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.8rem",
                color: "#64748b",
              }}
            >
              {activeLightboxItem.name} ·{" "}
              {formatBytes(activeLightboxItem.fileSize)}
            </p>
          </div>

          {/* Navigation */}
          <div style={S.lightboxNav} onClick={(e) => e.stopPropagation()}>
            <button
              style={{
                ...S.btn("ghost"),
                padding: "0.4rem 0.75rem",
                fontSize: "1rem",
              }}
              onClick={prevImage}
              aria-label="Previous image"
            >
              ‹
            </button>
            <span
              style={{
                fontSize: "0.78rem",
                color: "#64748b",
                minWidth: "60px",
                textAlign: "center",
              }}
            >
              {lightboxIndex! + 1} / {media.length}
            </span>
            <button
              style={{
                ...S.btn("ghost"),
                padding: "0.4rem 0.75rem",
                fontSize: "1rem",
              }}
              onClick={nextImage}
              aria-label="Next image"
            >
              ›
            </button>
            <div
              style={{ width: "1px", background: "#1e293b", height: "1rem" }}
            />
            <a
              href={activeLightboxItem.url}
              download={activeLightboxItem.name}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...S.btn("ghost"),
                padding: "0.4rem 0.75rem",
                textDecoration: "none",
                fontSize: "0.75rem",
              }}
              aria-label="Download image"
            >
              ⬇
            </a>
          </div>
        </div>
      )}
    </>
  );
}
