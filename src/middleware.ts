import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Định nghĩa các route được phép truy cập tự do không cần đăng nhập
// Bạn có thể thêm các route khác vào đây nếu muốn public
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Nếu muốn tạm thời mở khóa các API để test, hãy bỏ comment dòng dưới:
  // '/api/(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Bỏ qua các file tĩnh nội bộ của Next.js và các file media (png, jpg, favicon...)
    "/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest))).*",
    // Luôn luôn chạy qua middleware cho các route API và tệp Server Actions
    "/(api|trpc)(.*)",
  ],
};
