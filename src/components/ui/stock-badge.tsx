"use client";

import { cn } from "@/lib/utils";
import { type StockStatus } from "@/lib/data";

const statusConfig: Record<StockStatus, { label: string; dotClass: string; textClass: string }> = {
  "in-stock": { label: "IN STOCK", dotClass: "bg-neutral-900", textClass: "text-neutral-700" },
  "low-stock": { label: "LOW STOCK", dotClass: "bg-neutral-500", textClass: "text-neutral-500" },
  "sold-out": { label: "SOLD OUT", dotClass: "bg-neutral-300", textClass: "text-neutral-400" },
};

export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  const config = statusConfig[status];
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
      <span className={cn("font-mono text-[9px] tracking-[0.15em]", config.textClass)}>
        {config.label}
      </span>
    </div>
  );
}
