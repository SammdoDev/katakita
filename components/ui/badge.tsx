import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("inline-flex items-center rounded-full border border-teal-600/15 bg-teal-500/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-teal-700 dark:border-teal-300/15 dark:text-teal-300", className)} {...props} />;
}

