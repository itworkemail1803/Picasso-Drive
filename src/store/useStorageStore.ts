/**
 * useStorageStore — quản lý storage usage
 * Tách riêng vì chỉ StorageDisplay cần subscribe, không cần kéo cả app re-render.
 */
import { create } from "zustand";

interface StorageState {
  storageUsed: number;
  isLoading: boolean;
  fetchStorageUsage: () => Promise<void>;
}

export const useStorageStore = create<StorageState>((set) => ({
  storageUsed: 0,
  isLoading: false,

  fetchStorageUsage: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/storage/usage");
      if (!res.ok) throw new Error("Failed to fetch storage");
      const data = await res.json();
      set({ storageUsed: data.used });
    } catch (error) {
      console.error("❌ [StorageStore] fetchStorageUsage:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
