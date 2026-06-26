import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để tạo album" },
        { status: 401 },
      );
    }

    const { name } = await req.json();

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Tên album không hợp lệ" },
        { status: 400 },
      );
    }

    const randomSuffix = Date.now().toString().slice(-4);
    const slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${randomSuffix}`;

    const newAlbum = await prisma.album.create({
      data: {
        name: name.trim(),
        slug: slug,
        userId: userId,
      },
    });

    return NextResponse.json(newAlbum, { status: 201 });
  } catch (error) {
    console.error("❌ CHI TIẾT LỖI TẠO ALBUM:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tạo album trong cơ sở dữ liệu." },
      { status: 500 },
    );
  }
}
