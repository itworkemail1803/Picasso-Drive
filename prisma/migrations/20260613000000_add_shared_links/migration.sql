-- Migration: add-shared-links
-- Thêm cột is_deleted vào bảng media (đã tồn tại trong DB, thêm IF NOT EXISTS để idempotent)
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- Tạo bảng shared_links
CREATE TABLE IF NOT EXISTS "shared_links" (
    "id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_links_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: shared_links -> albums
ALTER TABLE "shared_links" ADD CONSTRAINT "shared_links_album_id_fkey"
    FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: shared_links -> users
ALTER TABLE "shared_links" ADD CONSTRAINT "shared_links_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
