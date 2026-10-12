import { cn } from "@yiya/ui/lib/utils";

/** Estado en texto, no solo con el switch: el color nunca es el único indicador. */
export default function BusinessStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold",
        isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {isActive ? "Activo" : "Desactivado"}
    </span>
  );
}
