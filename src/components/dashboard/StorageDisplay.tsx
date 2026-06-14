"use client";

import { useAlbumStore } from "@/store/useAlbumStore";
import { useEffect } from "react";

export function StorageDisplay() {
  const { storageUsed, fetchStorageUsage } = useAlbumStore();

  const TOTAL_LIMIT = 10 * 1024 * 1024 * 1024; // 10 GB

  useEffect(() => {
    fetchStorageUsage();
  }, [fetchStorageUsage]);

  // Hàm thông minh để định dạng dung lượng
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // Nếu là GB thì lấy 2 chữ số thập phân, còn lại lấy 0 hoặc 1 chữ số cho gọn
    const decimals = i >= 3 ? 2 : 0;
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  };

  const percentage = Math.min((storageUsed / TOTAL_LIMIT) * 100, 100);

  return (
    <div className="mx-4 my-6 rounded-lg bg-slate-900 p-4 border border-slate-800">
      <div className="flex justify-between text-xs text-slate-400 mb-2">
        <span className="font-medium">Dung lượng</span>
        {/* Gọi hàm formatBytes ở đây */}
        <span>{formatBytes(storageUsed)} / 10 GB</span>
      </div>

      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${percentage > 90 ? "bg-rose-500" : "bg-emerald-500"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-[10px] text-slate-500 mt-2">
        {/* Hiển thị % chi tiết hơn nếu nó quá nhỏ */}
        Đã sử dụng {percentage < 0.1 ? "< 0.1" : percentage.toFixed(1)}%
      </p>
    </div>
  );
}
