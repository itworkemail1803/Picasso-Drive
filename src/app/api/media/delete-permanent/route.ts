import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { mediaIds } = await req.json();

    // Xóa record trong DB
    await prisma.media.deleteMany({
      where: {
        id: { in: mediaIds },
        userId: userId,
      },
    });

    // GỢI Ý: Nếu bạn dùng UploadThing hoặc AWS S3,
    // hãy thêm hàm xóa file ở đây trước khi xóa record DB.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE_PERMANENT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
