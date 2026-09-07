import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_10%,rgba(45,212,191,.12),transparent_28%),radial-gradient(circle_at_90%_25%,rgba(110,231,183,.08),transparent_25%)]" />
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#f7faf9]/80 backdrop-blur-xl dark:border-white/8 dark:bg-[#08131e]/80">
        <div className="mx-auto flex h-17 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-slate-950 dark:text-white">
            <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-teal-300 shadow-lg dark:bg-teal-300 dark:text-slate-950">
              <Sparkles className="size-4" />
            </span>
            <span className="text-lg font-black tracking-[-.04em]">KataKita<span className="text-teal-500">.</span></span>
          </Link>
          <div className="flex items-center gap-1">
            <div className="hidden md:block"><Navigation /></div>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-7 sm:px-6 md:pb-14 md:pt-10">{children}</main>
      <div className="md:hidden"><Navigation /></div>
    </div>
  );
}

