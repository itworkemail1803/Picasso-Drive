import type { Metadata } from "next";
import type { ReactNode } from "react";

// ⚠️ Layout này HOÀN TOÀN ĐỘC LẬP với root layout của Dashboard.
// Không dùng ClerkProvider, không dùng QueryClientProvider, không dùng Zustand store.
// Trang này chỉ là một trang tĩnh public cho khách xem ảnh.

export const metadata: Metadata = {
  title: "Shared Album — Picasso Drive",
  description: "View a shared photo album on Picasso Drive.",
};

type ShareLayoutProps = {
  readonly children: ReactNode;
};

export default function ShareLayout({ children }: ShareLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <head />
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#020617",
          color: "#f1f5f9",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        {children}
      </body>
    </html>
  );
}
