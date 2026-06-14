/** Shared link record as stored in DB */
export interface SharedLink {
  id: string;
  albumId: string;
  userId: string;
  label: string | null;
  expiresAt: string | null; // ISO string or null (no expiry)
  createdAt: string;
}

/** Payload sent to POST /api/share */
export interface CreateSharePayload {
  albumId: string;
  label?: string;
  /** ISO date string or null for no expiry */
  expiresAt?: string | null;
}

/** Media item shape used by the public share page (no auth context needed) */
export interface ShareMediaItem {
  id: string;
  name: string;
  url: string;
  fileSize: number | bigint;
}

/** Data returned by GET /api/share/[shareId] */
export interface SharePageData {
  shareId: string;
  albumName: string;
  ownerName: string | null;
  createdAt: string;
  expiresAt: string | null;
  media: ShareMediaItem[];
}

export type ShareExpiryOption = "never" | "1d" | "7d" | "30d";
