import { DRAG_MEDIA_MIME, DragMediaPayload } from "@/types/drag.types";

export function writeDragPayload(
  dataTransfer: DataTransfer,
  payload: DragMediaPayload,
): void {
  const serialized = JSON.stringify(payload);
  dataTransfer.setData(DRAG_MEDIA_MIME, serialized);
  dataTransfer.effectAllowed = "move";
}

export function readDragPayload(
  dataTransfer: DataTransfer,
): (DragMediaPayload & { mediaIds: string[] }) | null {
  const raw = dataTransfer.getData(DRAG_MEDIA_MIME);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "mediaIds" in parsed &&
      Array.isArray((parsed as DragMediaPayload).mediaIds)
    ) {
      return parsed as DragMediaPayload & { mediaIds: string[] };
    }
    return null;
  } catch {
    return null;
  }
}
