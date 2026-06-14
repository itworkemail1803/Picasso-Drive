import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db"; // File mà chúng ta đã tạo ở bước trước
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // Sử dụng aggregate để tính tổng size
    const usage = await db.media.aggregate({
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
  } catch (error) {
    console.error("Storage API Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
