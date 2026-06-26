import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, fileName, originalSize, size, albumId, filePath } = body;

    if (!imageUrl || !fileName || !size || !filePath) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc để ghi nhận vào Database" },
        { status: 400 },
      );
    }

    const newMedia = await prisma.media.create({
      data: {
        userId: userId,
        url: imageUrl,
        filePath: filePath,
        name: fileName,
        originalSize: Number(originalSize || size || 0),
        size: BigInt(size ?? 0),
        albumId:
          albumId && albumId !== "all" && albumId !== "uploads"
            ? albumId
            : null,
      },
    });

    return NextResponse.json(
      {
        message: "Lưu thông tin ảnh thành công!",
        item: {
          id: newMedia.id,
          name: newMedia.name,
          albumId: newMedia.albumId || "all",
          createdAt: newMedia.createdAt.toISOString(),
          fileSize: Number(newMedia.size),
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
