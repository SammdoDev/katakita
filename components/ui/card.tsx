import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-[1.5rem] border border-slate-200/80 bg-white/85 shadow-[0_16px_50px_rgba(15,23,42,.06)] backdrop-blur dark:border-white/8 dark:bg-[#101e2d]/85", className)} {...props} />;
}

