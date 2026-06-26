"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export function AuthToastHandler() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Trạng thái 'authenticated' nghĩa là đã đăng nhập thành công
    if (status === "authenticated" && session?.user) {
      toast.success(
        "Đăng nhập thành công! Chào mừng bạn đến với Picasso Drive.",
      );
    }
  }, [status, session]);

  return null; // Component này không render gì ra giao diện
}
