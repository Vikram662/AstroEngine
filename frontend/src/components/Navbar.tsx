import React from "react";
import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur border-b border-zinc-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-xs">
            AE
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-900">
            AstroEngine
          </span>
          <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
            API v1
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600">
          <Link href="/#playground" className="hover:text-zinc-900 transition">
            Playground
          </Link>
          <Link href="/docs" className="hover:text-zinc-900 transition">
            Documentation
          </Link>
          <Link href="/pricing" className="hover:text-zinc-900 transition">
            Pricing
          </Link>
          <a
            href={`${process.env.NEXT_PUBLIC_ASTRO_ENGINE_URL || "http://localhost:8000"}/redoc`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-900 transition"
          >
            API Reference
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs px-3 py-1.5 rounded-md text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition font-medium"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="text-xs px-3.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white font-medium transition flex items-center gap-1.5 shadow-sm"
          >
            <span>Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};
