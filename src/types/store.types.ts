import { UploadQueueItem } from "@/types/image.types";

export interface UploadStoreState {
  queue: UploadQueueItem[];
}

export interface UploadStoreActions {
  addItems: (items: UploadQueueItem[]) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<UploadQueueItem>) => void;
  clearQueue: () => void;
}

export type UploadStore = UploadStoreState & UploadStoreActions;

export interface DragStoreState {
  draggedMediaIds: readonly string[];
  dropTargetAlbumId: string | null;
}

export interface DragStoreActions {
  beginDrag: (mediaIds: readonly string[]) => void;
  setDropTarget: (albumId: string | null) => void;
  endDrag: () => void;
}

export type DragStore = DragStoreState & DragStoreActions;
