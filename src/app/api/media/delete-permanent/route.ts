import { auth } from "@/app/api/auth/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { mediaIds } = await req.json();

    await prisma.media.deleteMany({
      where: {
        id: { in: mediaIds },
        userId: userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE_PERMANENT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
