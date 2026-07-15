import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { albumId, name } = body;

    if (!albumId || typeof albumId !== "string") {
      return NextResponse.json({ error: "Thiếu albumId" }, { status: 400 });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Tên album không hợp lệ" },
        { status: 400 },
      );
    }

    // Kiểm tra album thuộc quyền sở hữu của user
    const album = await prisma.album.findFirst({
      where: { id: albumId, userId },
    });

    if (!album) {
      return NextResponse.json(
        { error: "Album không tồn tại hoặc không thuộc quyền của bạn" },
        { status: 404 },
      );
    }

    const updated = await prisma.album.update({
      where: { id: albumId },
      data: { name: name.trim() },
    });

    return NextResponse.json({ id: updated.id, name: updated.name });
  } catch (error: any) {
    console.error("❌ [API] PATCH /api/albums/rename Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
