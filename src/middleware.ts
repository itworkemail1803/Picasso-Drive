import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Bỏ qua các API nội bộ và tĩnh
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // Bỏ qua nếu là public route
  if (!isPublicRoute(request)) {
    // Để Next.js tự xử lý xác thực trên các route API với auth() bên trong route.ts
    // Tuy nhiên nếu bạn muốn ép đăng nhập cho tất cả các route khác, bạn có thể gọi:
    // await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
