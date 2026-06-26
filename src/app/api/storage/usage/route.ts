import { auth } from "@/app/api/auth/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth(); // <-- Lấy session
    const userId = session?.user?.id; // <-- Lấy ID user

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // Sử dụng aggregate để tính tổng size
    const usage = await prisma.media.aggregate({
      where: { userId: userId },
      _sum: {
        size: true,
      },
    });

    // BigInt cần chuyển về kiểu Number hoặc String để JSON trả về được
    const totalBytes = Number(usage._sum.size || 0);

    return NextResponse.json({
      used: totalBytes,
    });
  } catch (error: any) {
    console.error("Storage API Error:", error);
    return NextResponse.json(
      { error: "Internal Error", details: error.message },
      { status: 500 },
    );
  }
}
