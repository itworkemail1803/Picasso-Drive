import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/app/api/auth/auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

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

    const fileExtension = fileName.split(".").pop();
    const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `uploads/${uniqueFileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from("images")
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error("❌ SUPABASE_DEBUG_ERROR:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        {
          error: "Không thể tạo đường link upload",
          details: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      token: data.token,
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
