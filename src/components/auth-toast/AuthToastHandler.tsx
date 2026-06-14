"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export function AuthToastHandler() {
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    // Kiểm tra đã load xong và đang đăng nhập
    if (isLoaded && isSignedIn) {
      toast.success(
        "Đăng nhập thành công! Chào mừng bạn đến với Picasso Drive.",
      );
    }
  }, [isLoaded, isSignedIn]);

  return null; // Component này không render gì ra giao diện
}
