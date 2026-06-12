"use client";

import { create } from "zustand";
import { UploadStore } from "@/types/store.types";

export const useUploadStore = create<UploadStore>((set) => ({
  queue: [],
  addItems: (items) =>
    set((state) => ({
      queue: [...items, ...state.queue]
    })),
  removeItem: (id) =>
    set((state) => ({
      queue: state.queue.filter((item) => item.id !== id)
    })),
  updateItem: (id, updates) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    })),
  clearQueue: () => set({ queue: [] })
}));
