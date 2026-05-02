import { cn } from "@kaheteyn/ui/lib/utils";
import * as React from "react";

type Variant = "default" | "success" | "warning" | "destructive" | "info" | "outline";

const styles: Record<Variant, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  destructive: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  outline: "border bg-transparent",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
