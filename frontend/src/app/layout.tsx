import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AstroEngine — High-Performance B2B Astrology API Suite",
  description: "Enterprise multi-language Vedic and Western Astrology REST APIs, white-label PDF engine, and developer console.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col bg-white text-slate-900">{children}</body>
    </html>
  );
}
