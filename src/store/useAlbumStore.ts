import { create } from "zustand";
import { DEFAULT_USER_ALBUMS, TRASH_ALBUM } from "@/constants/albums";
import { ALBUM_ALL_ID, ALBUM_TRASH_ID } from "@/types/image.types";
import { AlbumStore } from "@/types/store.types";

export const useAlbumStore = create<AlbumStore>((set, get) => ({
  albums: [...DEFAULT_USER_ALBUMS, TRASH_ALBUM],
  mediaOverrides: {},
  activeAlbumId: ALBUM_ALL_ID,
  deletedMediaIds: [],

  setActiveAlbum: (albumId) => set({ activeAlbumId: albumId }),

  fetchAlbums: async () => {
    try {
      const response = await fetch("/api/albums");
      if (!response.ok) {
        throw new Error("Failed to fetch albums from server");
      }
      const dbAlbums = await response.json();
      const mappedAlbums = dbAlbums.map((a: any) => ({
        id: a.id,
        name: a.name,
        createdAt: a.createdAt,
        kind: "user" as const,
        isLocked: false,
      }));

      set({
        albums: [...mappedAlbums, TRASH_ALBUM],
      });
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create");
      }

      const dbAlbum = await response.json();
      const newAlbum = {
        id: dbAlbum.id,
        name: dbAlbum.name,
        createdAt: dbAlbum.createdAt,
        kind: "user" as const,
        isLocked: false,
      };

      set((state) => ({
        albums: [
          newAlbum,
          ...state.albums.filter((a) => a.id !== ALBUM_TRASH_ID),
          TRASH_ALBUM,
        ],
      }));

      return newAlbum.id;
    } catch (error) {
      console.error("❌ [Store] Create Album Error:", error);
      return null;
    }
  },

  moveMediaToAlbum: async (mediaIds, albumId) => {
    if (!mediaIds.length) return;

    const previousOverrides = { ...get().mediaOverrides };

    // 1. Optimistic Update UI
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

    // 2. Sync với Database
    try {
      const response = await fetch("/api/media/update-album", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaIds,
          albumId: albumId,
          isDeleted: albumId === ALBUM_TRASH_ID,
        }),
      });

      if (!response.ok) throw new Error("API sync failed");
    } catch (error) {
      console.error("❌ [Store] Sync failed, rolling back UI", error);
      set({ mediaOverrides: previousOverrides });
    }
  },
  //Khôi phục ảnh đã xóa
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
      await fetch("/api/media/restore", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaIds }),
      });
    } catch (error) {
      set({ mediaOverrides: previousOverrides });
    }
  },

  //Xóa vĩnh viễn ảnh
  permanentlyDeleteMedia: async (mediaIds: string[]) => {
    set((state) => ({
      deletedMediaIds: [...state.deletedMediaIds, ...mediaIds],
    }));
    try {
      const response = await fetch("/api/media/delete-permanent", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaIds }),
      });
      if (!response.ok) throw new Error("Failed to delete permanently");

      // Xóa override của các item đã xóa vĩnh viễn
      set((state) => {
        const nextOverrides = { ...state.mediaOverrides };
        mediaIds.forEach((id) => delete nextOverrides[id]);
        return { mediaOverrides: nextOverrides };
      });
    } catch (error) {
      console.error("❌ [Store] Permanent Delete Error:", error);
    }
  },

  renameAlbum: async (albumId: string, name: string) => {
    // Thêm async
    const normalized = name.trim();
    if (normalized.length === 0) return false;

    // Nếu bạn có gọi API ở đây, hãy dùng await
    // await fetch(...);

    set((state) => ({
      albums: state.albums.map((album) =>
        album.id === albumId ? { ...album, name: normalized } : album,
      ),
    }));
    return true; // Tự động được wrap thành Promise<boolean>
  },

  deleteAlbum: async (albumId: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/albums", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete album");
      }

      set((state) => ({
        albums: state.albums.filter((a) => a.id !== albumId),
        activeAlbumId:
          state.activeAlbumId === albumId ? ALBUM_ALL_ID : state.activeAlbumId,
      }));
      return true;
    } catch (error) {
      console.error("❌ [Store] Delete Album Error:", error);
      return false;
    }
  },

  // THÊM HÀM NÀY VÀO (Đang thiếu)
  setMediaOverride: (mediaId, patch) =>
    set((state) => ({
      mediaOverrides: {
        ...state.mediaOverrides,
        [mediaId]: { ...state.mediaOverrides[mediaId], ...patch },
      },
    })),

  getMediaCountByAlbum: (albumId, mediaItems) => {
    if (!mediaItems) return 0;
    const items = mediaItems.filter((i) => !i.isDeleted);

    if (albumId === ALBUM_ALL_ID) return items.length;
    if (albumId === ALBUM_TRASH_ID)
      return mediaItems.filter((i) => i.isDeleted).length;

    return items.filter((i) => i.albumId === albumId).length;
  },
}));
