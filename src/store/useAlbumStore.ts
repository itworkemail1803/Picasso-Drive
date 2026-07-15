import { create } from "zustand";
import { DEFAULT_USER_ALBUMS, TRASH_ALBUM } from "@/constants/albums";
import { ALBUM_ALL_ID, ALBUM_TRASH_ID } from "@/types/image.types";

// Định nghĩa inline — không phụ thuộc store.types hay image.types
export interface Album {
  id: string;
  name: string;
  createdAt: string;
  kind: "user" | "system";
  isLocked: boolean;
}

interface AlbumState {
  albums: Album[];
  activeAlbumId: string;

  setActiveAlbum: (albumId: string) => void;
  fetchAlbums: () => Promise<void>;
  createAlbum: (name: string) => Promise<string | null>;
  renameAlbum: (albumId: string, name: string) => Promise<boolean>;
  deleteAlbum: (albumId: string) => Promise<boolean>;
}

export const useAlbumStore = create<AlbumState>((set, get) => ({
  albums: [...DEFAULT_USER_ALBUMS, TRASH_ALBUM],
  activeAlbumId: ALBUM_ALL_ID,

  setActiveAlbum: (albumId) => set({ activeAlbumId: albumId }),

  fetchAlbums: async () => {
    try {
      const res = await fetch("/api/albums");
      if (!res.ok) throw new Error("Failed to fetch albums");
      const dbAlbums = await res.json();

      const mapped: Album[] = dbAlbums.map((a: any) => ({
        id: a.id,
        name: a.name,
        createdAt: a.createdAt,
        kind: "user" as const,
        isLocked: false,
      }));

      set({ albums: [...mapped, TRASH_ALBUM] });
    } catch (error) {
      console.error("❌ [AlbumStore] fetchAlbums:", error);
    }
  },

  createAlbum: async (name) => {
    const normalized = name.trim();
    if (!normalized) return null;

    try {
      const res = await fetch("/api/albums/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalized }),
      });
      if (!res.ok) throw new Error("Failed to create album");
      const dbAlbum = await res.json();

      const newAlbum: Album = {
        id: dbAlbum.id,
        name: dbAlbum.name,
        createdAt: dbAlbum.createdAt,
        kind: "user",
        isLocked: false,
      };

      set((state) => ({
        albums: [
          newAlbum,
          ...state.albums.filter((a) => a.id !== ALBUM_TRASH_ID),
          TRASH_ALBUM,
        ],
      }));
      return dbAlbum.id;
    } catch (error) {
      console.error("❌ [AlbumStore] createAlbum:", error);
      return null;
    }
  },

  renameAlbum: async (albumId, name) => {
    const snapshot = [...get().albums];

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
      set({ albums: snapshot });
      return false;
    }
  },

  deleteAlbum: async (albumId) => {
    const snapshot = [...get().albums];

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
      set({ albums: snapshot });
      return false;
    }
  },
}));
