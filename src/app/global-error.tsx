"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalErrorPage]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="m-0 bg-[#0a0a0b] font-sans">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-stone-900/50 p-8 text-center backdrop-blur-sm">
            {/* Icon */}
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f87171"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h2 className="mb-2 font-serif text-xl text-stone-100">
              Critical error
            </h2>
            <p className="text-sm font-light text-stone-400">
              The application failed to load. Please try refreshing.
            </p>

            {process.env.NODE_ENV === "development" && error?.message && (
              <pre className="mt-4 overflow-auto rounded-lg border border-rose-500/10 bg-black/40 p-3 text-left text-[11px] text-rose-400">
                {error.message}
              </pre>
            )}

            <button
              onClick={reset}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 px-5 py-2.5 text-sm font-medium text-stone-900 transition hover:opacity-90 active:scale-[0.98]"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reload page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
