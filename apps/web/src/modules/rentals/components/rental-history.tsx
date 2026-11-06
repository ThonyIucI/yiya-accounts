import type { IRentalHistoryResource, IRentalResource } from "@yiya/shared/rentals";
import { ArrowRight, Loader2 } from "lucide-react";

import { formatCompactDate } from "@/common/utils/format-date";

import RentalAmount from "./rental-amount";

interface IRentalHistoryProps {
  /** El alquiler abierto del perfil: su historial son los anteriores del mismo perfil. */
  rental: IRentalResource;
  /** Los alquileres del cliente; `null` mientras no se pidieron. */
  history: IRentalHistoryResource[] | null;
  isLoading: boolean;
  onRetry: () => void;
}

/** Ya es historial: se renovó o se liberó. */
const isClosed = (item: IRentalHistoryResource): boolean => item.renewedById !== null || item.releasedOn !== null;

/** «Renovado» o «Liberado el 05 nov». */
const closedLabel = (item: IRentalHistoryResource): string =>
  item.releasedOn ? `Liberado el ${formatCompactDate(item.releasedOn)}` : "Renovado";

/**
 * Lo que este cliente ya alquiló de **este perfil**, lo más nuevo arriba (Thony, 2026-11-06:
 * si lleva 4 meses renovando, ver los 4 con sus fechas y su pago). Las mismas tres columnas de
 * la card: cuándo pagó, el monto y de cuándo a cuándo.
 */
export default function RentalHistory({ rental, history, isLoading, onRetry }: IRentalHistoryProps) {
  if (history === null && isLoading) {
    return (
      <p className="flex items-center gap-2 pl-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
        Cargando historial…
      </p>
    );
  }
  /* No llegó (el error ya salió en un toast): se puede volver a pedir. */
  if (history === null) {
    return (
      <p className="pl-2 text-xs text-muted-foreground">
        No se pudo cargar el historial.{" "}
        <button type="button" onClick={onRetry} className="cursor-pointer font-medium text-foreground underline">
          Reintentar
        </button>
      </p>
    );
  }

  const previous = history.filter(
    (item) => item.id !== rental.id && item.profile.id === rental.profile.id && isClosed(item),
  );
  if (previous.length === 0) {
    return <p className="pl-2 text-xs text-muted-foreground">Todavía no hay alquileres anteriores de este perfil.</p>;
  }

  return (
    <ul className="space-y-2 rounded-xl bg-muted/50 px-2 py-2.5">
      {previous.map((item) => (
        <li key={item.id} className="grid grid-cols-3 gap-x-4 text-xs tabular-nums">
          <div className="min-w-0">
            <p className="truncate text-foreground">
              {item.paidOn ? `Pagó el ${formatCompactDate(item.paidOn)}` : "Sin pago"}
            </p>
            <p className="truncate text-muted-foreground">{closedLabel(item)}</p>
          </div>
          <div className="min-w-0">
            <RentalAmount rental={item} />
          </div>
          {/* En una línea, con flecha de ícono como en la card (nunca texto). */}
          <p className="flex min-w-0 flex-wrap items-center gap-x-1 text-foreground">
            {formatCompactDate(item.startsOn)}
            <ArrowRight className="size-3 shrink-0 text-muted-foreground" aria-label="hasta" />
            {formatCompactDate(item.expiresOn)}
          </p>
        </li>
      ))}
    </ul>
  );
}
