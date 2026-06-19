import { SignIn, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { dark } from "@clerk/themes";
import { AuthToastHandler } from "@/components/auth-toast/AuthToastHandler";

export default async function HomePage(): Promise<JSX.Element> {
  const { userId } = await auth();

  // Trạng thái 1: Đã đăng nhập
  if (userId) {
    return (
      <main className="min-h-screen px-3 py-6 sm:px-4 sm:py-10 bg-slate-950 text-slate-100">
        <AuthToastHandler />
        <div className="mx-auto mb-5 max-w-[90rem] flex items-center justify-between border-b border-slate-900 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">
              Picasso Drive
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Advanced media dashboard focused on fast client-side optimization.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-900 p-1 border border-slate-800">
            <UserButton />
          </div>
        </div>

        <div className="mx-auto max-w-[90rem]">
          <DashboardClient userId={userId} />
        </div>
      </main>
    );
  }

  // Trạng thái 2: Chưa đăng nhập
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md flex flex-col items-center space-y-6">
        <SignIn
          appearance={
            {
              baseTheme: dark,
              elements: {
                card: "bg-slate-900/40 border border-slate-900 shadow-2xl backdrop-blur-sm rounded-xl",
                headerTitle: "text-slate-100 font-bold",
                headerSubtitle: "text-slate-400",
                socialButtonsBlockButton:
                  "bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-900 transition",
                formButtonPrimary:
                  "bg-blue-600 hover:bg-blue-500 text-white font-medium transition active:scale-[0.98]",
                formFieldInput:
                  "bg-slate-950 border border-slate-800 text-slate-100 focus:border-blue-500 transition",
                footerActionLink:
                  "text-blue-400 hover:text-blue-300 transition",
              },
            } as any
          }
          // Cấu hình định tuyến
          routing="hash"
          forceRedirectUrl="/"
          signUpUrl="/sign-up"
        />
      </div>
    </main>
  );
}
