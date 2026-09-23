"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CALCULATOR_TOOLS } from "@/data/calculatorsData";

interface Props {
  title: string;
  hindiTitle: string;
  description: string;
  slug: string;
  category: string;
  icon?: string;
  children: React.ReactNode;
}

export const CalculatorPageShell: React.FC<Props> = ({
  title,
  hindiTitle,
  description,
  slug,
  category,
  icon,
  children,
}) => {
  const related = CALCULATOR_TOOLS.filter((t) => t.category === category && t.id !== slug).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <nav className="flex items-center flex-wrap gap-1.5 text-xs text-ink-muted mb-6">
            <Link href="/" className="hover:text-accent transition flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> होम
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/#calculators" className="hover:text-accent transition">
              कैलकुलेटर
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink font-medium">{hindiTitle}</span>
          </nav>

          <div className="mb-8">
            {icon && <div className="text-3xl mb-2">{icon}</div>}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              {hindiTitle} <span className="text-base font-normal text-ink-muted">({title})</span>
            </h1>
            <p className="mt-2 text-sm text-ink-soft max-w-2xl leading-relaxed">{description}</p>
          </div>

          {children}

          {related.length > 0 && (
            <div className="mt-14 pt-8 border-t border-line">
              <h2 className="text-sm font-bold text-ink mb-4">संबंधित कैलकुलेटर</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={r.href}
                    className="p-4 rounded-xl border border-line bg-card hover:border-accent/50 hover:shadow-sm transition block"
                  >
                    <div className="text-xl mb-1">{r.icon}</div>
                    <div className="text-sm font-bold text-ink">{r.hindiTitle}</div>
                    <div className="text-[11px] text-ink-muted mt-0.5">{r.title}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};
