/** Virtual filter id — not a droppable album */
export const ALBUM_ALL_ID = "all";

/** System trash album (Feature 3 will use isDeleted + this) */
export const ALBUM_TRASH_ID = "trash";

export interface MediaItem {
  id: string;
  name: string;
  albumId: string;
  createdAt: string;
  fileSize: number;
  mimeType: string;
  previewUrl: string;
  isDeleted: boolean;
  deletedAt?: string | null;
  /** Original byte size before compression (uploads / lightbox) */
  originalSize?: number;
}

/** Partial patches applied client-side on top of API/upload data */
export interface MediaOverride {
  albumId?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

export type AlbumKind = "system" | "user";

export interface Album {
  id: string;
  name: string;
  createdAt: string;
  kind: AlbumKind;
  /** Locked albums cannot be renamed or deleted */
  isLocked: boolean;
}

export type MediaSortBy =
  | "date-desc"
  | "date-asc"
  | "size-desc"
  | "size-asc"
  | "name-asc";

export interface MediaQueryParams {
  search?: string;
  albumId?: string;
  sortBy?: MediaSortBy;
  userId?: string;
}

export interface MediaQueryResult {
  items: MediaItem[];
  total: number;
}

export type UploadItemStatus = "queued" | "processing" | "completed" | "failed";

export interface UploadQueueItem {
  id: string;
  fileName: string;
  mimeType: string;
  originalSize: number;
  processedSize: number;
  savingsPercent: number;
  previewUrl: string;
  status: UploadItemStatus;
  errorMessage?: string;
  originalFile: File;
  processedFile: File;
  file: File;
}
