/**
 * useMediaStore — quản lý media overrides (optimistic UI) + deletedMediaIds
 */
import { create } from "zustand";
import { ALBUM_ALL_ID, ALBUM_TRASH_ID, MediaItem } from "@/types/image.types";

// ✅ Định nghĩa thẳng trong file, không import từ store.types
export interface MediaOverride {
  albumId?: string;
  isDeleted?: boolean;
}

interface MediaState {
  mediaOverrides: Record<string, MediaOverride>;
  deletedMediaIds: string[];

  setMediaOverride: (mediaId: string, patch: Partial<MediaOverride>) => void;
  moveMediaToAlbum: (mediaIds: string[], albumId: string) => Promise<void>;
  restoreMedia: (mediaIds: string[]) => Promise<void>;
  permanentlyDeleteMedia: (mediaIds: string[]) => Promise<void>;
  getMediaCountByAlbum: (albumId: string, mediaItems: MediaItem[]) => number;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  mediaOverrides: {},
  deletedMediaIds: [],

  setMediaOverride: (mediaId, patch) =>
    set((state) => ({
      mediaOverrides: {
        ...state.mediaOverrides,
        [mediaId]: { ...(state.mediaOverrides[mediaId] ?? {}), ...patch },
      },
    })),

  moveMediaToAlbum: async (mediaIds, albumId) => {
    const snapshot = { ...get().mediaOverrides };

    set((state) => {
      const next = { ...state.mediaOverrides };
      mediaIds.forEach((id) => {
        next[id] = {
          ...next[id],
          albumId,
          isDeleted: albumId === ALBUM_TRASH_ID,
        };
      });
      return { mediaOverrides: next };
    });

    try {
      const res = await fetch("/api/media/update-album", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaIds, albumId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      set({ mediaOverrides: snapshot });
    }
  },

  restoreMedia: async (mediaIds) => {
    const snapshot = { ...get().mediaOverrides };

    set((state) => {
      const next = { ...state.mediaOverrides };
      mediaIds.forEach((id) => {
        next[id] = { ...next[id], isDeleted: false, albumId: ALBUM_ALL_ID };
      });
      return { mediaOverrides: next };
    });

    try {
      const res = await fetch("/api/media/restore", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaIds }),
      });
      if (!res.ok) throw new Error();
    } catch {
      set({ mediaOverrides: snapshot });
    }
  },

  permanentlyDeleteMedia: async (mediaIds) => {
    set((state) => ({
      deletedMediaIds: [...state.deletedMediaIds, ...mediaIds],
    }));

    try {
      await fetch("/api/media/delete-permanent", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaIds }),
      });

      set((state) => {
        const next = { ...state.mediaOverrides };
        mediaIds.forEach((id) => delete next[id]);
        return { mediaOverrides: next };
      });

      // Dùng dynamic import để tránh circular dependency
      const { useStorageStore } = await import("./useStorageStore");
      useStorageStore.getState().fetchStorageUsage();
    } catch (error) {
      set((state) => ({
        deletedMediaIds: state.deletedMediaIds.filter(
          (id) => !mediaIds.includes(id),
        ),
      }));
      console.error("❌ [MediaStore] permanentlyDeleteMedia:", error);
    }
  },

  getMediaCountByAlbum: (albumId, mediaItems) => {
    if (!mediaItems?.length) return 0;
    const { mediaOverrides } = get();

    const isDeleted = (item: MediaItem) => {
      const o = mediaOverrides[item.id];
      return o?.isDeleted ?? item.isDeleted;
    };

    const getAlbumId = (item: MediaItem) => {
      const o = mediaOverrides[item.id];
      return o?.albumId ?? item.albumId;
    };

    if (albumId === ALBUM_TRASH_ID) return mediaItems.filter(isDeleted).length;

    const visible = mediaItems.filter((i) => !isDeleted(i));
    if (albumId === ALBUM_ALL_ID) return visible.length;

    return visible.filter((i) => getAlbumId(i) === albumId).length;
  },
}));
