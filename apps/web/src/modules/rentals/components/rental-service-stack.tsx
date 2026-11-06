import type { TExpiryStatus } from "@yiya/shared/purchases";
import type { IRentalResource } from "@yiya/shared/rentals";
import { cn } from "@yiya/ui/lib/utils";

import { describeExpiry, expiryOf } from "@/modules/accounts/utils/expiry";
import ServiceAvatar from "@/modules/services/components/service-avatar";

/* Como `ServiceAvatarStack`: más que esto no entra en la fila de 320 px. */
const MAX_VISIBLE = 4;

/* El punto del logo (RF-14): solo lo que no está al día. */
const DOT_CLASSES: Record<TExpiryStatus, string | null> = {
  expired: "bg-destructive",
  today: "bg-orange",
  soon: "bg-yellow",
  ok: null,
};

/**
 * Un logo **por perfil alquilado** (no por servicio: dos de Netflix son dos logos), encimados
 * como `ServiceAvatarStack`. El que vence lleva un punto de su color, como un badge de estado
 * (Thony, 2026-10-31): con 4 servicios se ve cuál es. El detalle va en el tooltip.
 */
export default function RentalServiceStack({ rentals }: { rentals: IRentalResource[] }) {
  const visible = rentals.slice(0, MAX_VISIBLE);
  const hidden = rentals.slice(MAX_VISIBLE);

  return (
    <ul className="flex items-center -space-x-1.5">
      {visible.map((rental) => {
        const expiry = expiryOf(rental.expiresOn);
        const dotClass = DOT_CLASSES[expiry.status];
        const text = `${rental.service.name} · ${describeExpiry(rental.expiresOn, expiry)}`;
        return (
          <li key={rental.id} title={text} className="relative rounded-full ring-2 ring-background">
            <ServiceAvatar
              name={rental.service.name}
              imageUrl={rental.service.imageUrl}
              className="size-6 rounded-full bg-card text-xs"
            />
            {dotClass && (
              <span
                aria-hidden
                className={cn("absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background", dotClass)}
              />
            )}
            <span className="sr-only">{text}</span>
          </li>
        );
      })}
      {hidden.length > 0 && (
        <li
          title={hidden.map((rental) => rental.service.name).join(", ")}
          className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-background"
        >
          +{hidden.length}
          <span className="sr-only">: {hidden.map((rental) => rental.service.name).join(", ")}</span>
        </li>
      )}
    </ul>
  );
}
