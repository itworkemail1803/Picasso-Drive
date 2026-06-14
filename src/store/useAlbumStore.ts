import { create } from "zustand";
import { DEFAULT_USER_ALBUMS, TRASH_ALBUM } from "@/constants/albums";
import { ALBUM_ALL_ID, ALBUM_TRASH_ID } from "@/types/image.types";
import { AlbumStore } from "@/types/store.types";

export const useAlbumStore = create<AlbumStore>((set, get) => ({
  albums: [...DEFAULT_USER_ALBUMS, TRASH_ALBUM],
  mediaOverrides: {},
  activeAlbumId: ALBUM_ALL_ID,
  deletedMediaIds: [],
  storageUsed: 0,

  setActiveAlbum: (albumId) => set({ activeAlbumId: albumId }),

  fetchStorageUsage: async () => {
    try {
      const res = await fetch("/api/storage/usage");
      if (!res.ok) return;
      const data = await res.json();
      set({ storageUsed: data.used });
    } catch (error) {
      console.error("Lỗi fetch storage:", error);
    }
  },

  fetchAlbums: async () => {
    try {
      const response = await fetch("/api/albums");
      if (!response.ok) throw new Error("Failed to fetch albums");
      const dbAlbums = await response.json();

      const mappedAlbums = dbAlbums.map((a: any) => ({
        id: a.id,
        name: a.name,
        createdAt: a.createdAt,
        kind: "user" as const,
        isLocked: false,
      }));

      set({ albums: [...mappedAlbums, TRASH_ALBUM] });
    } catch (error) {
      console.error("❌ [Store] Fetch Albums Error:", error);
    }
  },

  createAlbum: async (name: string): Promise<string | null> => {
    const normalized = name.trim();
    if (!normalized) return null;

    try {
      const response = await fetch("/api/albums/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalized }),
      });

      if (!response.ok) throw new Error("Failed to create");
      const dbAlbum = await response.json();

      set((state) => ({
        albums: [
          {
            id: dbAlbum.id,
            name: dbAlbum.name,
            createdAt: dbAlbum.createdAt,
            kind: "user",
            isLocked: false,
          },
          ...state.albums.filter((a) => a.id !== ALBUM_TRASH_ID),
          TRASH_ALBUM,
        ],
      }));
      return dbAlbum.id;
    } catch (error) {
      return null;
    }
  },

  // OPTIMISTIC UPDATE: Move Media
  moveMediaToAlbum: async (mediaIds, albumId) => {
    const previousOverrides = { ...get().mediaOverrides };

    set((state) => {
      const nextOverrides = { ...state.mediaOverrides };
      mediaIds.forEach((id) => {
        nextOverrides[id] = {
          ...nextOverrides[id],
          albumId: albumId,
          isDeleted: albumId === ALBUM_TRASH_ID,
        };
      });
      return { mediaOverrides: nextOverrides };
    });

    try {
      const response = await fetch("/api/media/update-album", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaIds,
          albumId,
          isDeleted: albumId === ALBUM_TRASH_ID,
        }),
      });
      if (!response.ok) throw new Error();
    } catch {
      set({ mediaOverrides: previousOverrides });
    }
  },

  restoreMedia: async (mediaIds: string[]) => {
    const previousOverrides = { ...get().mediaOverrides };

    set((state) => {
      const nextOverrides = { ...state.mediaOverrides };
      mediaIds.forEach((id) => {
        nextOverrides[id] = {
          ...nextOverrides[id],
          isDeleted: false,
          albumId: ALBUM_ALL_ID,
        };
      });
      return { mediaOverrides: nextOverrides };
    });

    try {
      const res = await fetch("/api/media/restore", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaIds }),
      });
      if (!res.ok) throw new Error();
    } catch {
      set({ mediaOverrides: previousOverrides });
    }
  },

  permanentlyDeleteMedia: async (mediaIds: string[]) => {
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
        const nextOverrides = { ...state.mediaOverrides };
        mediaIds.forEach((id) => delete nextOverrides[id]);
        return { mediaOverrides: nextOverrides };
      });
      get().fetchStorageUsage();
    } catch (error) {
      // Rollback deletedMediaIds nếu cần
      console.error("Delete failed");
    }
  },

  // OPTIMISTIC UPDATE: Rename Album
  renameAlbum: async (albumId: string, name: string) => {
    const oldAlbums = [...get().albums];
    set((state) => ({
      albums: state.albums.map((a) => (a.id === albumId ? { ...a, name } : a)),
    }));

    try {
      const res = await fetch("/api/albums/rename", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId, name }),
      });
      if (!res.ok) throw new Error();
      return true;
    } catch {
      set({ albums: oldAlbums });
      return false;
    }
  },

  // OPTIMISTIC UPDATE: Delete Album
  deleteAlbum: async (albumId: string) => {
    const oldAlbums = [...get().albums];
    set((state) => ({
      albums: state.albums.filter((a) => a.id !== albumId),
      activeAlbumId:
        state.activeAlbumId === albumId ? ALBUM_ALL_ID : state.activeAlbumId,
    }));

    try {
      const res = await fetch("/api/albums", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId }),
      });
      if (!res.ok) throw new Error();
      return true;
    } catch {
      set({ albums: oldAlbums });
      return false;
    }
  },

  setMediaOverride: (mediaId, patch) =>
    set((state) => ({
      mediaOverrides: {
        ...state.mediaOverrides,
        [mediaId]: { ...(state.mediaOverrides[mediaId] || {}), ...patch },
      },
    })),

  getMediaCountByAlbum: (albumId, mediaItems) => {
    if (!mediaItems) return 0;
    // Lọc theo override nếu có
    const items = mediaItems.filter((i) => {
      const override = get().mediaOverrides[i.id];
      if (override?.isDeleted !== undefined) return !override.isDeleted;
      return !i.isDeleted;
    });

    if (albumId === ALBUM_ALL_ID) return items.length;
    if (albumId === ALBUM_TRASH_ID)
      return mediaItems.filter((i) => {
        const override = get().mediaOverrides[i.id];
        return override?.isDeleted ?? i.isDeleted;
      }).length;

    return items.filter((i) => {
      const override = get().mediaOverrides[i.id];
      const currentAlbum = override?.albumId ?? i.albumId;
      return currentAlbum === albumId;
    }).length;
  },
}));
