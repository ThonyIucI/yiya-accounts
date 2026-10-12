import { cn } from "@yiya/ui/lib/utils";

interface IStatusBadgeProps {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

/** Estado en texto, no solo con el switch: el color nunca es el único indicador. */
export default function StatusBadge({
  isActive,
  activeLabel = "Activo",
  inactiveLabel = "Inactivo",
}: IStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold whitespace-nowrap",
        isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {isActive ? activeLabel : inactiveLabel}
    </span>
  );
}
