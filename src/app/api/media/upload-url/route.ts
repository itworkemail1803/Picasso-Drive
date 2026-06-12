import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

// Khởi tạo Supabase Client ở tầng Backend bằng Service Role Key để có toàn quyền điều khiển
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Bạn cần đăng nhập để upload file" },
        { status: 401 },
      );
    }

    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Thiếu thông tin file" },
        { status: 400 },
      );
    }

    // Tạo ra một cái tên file độc nhất trên Cloud để tránh trùng lặp ảnh giữa các user
    const fileExtension = fileName.split(".").pop();
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;

    // Đường dẫn lưu trữ trong Bucket (Ví dụ: uploads/abc-123-xyz.webp)
    const filePath = `uploads/${uniqueFileName}`;

    // Xin Supabase cấp Presigned URL (Thời gian sống: 300 giây = 5 phút)
    const { data, error } = await supabaseAdmin.storage
      .from("images") // Tên bucket bạn đã tạo trên Supabase
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error("Lỗi sinh Signed URL từ Supabase:", error);
      return NextResponse.json(
        { error: "Không thể tạo đường link upload" },
        { status: 500 },
      );
    }

    // Trả về đường link thông hành (uploadUrl) và đường dẫn file để sau này lưu vào Postgres
    return NextResponse.json({
      uploadUrl: data.signedUrl,
      token: data.token, // Token xác thực đi kèm của Supabase
      filePath: filePath,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
