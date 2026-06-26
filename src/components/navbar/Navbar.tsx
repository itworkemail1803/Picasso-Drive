import { auth, signOut } from "@/app/api/auth/auth";
import Link from "next/link";
import { LogOut, User } from "lucide-react";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="flex items-center justify-between mx-auto max-w-[90rem] py-4 border-b border-slate-900">
      <Link href="/" className="text-xl font-bold text-slate-100">
        Picasso Drive
      </Link>

      <div className="flex items-center gap-4">
        {session?.user ? (
          <div className="flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
            <span className="text-sm text-slate-300 truncate max-w-[150px]">
              Welcome back, {session.user.name}
            </span>

            {/* Form đăng xuất sử dụng Server Action */}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/sign-in" });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-slate-400 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-sm bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-white transition"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
