"use client";

import { create } from "zustand";
import { DragStore } from "@/types/store.types";

/**
 * Isolated drag state so drag-over on the sidebar does not re-render the image grid.
 */
export const useDragStore = create<DragStore>((set) => ({
  draggedMediaIds: [],
  dropTargetAlbumId: null,
  beginDrag: (mediaIds) =>
    set({
      draggedMediaIds: mediaIds,
      dropTargetAlbumId: null
    }),
  setDropTarget: (albumId) => set({ dropTargetAlbumId: albumId }),
  endDrag: () =>
    set({
      draggedMediaIds: [],
      dropTargetAlbumId: null
    })
}));
