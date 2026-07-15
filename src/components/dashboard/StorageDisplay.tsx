"use client";

import { useStorageStore } from "@/store/useStorageStore";
import { useEffect } from "react";

const TOTAL_LIMIT = 10 * 1024 * 1024 * 1024; // 10 GB

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const decimals = i >= 3 ? 2 : 0;
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function StorageDisplay() {
  // ── Chỉ subscribe useStorageStore, không kéo cả useAlbumStore re-render ──
  const storageUsed = useStorageStore((s) => s.storageUsed);
  const fetchStorageUsage = useStorageStore((s) => s.fetchStorageUsage);

  useEffect(() => {
    fetchStorageUsage();
  }, [fetchStorageUsage]);

  const percentage = Math.min((storageUsed / TOTAL_LIMIT) * 100, 100);
  const isCritical = percentage > 90;
  const isWarning = percentage > 70;

  return (
    <div className="mx-4 my-6 rounded-lg bg-slate-900 p-4 border border-slate-800">
      <div className="flex justify-between text-xs text-slate-400 mb-2">
        <span className="font-medium">Storage</span>
        <span className="font-mono tabular-nums">
          {formatBytes(storageUsed)}{" "}
          <span className="text-slate-600">/ 10 GB</span>
        </span>
      </div>

      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isCritical
              ? "bg-rose-500"
              : isWarning
                ? "bg-amber-500"
                : "bg-emerald-500"
          }`}
          style={{ width: `${Math.max(percentage, 0.5)}%` }}
        />
      </div>

      <p className="text-[10px] text-slate-500 mt-1.5 tabular-nums">
        {percentage < 0.1 ? "< 0.1" : percentage.toFixed(1)}% used
        {isCritical && (
          <span className="ml-1.5 text-rose-500 font-medium">
            · Running low
          </span>
        )}
      </p>
    </div>
  );
}
