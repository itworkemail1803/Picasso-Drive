import { auth } from "@/app/api/auth/auth";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { Navbar } from "@/components/navbar/Navbar"; // Component chúng ta sẽ tạo ở bước tới
import Link from "next/link";

export default async function HomePage(): Promise<JSX.Element> {
  const session = await auth();
  const user = session?.user;

  // Trạng thái 1: Đã đăng nhập
  if (user && user.id) {
    return (
      <main className="min-h-screen px-3 py-6 sm:px-4 sm:py-10 bg-slate-950 text-slate-100">
        <Navbar />

        <div className="mx-auto mb-5 max-w-[90rem] flex items-center justify-between border-b border-slate-900 pb-4 mt-6">
          <div>
            <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
              Picasso Drive
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Advanced media dashboard focused on fast client-side optimization.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[90rem]">
          {/* DashboardClient giữ nguyên logic cũ, chỉ truyền userId mới */}
          <DashboardClient userId={user.id} />
        </div>
      </main>
    );
  }

  // Trạng thái 2: Chưa đăng nhập
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md flex flex-col items-center space-y-6 text-center">
        <h1 className="text-4xl font-bold text-white">Picasso Drive</h1>
        <p className="text-slate-400">
          Please sign in to access your media dashboard.
        </p>

        <div className="flex gap-4">
          <Link
            href="/sign-in"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-medium transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
