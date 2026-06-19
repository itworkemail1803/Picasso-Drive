import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Định nghĩa các route công khai
const isPublicRoute = createRouteMatcher([
  "/", // Trang chủ (nơi chứa SignIn)
  "/sign-in(.*)", // Cho phép các route con của sign-in
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Nếu KHÔNG phải route công khai, thì chặn lại yêu cầu đăng nhập
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Bỏ qua các file tĩnh, cho phép next.js tối ưu hóa
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)).*)",
    // Chạy middleware cho tất cả các route còn lại
    "/(api|trpc)(.*)",
  ],
};
