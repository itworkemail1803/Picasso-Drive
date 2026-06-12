import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    console.log("🔍 [API] PATCH /api/media/update-album Clerk UserId:", userId);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Bạn cần đăng nhập để thực hiện" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { mediaIds, albumId } = body;

    if (!mediaIds || !Array.isArray(mediaIds) || !albumId) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu mediaIds hoặc albumId" },
        { status: 400 },
      );
    }

    const isTrash = albumId === "trash";
    const isAll = albumId === "all";

    // 1. Kiểm tra quyền sở hữu Album đích (nếu không phải là trash hay all)
    if (!isTrash && !isAll) {
      const album = await prisma.album.findFirst({
        where: {
          id: albumId,
          userId: userId,
        },
      });

      if (!album) {
        return NextResponse.json(
          {
            error: "Album không tồn tại hoặc không thuộc quyền sở hữu của bạn",
          },
          { status: 404 },
        );
      }
    }

    // 2. Cập nhật trạng thái của các ảnh trong danh sách truyền lên và thuộc sở hữu của user
    const updatePayload = {
      albumId: isTrash || isAll ? null : albumId,
      isDeleted: isTrash,
    };

    const updateResult = await prisma.media.updateMany({
      where: {
        id: { in: mediaIds },
        userId: userId,
      },
      data: updatePayload,
    });

    console.log(
      `✅ [API] Đã cập nhật thành công ${updateResult.count} media items.`,
    );

    return NextResponse.json({ success: true, count: updateResult.count });
  } catch (err: any) {
    console.error("❌ [API] PATCH update-album Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 },
    );
  }
}
