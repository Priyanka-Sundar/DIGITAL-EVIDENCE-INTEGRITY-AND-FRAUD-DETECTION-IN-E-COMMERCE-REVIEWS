"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Analyze" },
  { href: "/analysis", label: "Result" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cases", label: "Cases" },
  { href: "/signals", label: "Signals" },
  { href: "/compare", label: "Compare" },
  { href: "/about", label: "Methodology" }
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-canvas">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">Forensic Analytics</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint">
              Review Integrity
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href as "/"}
                className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                  active ? "bg-ink text-canvas" : "text-ink-soft hover:bg-white hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link href="/" className="btn-ghost hidden !py-2 lg:inline-flex">
          New analysis
        </Link>

        <div className="flex flex-wrap items-center gap-1 lg:hidden">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href as "/"}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  active ? "bg-ink text-canvas" : "text-ink-soft"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
