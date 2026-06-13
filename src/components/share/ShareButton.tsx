"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareModal } from "@/components/share/ShareModal";

// ──────────────────────────────────────────────────────────────
// ShareButton — Nút kích hoạt ShareModal, gắn vào từng album row
// trong AlbumSidebar. Tự quản lý open/close state.
// ──────────────────────────────────────────────────────────────

interface ShareButtonProps {
  albumId: string;
  albumName: string;
}

export function ShareButton({ albumId, albumName }: ShareButtonProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // Không trigger album select
          setIsOpen(true);
        }}
        className="p-2 text-slate-400 hover:text-blue-300 transition"
        title={`Chia sẻ album "${albumName}"`}
        aria-label={`Chia sẻ album ${albumName}`}
      >
        <Share2 size={15} />
      </button>

      {isOpen && (
        <ShareModal
          albumId={albumId}
          albumName={albumName}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
