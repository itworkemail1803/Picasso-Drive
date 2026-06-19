import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Cấu hình các route công khai (trang chủ và luồng auth/webhook của Clerk)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk(.*)",
  "/share(.*)", // ← Trang xem ảnh public
  "/api/share/:shareId(.*)", // ← Public read endpoint (GET only)
]);

// 🌟 Thay "export default clerkMiddleware" thành named export "proxy" phù hợp tiêu chuẩn mới
export const proxy = clerkMiddleware(async (auth, request) => {
  try {
    // 1. Lấy thông tin xác thực từ Clerk
    const { userId } = await auth();

    // 2. Nếu là route bảo mật mà chưa có userId -> Chặn đứng ngay
    if (!isPublicRoute(request) && !userId) {
      // Nếu là request gọi API, trả về lỗi 401 Unauthorized
      if (request.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Nếu là các trang giao diện phát sinh khác, đá về trang chủ để yêu cầu login
      const signInUrl = new URL("/", request.url);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("❌ Clerk Middleware Error:", error);
    // Trả về 401/403 thay vì 500 khi Clerk gặp lỗi (ví dụ: dùng dev keys ở prod)
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Authentication Error" }, { status: 401 });
    }
    const signInUrl = new URL("/", request.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    // 🎯 Đảm bảo chạy qua proxy cho TẤT CẢ các route, trừ file tĩnh hẳn
    "/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
