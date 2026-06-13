import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// ──────────────────────────────────────────────────────────────
// POST /api/share  → Tạo share link mới (cần đăng nhập)
// ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { albumId, label, expiresAt } = body as {
      albumId?: string;
      label?: string;
      expiresAt?: string | null;
    };

    if (!albumId || typeof albumId !== "string") {
      return NextResponse.json(
        { error: "Thiếu thông tin albumId" },
        { status: 400 },
      );
    }

    // Kiểm tra quyền sở hữu album
    const album = await prisma.album.findFirst({
      where: { id: albumId, userId },
    });

    if (!album) {
      return NextResponse.json(
        { error: "Album không tồn tại hoặc không thuộc quyền của bạn" },
        { status: 404 },
      );
    }

    const sharedLink = await prisma.sharedLink.create({
      data: {
        albumId,
        userId,
        label: label?.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    console.log(`✅ [API] Đã tạo share link: ${sharedLink.id} cho album: ${albumId}`);

    return NextResponse.json(
      {
        id: sharedLink.id,
        albumId: sharedLink.albumId,
        label: sharedLink.label,
        expiresAt: sharedLink.expiresAt?.toISOString() ?? null,
        createdAt: sharedLink.createdAt.toISOString(),
        shareUrl: `/share/${sharedLink.id}`,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("❌ [API] POST /api/share Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}

// ──────────────────────────────────────────────────────────────
// GET /api/share  → Lấy danh sách share links của user (cần đăng nhập)
// ──────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const links = await prisma.sharedLink.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { album: { select: { name: true } } },
    });

    const formatted = links.map((link) => ({
      id: link.id,
      albumId: link.albumId,
      albumName: link.album.name,
      label: link.label,
      expiresAt: link.expiresAt?.toISOString() ?? null,
      createdAt: link.createdAt.toISOString(),
      shareUrl: `/share/${link.id}`,
    }));

    return NextResponse.json({ links: formatted });
  } catch (error: any) {
    console.error("❌ [API] GET /api/share Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}

// ──────────────────────────────────────────────────────────────
// DELETE /api/share  → Thu hồi share link (cần đăng nhập)
// ──────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { shareId } = await req.json();
    if (!shareId || typeof shareId !== "string") {
      return NextResponse.json({ error: "Thiếu shareId" }, { status: 400 });
    }

    // Chỉ cho phép xóa link của chính mình
    const link = await prisma.sharedLink.findFirst({
      where: { id: shareId, userId },
    });

    if (!link) {
      return NextResponse.json(
        { error: "Share link không tồn tại hoặc không thuộc quyền của bạn" },
        { status: 404 },
      );
    }

    await prisma.sharedLink.delete({ where: { id: shareId } });
    console.log(`✅ [API] Đã thu hồi share link: ${shareId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ [API] DELETE /api/share Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
