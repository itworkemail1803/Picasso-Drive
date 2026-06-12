import { MediaItem, MediaOverride } from "@/types/image.types";

export function applyMediaOverrides(
  items: MediaItem[],
  overrides: Record<string, MediaOverride>
): MediaItem[] {
  if (Object.keys(overrides).length === 0) return items;

  return items.map((item) => {
    const patch = overrides[item.id];
    if (!patch) return item;
    return { ...item, ...patch };
  });
}

export function filterVisibleMedia(
  items: MediaItem[],
  options: { albumId: string; search: string }
): MediaItem[] {
  const normalizedSearch = options.search.trim().toLowerCase();

  return items.filter((item) => {
    const matchesSearch =
      normalizedSearch.length === 0 || item.name.toLowerCase().includes(normalizedSearch);

    return matchesSearch;
  });
}
