"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FolderPlus,
  Images,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import { useAlbumStore } from "@/store/useAlbumStore";
import { useDragStore } from "@/store/useDragStore";
import { ALBUM_ALL_ID, ALBUM_TRASH_ID, MediaItem } from "@/types/image.types";
import { readDragPayload } from "@/utils/dragMedia";
import { ShareButton } from "@/components/share/ShareButton";

interface AlbumSidebarProps {
  allMedia: MediaItem[];
  onAlbumSelect: (albumId: string) => void;
}

export function AlbumSidebar({
  allMedia,
  onAlbumSelect,
}: AlbumSidebarProps): JSX.Element {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [isCreating, setIsCreating] = useState(false); // Trạng thái loading khi tạo
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const albums = useAlbumStore((state) => state.albums);
  const activeAlbumId = useAlbumStore((state) => state.activeAlbumId);
  const setActiveAlbum = useAlbumStore((state) => state.setActiveAlbum);
  const createAlbum = useAlbumStore((state) => state.createAlbum);
  const renameAlbum = useAlbumStore((state) => state.renameAlbum);
  const deleteAlbum = useAlbumStore((state) => state.deleteAlbum);
  const moveMediaToAlbum = useAlbumStore((state) => state.moveMediaToAlbum);
  const getMediaCountByAlbum = useAlbumStore(
    (state) => state.getMediaCountByAlbum,
  );

  const dropTargetAlbumId = useDragStore((state) => state.dropTargetAlbumId);
  const setDropTarget = useDragStore((state) => state.setDropTarget);
  const endDrag = useDragStore((state) => state.endDrag);

  const userAlbums = useMemo(
    () => albums.filter((a) => a.id !== ALBUM_TRASH_ID),
    [albums],
  );
  const trashAlbum = useMemo(
    () => albums.find((a) => a.id === ALBUM_TRASH_ID),
    [albums],
  );
  const totalVisibleCount = useMemo(
    () => allMedia.filter((i) => !i.isDeleted).length,
    [allMedia],
  );

  const handleSelectAlbum = useCallback(
    (albumId: string) => {
      setActiveAlbum(albumId);
      onAlbumSelect(albumId);
      setIsMobileOpen(false);
    },
    [onAlbumSelect, setActiveAlbum],
  );

  const handleCreateAlbum = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newAlbumName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const createdId = await createAlbum(newAlbumName);
      if (createdId) {
        setNewAlbumName("");
        handleSelectAlbum(createdId);
      }
    } catch (error) {
      console.error("❌ Lỗi khi tạo album:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const commitRename = async () => {
    if (!editingAlbumId || !editingName.trim()) return;
    await renameAlbum(editingAlbumId, editingName);
    setEditingAlbumId(null);
    setEditingName("");
  };

  const handleDeleteAlbum = async (albumId: string) => {
    const count = getMediaCountByAlbum(albumId, allMedia);
    if (count > 0) return;
    await deleteAlbum(albumId);
  };

  const onAlbumDrop = (
    event: DragEvent<HTMLButtonElement>,
    albumId: string,
  ) => {
    event.preventDefault();
    const payload = readDragPayload(event.dataTransfer);

    if (payload && payload.mediaIds.length > 0) {
      moveMediaToAlbum(payload.mediaIds, albumId);
      if (albumId !== ALBUM_TRASH_ID) handleSelectAlbum(albumId);
    }
    endDrag();
    setDropTarget(null);
  };

  const renderAlbumRow = (
    albumId: string,
    label: string,
    count: number,
    isTrash = false,
  ) => {
    const isActive = activeAlbumId === albumId;
    const isDropTarget = dropTargetAlbumId === albumId;

    return (
      <div key={albumId} className="group flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleSelectAlbum(albumId)}
          onDragOver={(e) => {
            e.preventDefault();
            setDropTarget(albumId);
          }}
          onDragLeave={() => setDropTarget(null)}
          onDrop={(e) => onAlbumDrop(e, albumId)}
          className={clsx(
            "flex min-h-[44px] flex-1 items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition",
            isActive
              ? "bg-blue-600/20 text-blue-200"
              : "text-slate-300 hover:bg-slate-800",
            isDropTarget && "bg-blue-600/30 ring-2 ring-blue-500 scale-[0.98]",
          )}
        >
          {editingAlbumId === albumId ? (
            <input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setEditingAlbumId(null);
              }}
              className="w-full bg-slate-950 px-2 py-1 outline-none text-slate-100"
              autoFocus
            />
          ) : (
            <span className="truncate">{label}</span>
          )}
          <span
            className={clsx(
              "ml-2 rounded px-1.5 py-0.5 text-xs font-mono",
              isTrash
                ? "bg-rose-950 text-rose-400"
                : "bg-slate-950 text-slate-400",
            )}
          >
            {count}
          </span>
        </button>

        {!isTrash && albumId !== ALBUM_ALL_ID && editingAlbumId !== albumId && (
          <div className="flex opacity-0 group-hover:opacity-100 transition">
            <ShareButton albumId={albumId} albumName={label} />
            <button
              onClick={() => {
                setEditingAlbumId(albumId);
                setEditingName(label);
              }}
              className="p-2 text-slate-400 hover:text-slate-100"
            >
              <Pencil size={15} />
            </button>
            <button
              disabled={getMediaCountByAlbum(albumId, allMedia) > 0}
              onClick={() => handleDeleteAlbum(albumId)}
              className="p-2 text-slate-400 hover:text-rose-300 disabled:opacity-20"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    );
  };

  const panelContent = (
    <div className="flex flex-col gap-3 overflow-y-auto p-3">
      {renderAlbumRow(ALBUM_ALL_ID, "All Photos", totalVisibleCount)}

      <div className="space-y-1">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Collections
        </p>
        {userAlbums.map((album) =>
          renderAlbumRow(
            album.id,
            album.name,
            getMediaCountByAlbum(album.id, allMedia),
          ),
        )}
      </div>

      {trashAlbum
        ? renderAlbumRow(
            trashAlbum.id,
            trashAlbum.name,
            getMediaCountByAlbum(trashAlbum.id, allMedia),
            true,
          )
        : null}

      <form
        onSubmit={handleCreateAlbum}
        className="mt-auto space-y-2 border-t border-slate-800 pt-4"
      >
        <label
          htmlFor="new-album"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400"
        >
          <FolderPlus size={14} />
          New Collection
        </label>
        <input
          id="new-album"
          value={newAlbumName}
          onChange={(event) => setNewAlbumName(event.target.value)}
          placeholder="Collection title..."
          className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 transition"
        />
        <button
          type="submit"
          className="h-10 w-full rounded-xl bg-blue-600 text-sm font-medium text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-500 active:scale-[0.98]"
        >
          Create
        </button>
      </form>

      <p className="flex items-center gap-1.5 px-2 text-[10px] text-slate-500 leading-normal">
        <Images size={12} className="shrink-0" />
        Drag assets onto any row to re-allocate location.
      </p>
    </div>
  );

  return (
    <>
      <div className="w-full md:hidden">
        <button
          type="button"
          aria-expanded={isMobileOpen}
          aria-controls="mobile-album-panel"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 text-sm font-semibold text-slate-100"
        >
          <span>Albums</span>
          {isMobileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isMobileOpen ? (
          <div
            id="mobile-album-panel"
            className="mt-2 rounded-xl border border-slate-800 bg-slate-900/50"
          >
            {panelContent}
          </div>
        ) : null}
      </div>

      <aside
        className={clsx(
          "sticky top-4 hidden h-[calc(100vh-2rem)] shrink-0 rounded-2xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-xl transition-[width] duration-300 md:block",
          isCollapsed ? "w-14" : "w-64",
        )}
        aria-label="Album sidebar"
      >
        <div className="flex items-center justify-between border-b border-slate-800/40 p-3.5">
          {!isCollapsed ? (
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Library
            </h2>
          ) : null}
          <button
            type="button"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
          >
            {isCollapsed ? (
              <ChevronRight size={15} />
            ) : (
              <ChevronLeft size={15} />
            )}
          </button>
        </div>

        {!isCollapsed ? (
          <div className="h-[calc(100%-3.5rem)] overflow-y-auto">
            {panelContent}
          </div>
        ) : null}
      </aside>
    </>
  );
}
