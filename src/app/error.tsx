"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * app/error.tsx — bắt lỗi runtime trong mọi page/component bên dưới layout.
 * Next.js App Router tự động wrap page bằng file này.
 */
export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log lên monitoring service nếu có (Sentry, Datadog, v.v.)
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-stone-900/50 p-8 text-center backdrop-blur-sm">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
          <AlertTriangle size={24} className="text-rose-400" />
        </div>

        {/* Heading */}
        <h2 className="mb-2 font-serif text-xl text-stone-100">
          Something went wrong
        </h2>
        <p className="mb-1 text-sm font-light text-stone-400">
          An unexpected error occurred. Your data is safe.
        </p>

        {/* Error detail — chỉ hiện trên dev */}
        {process.env.NODE_ENV === "development" && error?.message && (
          <pre className="mt-4 mb-5 overflow-auto rounded-lg bg-black/40 p-3 text-left text-[11px] text-rose-400 border border-rose-500/10">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
          </pre>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-500/90 px-5 py-2.5 text-sm font-medium text-stone-900 transition hover:bg-amber-400 active:scale-[0.98]"
          >
            <RefreshCw size={14} />
            Try again
          </button>
          <a
            href="/"
            className="flex items-center justify-center rounded-lg border border-white/[0.07] px-5 py-2.5 text-sm text-stone-400 transition hover:bg-white/[0.04] hover:text-stone-200"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
