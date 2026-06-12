import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Đảm bảo đường dẫn đúng

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { mediaIds } = await req.json();

    await prisma.media.updateMany({
      where: {
        id: { in: mediaIds },
        userId: userId,
      },
      data: {
        isDeleted: false,
        // Có thể gán lại albumId về null hoặc album mặc định
        albumId: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RESTORE_MEDIA]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
