import { MediaItem, MediaQueryParams, MediaQueryResult } from "@/types/image.types";

const MOCK_MEDIA: MediaItem[] = [
  {
    id: "m-001",
    name: "hero-portrait.webp",
    albumId: "portraits",
    createdAt: "2026-05-22T10:12:00.000Z",
    fileSize: 482_012,
    mimeType: "image/webp",
    previewUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&q=80&auto=format&fit=crop",
    isDeleted: false
  },
  {
    id: "m-002",
    name: "studio-lighting.jpg",
    albumId: "portraits",
    createdAt: "2026-05-20T08:40:00.000Z",
    fileSize: 1_284_400,
    mimeType: "image/jpeg",
    previewUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&q=80&auto=format&fit=crop",
    isDeleted: false
  },
  {
    id: "m-003",
    name: "mountain-mood.webp",
    albumId: "landscape",
    createdAt: "2026-05-25T07:20:00.000Z",
    fileSize: 730_280,
    mimeType: "image/webp",
    previewUrl:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80&auto=format&fit=crop",
    isDeleted: false
  },
  {
    id: "m-004",
    name: "urban-night.png",
    albumId: "street",
    createdAt: "2026-05-19T19:54:00.000Z",
    fileSize: 2_102_120,
    mimeType: "image/png",
    previewUrl:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80&auto=format&fit=crop",
    isDeleted: false
  },
  {
    id: "m-005",
    name: "editorial-frame.webp",
    albumId: "fashion",
    createdAt: "2026-05-28T14:30:00.000Z",
    fileSize: 655_600,
    mimeType: "image/webp",
    previewUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80&auto=format&fit=crop",
    isDeleted: false
  },
  {
    id: "m-006",
    name: "sunrise-coast.jpg",
    albumId: "landscape",
    createdAt: "2026-05-15T05:22:00.000Z",
    fileSize: 1_760_900,
    mimeType: "image/jpeg",
    previewUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80&auto=format&fit=crop",
    isDeleted: false
  }
];

async function withMockDelay(minMs = 400, maxMs = 1100): Promise<void> {
  const duration = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise<void>((resolve) => {
    setTimeout(resolve, duration);
  });
}

function sortMedia(items: MediaItem[], sortBy: NonNullable<MediaQueryParams["sortBy"]>): MediaItem[] {
  const sorted = [...items];
  switch (sortBy) {
    case "date-asc":
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case "date-desc":
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "size-asc":
      return sorted.sort((a, b) => a.fileSize - b.fileSize);
    case "size-desc":
      return sorted.sort((a, b) => b.fileSize - a.fileSize);
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted;
  }
}

export async function fetchMedia(params: MediaQueryParams = {}): Promise<MediaQueryResult> {
  await withMockDelay();

  const search = params.search?.trim().toLowerCase() ?? "";
  const albumId = params.albumId?.trim();
  const sortBy = params.sortBy ?? "date-desc";

  const filtered = MOCK_MEDIA.filter((item) => {
    if (item.isDeleted) return false;
    const matchesSearch = search.length === 0 || item.name.toLowerCase().includes(search);
    const matchesAlbum = !albumId || albumId === "all" || item.albumId === albumId;
    return matchesSearch && matchesAlbum;
  });

  const sorted = sortMedia(filtered, sortBy);

  return {
    items: sorted,
    total: sorted.length
  };
}
