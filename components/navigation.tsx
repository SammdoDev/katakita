"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesColumnIncreasing, LayoutDashboard, Map, Upload, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Beranda", icon: LayoutDashboard },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/learn/1", label: "Belajar", icon: BookOpen },
  { href: "/progress", label: "Progres", icon: ChartNoAxesColumnIncreasing },
  { href: "/tests", label: "Tes AI", icon: ClipboardCheck },
  { href: "/admin/import", label: "Import", icon: Upload },
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-around rounded-2xl border border-white/50 bg-white/90 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1724]/92 md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href.split("/1")[0]);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1.5 py-2 text-[10px] font-semibold text-slate-500 transition-colors md:flex-none md:flex-row md:gap-2 md:px-3 md:text-sm",
              active && "bg-slate-900 text-white dark:bg-teal-300 dark:text-slate-950",
            )}
          >
            <Icon className="size-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
