"use client";

import { useMemo } from "react";

// Mảng các chiều cao ngẫu nhiên chuẩn tỉ lệ ảnh (Portrait, Landscape, Square)
const SKELETON_HEIGHTS = [
  "h-48", // ~192px (Ảnh ngang/mảnh)
  "h-64", // ~256px (Ảnh vuông)
  "h-72", // ~288px (Ảnh đứng vừa)
  "h-80", // ~320px (Ảnh chân dung cao)
  "h-[400px]", // Ảnh siêu dọc
];

interface ImageSkeletonProps {
  // Mượn trường bất kỳ mang tính duy nhất (như item.id) để làm hạt giống (seed) random cố định
  seed?: string;
}

export function ImageSkeleton({ seed }: ImageSkeletonProps): JSX.Element {
  // Chiến thuật tạo chiều cao ngẫu nhiên nhưng CỐ ĐỊNH cho mỗi bức ảnh, tránh bị giật khi re-render
  const randomHeight = useMemo(() => {
    if (!seed) return SKELETON_HEIGHTS[1]; // Mặc định nếu không có seed

    // Thuật toán băm chuỗi (hashing) đơn giản từ chuỗi ID để lấy ra index index trong mảng
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SKELETON_HEIGHTS.length;
    return SKELETON_HEIGHTS[index];
  }, [seed]);

  return (
    <div
      aria-hidden="true"
      /* 🎯 CẬP NHẬT KIẾN TRÚC SKELETON:
       * - Thay vì `absolute inset-0`, ta dùng `relative` kết hợp chiều cao random động.
       * - Hạ tone màu xuống dải màu tối sâu `from-slate-900 via-slate-800/50 to-slate-900` chuẩn Art Gallery.
       */
      className={`w-full ${randomHeight} animate-pulse rounded-xl bg-gradient-to-br from-slate-900 via-slate-800/50 to-slate-900`}
    />
  );
}
