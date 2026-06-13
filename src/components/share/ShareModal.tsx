"use client";

import { useCallback, useState } from "react";
import type { SharedLink, ShareExpiryOption } from "@/types/share.types";
import clsx from "clsx";

// ──────────────────────────────────────────────────────────────
// ShareModal — Quản lý và tạo share link cho một album cụ thể
// ──────────────────────────────────────────────────────────────

interface ShareModalProps {
  albumId: string;
  albumName: string;
  isOpen: boolean;
  onClose: () => void;
}

const EXPIRY_OPTIONS: { value: ShareExpiryOption; label: string }[] = [
  { value: "never", label: "Không hết hạn" },
  { value: "1d", label: "1 ngày" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
];

function expiryToDate(option: ShareExpiryOption): string | null {
  if (option === "never") return null;
  const ms = { "1d": 864e5, "7d": 6048e5, "30d": 2592e6 }[option];
  return new Date(Date.now() + ms).toISOString();
}

function formatExpiry(iso: string | null): string {
  if (!iso) return "Không hết hạn";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getBaseUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function ShareModal({
  albumId,
  albumName,
  isOpen,
  onClose,
}: ShareModalProps): JSX.Element | null {
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [expiry, setExpiry] = useState<ShareExpiryOption>("never");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lấy danh sách link khi modal mở
  const fetchLinks = useCallback(async () => {
    if (hasFetched) return;
    setIsFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/share");
      if (!res.ok) throw new Error("Không thể tải danh sách link");
      const data = await res.json();
      // Chỉ hiển thị link thuộc album hiện tại
      setLinks(
        (data.links as any[])
          .filter((l) => l.albumId === albumId)
          .map((l) => ({
            id: l.id,
            albumId: l.albumId,
            userId: l.userId ?? "",
            label: l.label,
            expiresAt: l.expiresAt,
            createdAt: l.createdAt,
          })),
      );
      setHasFetched(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  }, [albumId, hasFetched]);

  // Gọi fetch khi open
  const handleOpen = useCallback(() => {
    setHasFetched(false);
    setLinks([]);
    fetchLinks();
  }, [fetchLinks]);

  if (!isOpen) return null;

  // Lazy call on first render when modal becomes open
  if (isOpen && !hasFetched && !isFetching) {
    handleOpen();
  }

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId,
          label: label.trim() || null,
          expiresAt: expiryToDate(expiry),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Tạo link thất bại");
      }
      const newLink = await res.json();
      setLinks((prev) => [
        {
          id: newLink.id,
          albumId: newLink.albumId,
          userId: "",
          label: newLink.label,
          expiresAt: newLink.expiresAt,
          createdAt: newLink.createdAt,
        },
        ...prev,
      ]);
      setLabel("");
      setExpiry("never");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      const res = await fetch("/api/share", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId }),
      });
      if (!res.ok) throw new Error("Xóa link thất bại");
      setLinks((prev) => prev.filter((l) => l.id !== shareId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCopy = async (shareId: string) => {
    const url = `${getBaseUrl()}/share/${shareId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="w-full max-w-lg rounded-2xl border border-slate-800/60 bg-slate-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/50 px-5 py-4">
            <div>
              <h2
                id="share-modal-title"
                className="text-sm font-bold text-slate-100"
              >
                Chia sẻ Album
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                <span className="text-blue-400">{albumName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
              aria-label="Đóng modal"
            >
              ✕
            </button>
          </div>

          <div className="space-y-5 p-5">
            {/* Create new link */}
            <div className="space-y-3 rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tạo link mới
              </p>

              <input
                type="text"
                placeholder="Nhãn (tùy chọn, VD: Khách hàng A)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={60}
                className="h-9 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500/50 transition"
              />

              <div className="flex gap-1.5">
                {EXPIRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setExpiry(opt.value)}
                    className={clsx(
                      "flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition",
                      expiry === opt.value
                        ? "border-blue-500/50 bg-blue-600/20 text-blue-300"
                        : "border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="h-9 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
              >
                {isCreating ? "Đang tạo…" : "Tạo Public Link"}
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-lg border border-rose-800/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
                ⚠️ {error}
              </p>
            )}

            {/* Active links list */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Link hiện có
                {links.length > 0 && (
                  <span className="ml-1.5 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                    {links.length}
                  </span>
                )}
              </p>

              {isFetching ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-lg bg-slate-800/50"
                    />
                  ))}
                </div>
              ) : links.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-800 py-5 text-center text-xs text-slate-600">
                  Chưa có link nào. Tạo link đầu tiên ở trên.
                </p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {links.map((link) => {
                    const isExpired =
                      link.expiresAt !== null &&
                      new Date() > new Date(link.expiresAt);
                    const shareUrl = `${getBaseUrl()}/share/${link.id}`;

                    return (
                      <div
                        key={link.id}
                        className={clsx(
                          "flex items-center gap-2 rounded-xl border bg-slate-950/50 px-3 py-2.5 transition",
                          isExpired
                            ? "border-rose-900/40 opacity-60"
                            : "border-slate-800/60",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 truncate text-xs font-medium text-slate-300">
                            {isExpired && (
                              <span className="rounded bg-rose-950 px-1 py-0.5 text-[10px] font-semibold text-rose-400">
                                Hết hạn
                              </span>
                            )}
                            {link.label || (
                              <span className="text-slate-600">Không có nhãn</span>
                            )}
                          </p>
                          <p className="mt-0.5 truncate font-mono text-[10px] text-slate-600">
                            {shareUrl}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-600">
                            {formatExpiry(link.expiresAt)}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex shrink-0 gap-1">
                          <button
                            onClick={() => handleCopy(link.id)}
                            className={clsx(
                              "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition",
                              copiedId === link.id
                                ? "bg-emerald-600/20 text-emerald-400"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-100",
                            )}
                            title="Copy link"
                          >
                            {copiedId === link.id ? "✓ Đã copy" : "Copy"}
                          </button>
                          <button
                            onClick={() => handleRevoke(link.id)}
                            className="rounded-lg bg-slate-800 px-2 py-1.5 text-[11px] text-slate-500 transition hover:bg-rose-950/50 hover:text-rose-300"
                            title="Thu hồi link"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
