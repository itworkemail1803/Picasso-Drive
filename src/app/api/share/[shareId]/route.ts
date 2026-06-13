import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ──────────────────────────────────────────────────────────────
// GET /api/share/[shareId]  → Public endpoint, KHÔNG cần đăng nhập
// Trả về metadata album + danh sách ảnh để trang /share/[shareId] render
// ──────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> },
) {
  try {
    const { shareId } = await params;

    if (!shareId) {
      return NextResponse.json({ error: "Share ID không hợp lệ" }, { status: 400 });
    }

    const link = await prisma.sharedLink.findUnique({
      where: { id: shareId },
      include: {
        album: {
          select: {
            id: true,
            name: true,
            media: {
              where: { isDeleted: false },
              select: {
                id: true,
                name: true,
                url: true,
                storageSize: true,
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        user: {
          select: { name: true },
        },
      },
    });

    // Không tìm thấy
    if (!link) {
      return NextResponse.json({ error: "Share link không tồn tại" }, { status: 404 });
    }

    // Kiểm tra hết hạn
    if (link.expiresAt && new Date() > link.expiresAt) {
      return NextResponse.json(
        { error: "Share link đã hết hạn", expired: true },
        { status: 410 },
      );
    }

    const data = {
      shareId: link.id,
      albumName: link.album.name,
      ownerName: link.user.name ?? null,
      createdAt: link.createdAt.toISOString(),
      expiresAt: link.expiresAt?.toISOString() ?? null,
      media: link.album.media.map((m) => ({
        id: m.id,
        name: m.name,
        url: m.url,
        fileSize: m.storageSize,
      })),
    };

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ [API] GET /api/share/[shareId] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
