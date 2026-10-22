import { cn } from "@yiya/ui/lib/utils";
import type { ReactNode } from "react";

export type TBadgeTone = "neutral" | "primary" | "success" | "expired" | "today" | "soon";

const TONE_CLASSES: Record<TBadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  expired: "bg-status-expired/12 text-status-expired",
  today: "bg-status-today/12 text-status-today",
  soon: "bg-status-soon/15 text-status-soon",
};

interface IBadgeProps {
  tone?: TBadgeTone;
  children: ReactNode;
  className?: string;
}

/** Píldora de estado con texto (el color nunca es el único indicador). */
export default function Badge({ tone = "neutral", children, className }: IBadgeProps) {
  return (
    <span
      className={cn(
        /* 12 px (acordado 2026-10-22): una etiqueta, no texto para leer. */
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
