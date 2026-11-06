import { Badge } from "@yiya/ui/components/badge";
import type { IRentalResource } from "@yiya/shared/rentals";

/* Más nombres que esto no entran en una línea a 320 px; el resto va en «+N». */
const MAX_VISIBLE = 2;

/** Los servicios distintos, en el orden en que vencen (el primero es el más cercano). */
const uniqueServiceNames = (rentals: IRentalResource[]): string[] => [
  ...new Set(rentals.map((rental) => rental.service.name)),
];

/**
 * Lo que alquila un cliente, **solo como texto** (Thony, 2026-11-06): los nombres de sus
 * servicios separados por coma y sin repetirse (dos perfiles de Netflix dicen «Netflix» una
 * vez). Si no entran, un badge neutro dice cuántos servicios más tiene. El estado de cada
 * perfil se ve en el detalle; en la fila el color va en la fecha y el monto.
 */
export default function RentalServiceBadges({ rentals }: { rentals: IRentalResource[] }) {
  const names = uniqueServiceNames(rentals);
  const visible = names.slice(0, MAX_VISIBLE);
  const hidden = names.slice(MAX_VISIBLE);

  return (
    <p className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
      <span className="truncate">{visible.join(", ")}</span>
      {hidden.length > 0 && (
        <Badge color="neutral" title={hidden.join(", ")} className="shrink-0 tabular-nums">
          +{hidden.length}
          <span className="sr-only">: {hidden.join(", ")}</span>
        </Badge>
      )}
    </p>
  );
}
