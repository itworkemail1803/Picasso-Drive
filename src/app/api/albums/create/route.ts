import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 1. Lấy thông tin xác thực từ Clerk
    const { userId } = await auth();
    console.log("🔍 [DEBUG] Clerk UserId nhận được:", userId);
    const user = await currentUser();

    if (!userId || !user) {
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

    // 2. Upsert User: Đảm bảo User tồn tại trong DB trước khi tạo Album
    // Điều này fix lỗi P2003 (Foreign Key Constraint)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: user.emailAddresses[0]?.emailAddress || "",
      },
    });

    // 3. Tạo slug duy nhất: Thêm timestamp để tránh lỗi P2002 (Unique constraint)
    const randomSuffix = Date.now().toString().slice(-4);
    const slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${randomSuffix}`;

    // 4. Tạo Album trong DB
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
