/** Serialized into DataTransfer during HTML5 drag operations */
export interface DragMediaPayload {
  mediaIds: string[];
}

export const DRAG_MEDIA_MIME = "application/x-picasso-media+json";
