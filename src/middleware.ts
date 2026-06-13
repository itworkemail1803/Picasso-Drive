import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Cấu hình các route công khai (trang chủ và luồng auth/webhook của Clerk)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk(.*)",
  "/share(.*)",              // ← Trang xem ảnh public
  "/api/share/:shareId(.*)", // ← Public read endpoint (GET only)
]);

export default clerkMiddleware(async (auth, request) => {
  // 1. Lấy thông tin xác thực từ Clerk
  const { userId } = await auth();

  // 2. Nếu là route bảo mật (ví dụ: các API lưu DB, tạo album...) mà chưa có userId -> Chặn đứng ngay
  if (!isPublicRoute(request) && !userId) {
    // Nếu là request gọi API, trả về lỗi 411 Unauthorized thay vì redirect giao diện
    if (request.nextUrl.pathname.startsWith("/api")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Nếu là các trang giao diện phát sinh khác, đá về trang chủ để yêu cầu login
    const signInUrl = new URL("/", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // 🎯 Đảm bảo chạy qua middleware cho TẤT CẢ các route, trừ file tĩnh hẳn
    "/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
