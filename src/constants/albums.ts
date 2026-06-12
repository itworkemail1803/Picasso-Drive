import { ALBUM_TRASH_ID, Album } from "@/types/image.types";

export const DEFAULT_USER_ALBUMS: Album[] = [
  {
    id: "portraits",
    name: "Portraits",
    createdAt: "2026-01-01T00:00:00.000Z",
    kind: "user",
    isLocked: false
  },
  {
    id: "landscape",
    name: "Landscape",
    createdAt: "2026-01-01T00:00:00.000Z",
    kind: "user",
    isLocked: false
  },
  {
    id: "street",
    name: "Street",
    createdAt: "2026-01-01T00:00:00.000Z",
    kind: "user",
    isLocked: false
  },
  {
    id: "fashion",
    name: "Fashion",
    createdAt: "2026-01-01T00:00:00.000Z",
    kind: "user",
    isLocked: false
  },
  {
    id: "uploads",
    name: "Uploads",
    createdAt: "2026-01-01T00:00:00.000Z",
    kind: "user",
    isLocked: false
  }
];

export const TRASH_ALBUM: Album = {
  id: ALBUM_TRASH_ID,
  name: "Trash Bin",
  createdAt: "2026-01-01T00:00:00.000Z",
  kind: "system",
  isLocked: true
};
