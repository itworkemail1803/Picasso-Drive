export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"] as const;
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** power;
  return `${value.toFixed(value >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

export function formatSavingsPercent(originalSize: number | undefined, compressedSize: number): string {
  if (!originalSize || originalSize <= 0) return "0%";
  const rawPercent = ((originalSize - compressedSize) / originalSize) * 100;
  const clamped = Math.max(0, Math.round(rawPercent));
  return `${clamped}%`;
}
