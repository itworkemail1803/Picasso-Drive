import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShareGallery } from "./ShareGallery";

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

  if (!link) return { title: "Album not found — Picasso Drive" };

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
            select: { id: true, name: true, url: true, size: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      user: { select: { name: true } },
    },
  });

  if (!link) notFound();

  // Hết hạn
  if (link.expiresAt && new Date() > link.expiresAt) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center rounded-2xl border border-white/[0.06] bg-stone-900/50 p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f87171"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1 className="font-serif text-xl text-stone-100 mb-2">
            Link đã hết hạn
          </h1>
          <p className="text-sm font-light text-stone-400 leading-relaxed">
            Share link này đã hết hạn vào{" "}
            <span className="text-rose-400 font-medium">
              {new Date(link.expiresAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            . Hãy liên hệ người chia sẻ để nhận link mới.
          </p>
        </div>
      </div>
    );
  }

  const mediaItems = link.album.media.map((m) => ({
    id: m.id,
    name: m.name,
    url: m.url,
    fileSize: Number(m.size), // ✅ Convert BigInt → Number
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
