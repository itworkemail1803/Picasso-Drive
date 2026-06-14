import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface PrismaMediaItem {
  id: string;
  userId: string;
  albumId: string | null;
  name: string;
  url: string;
  filePath: string;
  originalSize: number;
  size: number;
  createdAt: Date;
  isDeleted: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Missing User ID" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const albumId = searchParams.get("albumId") || "all";
    const sortBy = searchParams.get("sortBy") || "date-desc";

    const whereCondition: any = {
      userId: userId,
    };

    if (search) {
      whereCondition.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (albumId && albumId !== "all" && albumId !== "uploads") {
      whereCondition.albumId = albumId;
    }

    let orderByCondition: any = { createdAt: "desc" };
    if (sortBy === "date-asc") orderByCondition = { createdAt: "asc" };
    if (sortBy === "date-desc") orderByCondition = { createdAt: "desc" };
    if (sortBy === "size-asc") orderByCondition = { size: "asc" };
    if (sortBy === "size-desc") orderByCondition = { size: "desc" };
    if (sortBy === "name-asc") orderByCondition = { name: "asc" };

    const mediaItems = await prisma.media.findMany({
      where: whereCondition,
      orderBy: orderByCondition,
    });

    const formattedItems = (mediaItems as PrismaMediaItem[]).map((item) => ({
      id: item.id,
      name: item.name,
      albumId: item.albumId || "all",
      createdAt: item.createdAt.toISOString(),

      // Ép kiểu chắc chắn cho cả size và originalSize
      fileSize: Number(item.size || 0),
      originalSize: Number(item.originalSize || 0),

      mimeType: "image/png",
      previewUrl: item.url,
      isDeleted: item.isDeleted,
    }));

    return NextResponse.json({
      items: formattedItems,
      total: formattedItems.length,
    });
  } catch (error: any) {
    console.error("[API_MEDIA_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
