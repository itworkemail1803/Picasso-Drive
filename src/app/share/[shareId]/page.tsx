import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShareGallery } from "./ShareGallery";

// ──────────────────────────────────────────────────────────────
// ⚠️ TRANG NÀY HOÀN TOÀN ĐỘC LẬP VỚI DASHBOARD
// - Không import bất kỳ component nào từ @/components/dashboard
// - Không dùng Zustand store, không dùng Clerk auth
// - Server Component — query Prisma trực tiếp
// ──────────────────────────────────────────────────────────────

type SharePageProps = {
  params: Promise<{ shareId: string }>;
};

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { shareId } = await params;
  const link = await prisma.sharedLink.findUnique({
    where: { id: shareId },
    select: { album: { select: { name: true } } },
  });

  if (!link) {
    return { title: "Album not found — Picasso Drive" };
  }

  return {
    title: `${link.album.name} — Shared Album · Picasso Drive`,
    description: `View the shared album "${link.album.name}" on Picasso Drive.`,
  };
}

export default async function SharePage({
  params,
}: SharePageProps): Promise<JSX.Element> {
  const { shareId } = await params;

  const link = await prisma.sharedLink.findUnique({
    where: { id: shareId },
    include: {
      album: {
        select: {
          id: true,
          name: true,
          media: {
            where: { isDeleted: false },
            select: {
              id: true,
              name: true,
              url: true,
              size: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      user: { select: { name: true } },
    },
  });

  // Không tồn tại
  if (!link) {
    notFound();
  }

  // Hết hạn
  const isExpired = link.expiresAt !== null && new Date() > link.expiresAt;
  if (isExpired) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
          background: "#020617",
          color: "#94a3b8",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3rem" }}>⏳</div>
        <h1 style={{ color: "#f1f5f9", fontSize: "1.5rem", margin: 0 }}>
          Link đã hết hạn
        </h1>
        <p style={{ maxWidth: "360px", lineHeight: 1.6 }}>
          Share link này đã hết hạn vào{" "}
          <strong style={{ color: "#fca5a5" }}>
            {new Date(link.expiresAt!).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </strong>
          . Hãy liên hệ người chia sẻ để nhận link mới.
        </p>
      </main>
    );
  }

  const mediaItems = link.album.media.map((m) => ({
    id: m.id,
    name: m.name,
    url: m.url,
    fileSize: m.size,
  }));

  return (
    <ShareGallery
      shareId={shareId}
      albumName={link.album.name}
      ownerName={link.user.name ?? null}
      createdAt={link.createdAt.toISOString()}
      expiresAt={link.expiresAt?.toISOString() ?? null}
      media={mediaItems}
    />
  );
}
