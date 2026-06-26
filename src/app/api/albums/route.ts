import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Bạn cần đăng nhập để lấy danh sách album" },
        { status: 401 },
      );
    }

    let albums = await prisma.album.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    if (albums.length === 0) {
      console.log(`🌱 [API] Seeding default albums for user: ${userId}`);

      const defaultAlbumsToCreate = [
        { name: "Portraits", slug: `portraits-${userId.slice(-6)}` },
        { name: "Landscape", slug: `landscape-${userId.slice(-6)}` },
        { name: "Street", slug: `street-${userId.slice(-6)}` },
        { name: "Fashion", slug: `fashion-${userId.slice(-6)}` },
        { name: "Uploads", slug: `uploads-${userId.slice(-6)}` },
      ];

      await prisma.album.createMany({
        data: defaultAlbumsToCreate.map((alb) => ({
          name: alb.name,
          slug: alb.slug,
          userId: userId,
        })),
      });

      albums = await prisma.album.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json(albums);
  } catch (error: any) {
    console.error("❌ [API] GET /api/albums Error:", error);
    return NextResponse.json(
      {
        error: "Đã có lỗi xảy ra khi lấy danh sách album",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Bạn cần đăng nhập để thực hiện" },
        { status: 401 },
      );
    }

    const { albumId } = await req.json();

    if (!albumId) {
      return NextResponse.json(
        { error: "Thiếu thông tin albumId" },
        { status: 400 },
      );
    }

    const album = await prisma.album.findFirst({
      where: {
        id: albumId,
        userId: userId,
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: "Album không tồn tại hoặc không thuộc quyền sở hữu của bạn" },
        { status: 404 },
      );
    }

    await prisma.album.delete({
      where: {
        id: albumId,
      },
    });

    console.log(`✅ [API] Đã xóa thành công album: ${albumId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ [API] DELETE /api/albums Error:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi xóa album", details: error.message },
      { status: 500 },
    );
  }
}
