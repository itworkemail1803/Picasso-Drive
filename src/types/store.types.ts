import { Album, MediaOverride } from "@/types/image.types";
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

export interface AlbumStoreState {
  albums: Album[];
  /** Client-side mutations keyed by media id */
  mediaOverrides: Record<string, MediaOverride>;
  /** Sidebar selection drives grid filter (in addition to FilterBar) */
  activeAlbumId: string;
}

export interface AlbumStoreActions {
  albums: Album[];
  mediaOverrides: Record<string, MediaOverride>;
  activeAlbumId: string;
  deletedMediaIds: string[]; // Thêm mảng này
  storageUsed: number;
  setActiveAlbum: (albumId: string) => void;
  fetchAlbums: () => Promise<void>;
  createAlbum: (name: string) => Promise<string | null>;
  moveMediaToAlbum: (mediaIds: string[], albumId: string) => Promise<void>;
  restoreMedia: (mediaIds: string[]) => Promise<void>;
  permanentlyDeleteMedia: (mediaIds: string[]) => Promise<void>;
  renameAlbum: (albumId: string, name: string) => Promise<boolean>;
  deleteAlbum: (albumId: string) => Promise<boolean>; // Phải là Promise<boolean>
  setMediaOverride: (mediaId: string, patch: Partial<MediaOverride>) => void;
  getMediaCountByAlbum: (albumId: string, mediaItems: any[]) => number;
  fetchStorageUsage: () => Promise<void>;
}

export type AlbumStore = AlbumStoreState & AlbumStoreActions;

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
