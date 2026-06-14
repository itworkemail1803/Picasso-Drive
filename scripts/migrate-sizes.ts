// scripts/migrate-sizes.ts
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import WebSocket from "ws";

// Nạp biến môi trường để kết nối DB và Supabase
dotenv.config();

const db = new PrismaClient();
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { realtime: { transport: WebSocket as any } },
);

async function main() {
  console.log("🚀 Bắt đầu đồng bộ kích thước file từ Supabase Storage...");

  // 1. Lấy tất cả media từ Database
  const mediaItems = await db.media.findMany();
  console.log(`Tìm thấy ${mediaItems.length} file trong database.`);

  // 2. Lấy danh sách file từ Supabase Bucket 'images' trong thư mục 'uploads'
  const { data: files, error } = await supabaseAdmin.storage
    .from("images")
    .list("uploads", { limit: 1000 }); // Tăng limit nếu bạn có nhiều hơn 1000 file

  if (error) {
    console.error("❌ Lỗi khi lấy danh sách file từ Supabase:", error);
    return;
  }

  // 3. Tạo một Map để tìm kiếm nhanh (Key: filename, Value: metadata)
  const fileMap = new Map(files.map((f) => [f.name, f]));

  let updatedCount = 0;

  // 4. Đối chiếu và Update
  for (const item of mediaItems) {
    // filePath trong DB thường có dạng "uploads/abc-xyz.jpg"
    // Chúng ta tách lấy tên file để so sánh
    const fileName = item.url.split("/").pop();

    if (fileName && fileMap.has(fileName)) {
      const storageFile = fileMap.get(fileName)!;
      const sizeInBytes = storageFile.metadata?.size
        ? BigInt(storageFile.metadata.size)
        : 0n;

      // Chỉ update nếu kích thước trong DB khác với thực tế
      if (item.size !== sizeInBytes) {
        await db.media.update({
          where: { id: item.id },
          data: { size: sizeInBytes },
        });
        updatedCount++;
        console.log(`✅ Đã cập nhật: ${fileName} (${sizeInBytes} bytes)`);
      }
    } else {
      console.warn(`⚠️ Không thấy file trên Storage: ${item.url}`);
    }
  }

  console.log(`\n🎉 Xong! Đã cập nhật ${updatedCount} bản ghi.`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await db.$disconnect());
