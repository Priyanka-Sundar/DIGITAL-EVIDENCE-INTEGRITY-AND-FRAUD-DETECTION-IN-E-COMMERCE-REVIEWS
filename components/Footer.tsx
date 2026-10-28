import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold tracking-tight">Forensic Analytics</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link href="/" className="hover:text-ink transition">Analyze</Link>
          <Link href="/dashboard" className="hover:text-ink transition">Dashboard</Link>
          <Link href="/about" className="hover:text-ink transition">Methodology</Link>
          <span className="text-ink-faint">CSE4074 · VIT Chennai</span>
        </div>
      </div>
    </footer>
  );
}
