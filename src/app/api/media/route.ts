import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const search = searchParams.get("search") || "";
    const albumId = searchParams.get("albumId") || "all";
    const sortBy = searchParams.get("sortBy") || "date-desc";

    const whereCondition: any = { userId: userId };
    if (search) whereCondition.name = { contains: search, mode: "insensitive" };
    if (albumId && albumId !== "all" && albumId !== "uploads")
      whereCondition.albumId = albumId;

    const sortMap: Record<string, any> = {
      "date-desc": { createdAt: "desc" },
      "date-asc": { createdAt: "asc" },
      "size-asc": { size: "asc" },
      "size-desc": { size: "desc" },
      "name-asc": { name: "asc" },
    };

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where: whereCondition,
        orderBy: sortMap[sortBy] || { createdAt: "desc" },
        take: limit,
        skip: skip,
        select: {
          id: true,
          name: true,
          albumId: true,
          createdAt: true,
          size: true,
          originalSize: true,
          url: true,
          isDeleted: true,
        },
      }),
      prisma.media.count({ where: whereCondition }),
    ]);

    const formattedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      albumId: item.albumId || "all",
      createdAt: item.createdAt.toISOString(),
      fileSize: Number(item.size || 0), // BigInt → Number
      originalSize: Number(item.originalSize || 0),
      previewUrl: item.url,
      isDeleted: item.isDeleted,
      mimeType: "image/png",
    }));

    return NextResponse.json({ items: formattedItems, total });
  } catch (error: any) {
    console.error("❌ [API] GET /api/media Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
