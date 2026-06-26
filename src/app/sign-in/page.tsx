"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
      callbackUrl: "/",
    });

    if (res?.error) {
      setError("Email or password is incorrect.");
      setIsLoading(false);
    } else {
      window.location.href = "/";
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-stone-950 font-sans">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-[#0f0e0d]">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_80%,rgba(180,140,100,0.15),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_10%,rgba(120,100,80,0.1),transparent)] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md border border-amber-600/50 flex items-center justify-center">
            <ApertureIcon />
          </div>
          <span className="text-stone-200 text-[17px] tracking-wide font-serif">
            Picasso Drive
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-amber-600/70 mb-5">
            Your visual archive
          </p>
          <h1 className="text-stone-200 font-serif text-5xl leading-[1.1] mb-5">
            Every frame,
            <br />
            <em className="text-amber-500/80 not-italic">perfectly</em> kept.
          </h1>
          <p className="text-stone-400 text-sm font-light leading-relaxed max-w-xs">
            A private studio for photographers. Organize, compress, and share
            your work — without compromise.
          </p>
        </div>

        {/* Aperture ornament */}
        <div className="absolute bottom-12 right-12 opacity-10 pointer-events-none">
          <ApertureOrnament />
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex items-center justify-center px-6 py-12 bg-stone-900/40 lg:border-l border-white/[0.04]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-10">
            <div className="w-7 h-7 rounded border border-amber-600/50 flex items-center justify-center">
              <ApertureIcon />
            </div>
            <span className="text-stone-200 text-base tracking-wide font-serif">
              Picasso Drive
            </span>
          </div>

          <h2 className="text-stone-200 font-serif text-2xl mb-1.5">
            Welcome back
          </h2>
          <p className="text-stone-500 text-sm font-light mb-9">
            Sign in to access your archive.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email" htmlFor="email">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@studio.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-stone-200 text-sm placeholder:text-stone-600 outline-none focus:border-amber-600/40 focus:bg-white/[0.05] transition-colors"
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-stone-200 text-sm placeholder:text-stone-600 outline-none focus:border-amber-600/40 focus:bg-white/[0.05] transition-colors"
              />
            </Field>

            {error && <ErrorBanner message={error} />}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-stone-900 text-sm font-medium tracking-wide hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading && <Spinner />}
              {isLoading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <Divider />

          <p className="text-center text-sm text-stone-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-amber-500/90 font-medium hover:text-amber-400 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Shared sub-components ── */

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-medium tracking-[0.08em] uppercase text-stone-500"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/[0.08] border border-red-500/20 text-red-400 text-xs">
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        className="shrink-0"
      >
        <circle cx="7" cy="7" r="6.5" stroke="currentColor" />
        <line
          x1="7"
          y1="4"
          x2="7"
          y2="7.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <circle cx="7" cy="9.5" r="0.7" fill="currentColor" />
      </svg>
      {message}
    </div>
  );
}

function Spinner() {
  return (
    <span className="w-3.5 h-3.5 rounded-full border-2 border-stone-900/30 border-t-stone-900 animate-spin" />
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-7 text-[10px] tracking-widest uppercase text-stone-700">
      <span className="flex-1 h-px bg-white/[0.06]" />
      or
      <span className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

function ApertureIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle
        cx="8"
        cy="8"
        r="5.5"
        stroke="rgb(217 119 6 / 0.7)"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="8" r="2.5" fill="rgb(217 119 6 / 0.55)" />
      {[0, 90, 180, 270].map((deg) => {
        const r = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={8 + 2.5 * Math.cos(r)}
            y1={8 + 2.5 * Math.sin(r)}
            x2={8 + 5.5 * Math.cos(r)}
            y2={8 + 5.5 * Math.sin(r)}
            stroke="rgb(217 119 6 / 0.45)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function ApertureOrnament() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
      <circle cx="80" cy="80" r="78" stroke="rgb(217 119 6)" strokeWidth="1" />
      <circle
        cx="80"
        cy="80"
        r="56"
        stroke="rgb(217 119 6)"
        strokeWidth="0.5"
      />
      <circle
        cx="80"
        cy="80"
        r="32"
        stroke="rgb(217 119 6)"
        strokeWidth="0.5"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = ((i * 60 - 90) * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={80 + 32 * Math.cos(a)}
            y1={80 + 32 * Math.sin(a)}
            x2={80 + 78 * Math.cos(a)}
            y2={80 + 78 * Math.sin(a)}
            stroke="rgb(217 119 6)"
            strokeWidth="0.5"
          />
        );
      })}
    </svg>
  );
}
