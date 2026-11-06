import { formatSoles } from "@yiya/shared/money";
import { Badge } from "@yiya/ui/components/badge";
import { Skeleton } from "@yiya/ui/components/skeleton";
import { cn } from "@yiya/ui/lib/utils";

import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import { formatCompactDate } from "@/common/utils/format-date";
import { EXPIRY_COLORS, EXPIRY_TEXT_CLASSES } from "@/modules/accounts/utils/expiry";
import { type ICustomerRentals, nextChargeOf } from "@/modules/rentals/utils/rental-groups";

import RentalServiceBadges from "./rental-service-badges";

const SKELETON_COUNT = 5;

interface IRentalMobileListProps {
  groups: ICustomerRentals[];
  isLoading: boolean;
  onOpen: (group: ICustomerRentals) => void;
}

/**
 * La lista del celular, **seguida como Gmail** (acordado 2026-10-31): filas sobre el fondo,
 * sin sombra por fila, separadas por una línea fina que empieza después del avatar. Es un
 * patrón propio de Alquileres, distinto de la card de listado del resto.
 *
 * Cada fila: el cliente, debajo sus servicios como texto (2026-11-06, antes logos) y, a la
 * derecha, su vencimiento más cercano y lo próximo a cobrar, los dos con el color del estado. Los gestos (deslizar, mantener presionado) llegan
 * en la porción 4. Oculta desde `md`: allí se usa `RentalTable`.
 */
export default function RentalMobileList({ groups, isLoading, onOpen }: IRentalMobileListProps) {
  if (isLoading) {
    return (
      <ul className="-mx-4 md:hidden">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <li key={index} className="flex items-center gap-3 pl-4">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2 border-b border-border/60 py-3.5 pr-4">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="-mx-4 md:hidden">
      {groups.map((group) => {
        const next = nextChargeOf(group);
        /* Al día va en gris, como la hora de un correo en Gmail; si toca cobrar, su color. */
        const toneClass =
          !next || next.status === "ok" ? "text-muted-foreground" : EXPIRY_TEXT_CLASSES[next.status];
        return (
          <li key={group.customer.id}>
            <button
              type="button"
              onClick={() => onOpen(group)}
              className="flex w-full cursor-pointer items-center gap-3 pl-4 text-left transition-colors active:bg-muted"
            >
              <InitialsAvatar name={group.customer.name} color={avatarColorOf(group.customer.name)} />
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3 border-b border-border/60 py-3 pr-4">
                <div className="min-w-0 space-y-1.5">
                  <p className="truncate font-heading font-semibold text-foreground">{group.customer.name}</p>
                  <RentalServiceBadges rentals={group.rentals} />
                </div>
                {next && (
                  <div className="flex shrink-0 flex-col items-end gap-1.5 tabular-nums" title={next.description}>
                    <span className={cn("text-xs font-medium", toneClass)}>{formatCompactDate(next.expiresOn)}</span>
                    {/* Si toca cobrar, el monto es un badge de su color; al día, texto neutro (12 px los dos). */}
                    {next.status === "ok" ? (
                      <span className="text-xs font-semibold text-foreground">{formatSoles(next.amount)}</span>
                    ) : (
                      <Badge color={EXPIRY_COLORS[next.status]}>{formatSoles(next.amount)}</Badge>
                    )}
                    <span className="sr-only">: {next.description}</span>
                  </div>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
