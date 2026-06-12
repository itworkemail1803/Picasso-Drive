"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { MediaQueryParams, MediaSortBy } from "@/types/image.types";
import { useDebounce } from "@/hooks/useDebounce";

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterBarProps {
  // 🎯 SỬA DÒNG NÀY: Thay vì Required<MediaQueryParams>, định nghĩa rõ các trường UI cần quản lý
  filters: {
    search: string;
    albumId: string;
    sortBy: "date-asc" | "date-desc" | "size-asc" | "size-desc" | "name-asc"; // Hoặc MediaSortBy tùy dự án của bạn
  };
  albumOptions: FilterOption[];
  onFiltersChange: React.Dispatch<
    React.SetStateAction<{
      search: string;
      albumId: string;
      sortBy: "date-asc" | "date-desc" | "size-asc" | "size-desc" | "name-asc";
    }>
  >;
}

const SORT_OPTIONS: Array<{ value: MediaSortBy; label: string }> = [
  { value: "date-desc", label: "Date Created (Newest First)" },
  { value: "date-asc", label: "Date Created (Oldest First)" },
  { value: "size-desc", label: "File Size (Largest First)" },
  { value: "size-asc", label: "File Size (Smallest First)" },
];

export function FilterBar({
  filters,
  albumOptions,
  onFiltersChange,
}: FilterBarProps): JSX.Element {
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (debouncedSearch === filters.search) return;
    onFiltersChange({ ...filters, search: debouncedSearch });
  }, [debouncedSearch, filters, onFiltersChange]);

  const resolvedAlbums = useMemo<FilterOption[]>(() => {
    const withAll = albumOptions.some((option) => option.id === "all")
      ? albumOptions
      : [{ id: "all", label: "All Albums" }, ...albumOptions];
    return withAll;
  }, [albumOptions]);

  const onSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  const onClearSearch = () => setSearchInput("");

  const onAlbumChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, albumId: event.target.value });
  };

  const onSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, sortBy: event.target.value as MediaSortBy });
  };

  return (
    /*
     * No top margin here — DashboardClient.space-y-4 provides the gap.
     * grid-cols-1 is the mobile base; md:grid-cols-12 widens on desktop.
     */
    <section className="w-full rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        {/* Search — full width on mobile, 6 cols on desktop */}
        <div className="md:col-span-6">
          <label
            htmlFor="media-search"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400"
          >
            Search
          </label>
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              id="media-search"
              type="text"
              value={searchInput}
              onChange={onSearchChange}
              placeholder="Search by image name…"
              aria-label="Search media by name"
              className="h-11 w-full rounded-md border border-slate-700 bg-slate-950 pl-9 pr-10 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500"
            />
            {searchInput.length > 0 ? (
              <button
                type="button"
                onClick={onClearSearch}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Album filter — full width on mobile, 3 cols on desktop */}
        <div className="md:col-span-3">
          <label
            htmlFor="album-filter"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400"
          >
            Album
          </label>
          <select
            id="album-filter"
            value={filters.albumId}
            onChange={onAlbumChange}
            aria-label="Filter by album"
            className="h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-blue-500"
          >
            {resolvedAlbums.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort — full width on mobile, 3 cols on desktop */}
        <div className="md:col-span-3">
          <label
            htmlFor="sort-filter"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400"
          >
            Sort
          </label>
          <select
            id="sort-filter"
            value={filters.sortBy}
            onChange={onSortChange}
            aria-label="Sort media"
            className="h-11 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-blue-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
