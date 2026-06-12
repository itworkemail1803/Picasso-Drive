import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // 1. Lấy userId trực tiếp từ session Clerk
    const { userId: authedUserId } = await auth();
    if (!authedUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, fileName, originalSize, storageSize, albumId, filePath } =
      body;

    // Validate dữ liệu đầu vào theo cấu trúc mới
    if (!imageUrl || !fileName || !storageSize || !filePath) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc để ghi nhận vào Database" },
        { status: 400 },
      );
    }

    // 2. CHIẾN THUẬT DẬP LỖI VALIDATION: Kiểm tra xem User đã có trong Postgres chưa
    const existingUser = await prisma.user.findUnique({
      where: { id: authedUserId },
    });

    // Nếu chưa tồn tại -> Lấy email thật từ Clerk để khởi tạo
    if (!existingUser) {
      console.log(
        `[Picasso Drive] Đang đồng bộ thông tin tài khoản cho ID: ${authedUserId}`,
      );

      const clerkUser = await currentUser();
      // Lấy email đầu tiên trong danh sách email của Clerk, nếu xui rủi không có thì dùng chuỗi tạm
      const userEmail =
        clerkUser?.emailAddresses[0]?.emailAddress ||
        `${authedUserId}@clerk.local`;

      await prisma.user.create({
        data: {
          id: authedUserId,
          email: userEmail, // 🎯 Đã có email bắt buộc, không còn lo lỗi Prisma nữa!
        },
      });
    }

    // 3. Ghi chính xác các trường dữ liệu theo đúng file schema.prisma của bạn
    const newMedia = await prisma.media.create({
      data: {
        userId: authedUserId,
        url: imageUrl,
        filePath: filePath,
        name: fileName,
        originalSize: Number(originalSize || storageSize),
        storageSize: Number(storageSize),
        albumId:
          albumId && albumId !== "all" && albumId !== "uploads"
            ? albumId
            : null,
      },
    });

    // 4. Trả về đúng cấu trúc MediaItem của Client để UI hiển thị lập tức
    return NextResponse.json(
      {
        message: "Lưu thông tin ảnh thành công!",
        item: {
          id: newMedia.id,
          name: newMedia.name,
          albumId: newMedia.albumId || "all",
          createdAt: newMedia.createdAt.toISOString(),
          fileSize: newMedia.storageSize,
          originalSize: newMedia.originalSize,
          mimeType: "image/png",
          previewUrl: newMedia.url,
          isDeleted: false,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Lỗi API /api/media/save:", error);
    return NextResponse.json(
      {
        error: "Lỗi máy chủ nội bộ khi lưu dữ liệu ảnh.",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
