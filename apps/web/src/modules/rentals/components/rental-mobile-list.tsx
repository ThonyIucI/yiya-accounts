import { Skeleton } from "@yiya/ui/components/skeleton";
import { cn } from "@yiya/ui/lib/utils";

import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import { formatCompactDate } from "@/common/utils/format-date";
import { EXPIRY_TEXT_CLASSES } from "@/modules/accounts/utils/expiry";
import { type ICustomerRentals, rentalExpiryStatus } from "@/modules/rentals/utils/rental-groups";

import RentalDueBadge from "./rental-due-badge";
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
 * Cada fila: el cliente, debajo lo que alquila como badges con el nombre del servicio
 * (2026-11-04, antes logos) y, a la derecha, su vencimiento
 * más cercano y el monto a cobrar si toca. Los gestos (deslizar, mantener presionado) llegan
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
        const [nearest] = group.rentals;
        const nearestStatus = nearest ? rentalExpiryStatus(nearest) : "ok";
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
                  <p className="truncate font-heading font-bold text-foreground">{group.customer.name}</p>
                  <RentalServiceBadges rentals={group.rentals} />
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {nearest && (
                    <span
                      className={cn(
                        "text-xs font-semibold tabular-nums",
                        /* Al día va en gris, como la hora de un correo en Gmail. */
                        nearestStatus === "ok" ? "text-muted-foreground" : EXPIRY_TEXT_CLASSES[nearestStatus],
                      )}
                    >
                      {formatCompactDate(nearest.expiresOn)}
                    </span>
                  )}
                  <RentalDueBadge due={group.due} />
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
