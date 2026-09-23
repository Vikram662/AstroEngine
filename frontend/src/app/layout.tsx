import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import "./globals.css";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildOrganizationSchema } from "@/lib/schema";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "AstroEngine — High-Performance B2B Astrology API Suite",
  description: "Enterprise multi-language Vedic and Western Astrology REST APIs, white-label PDF engine, and developer console.",
};

import Script from "next/script";

// Public-site brand fonts (redesign Phase 1 — see POST_REVIEW_FIX_LOG.md). Exposed
// as --font-figtree/--font-fraunces on <html> and mapped to the new font-brand /
// font-display utilities in globals.css; the existing font-sans utility used across
// the dashboard/admin panels is untouched, so this doesn't change anything visually
// until a public-page component opts into font-brand/font-display.
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" className={`h-full antialiased font-sans ${figtree.variable} ${fraunces.variable}`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <JsonLd data={buildOrganizationSchema()} />
        {children}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
