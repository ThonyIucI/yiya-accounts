import { Badge } from "@yiya/ui/components/badge";
import type { IRentalResource } from "@yiya/shared/rentals";

import { EXPIRY_COLORS, describeExpiry, expiryOf } from "@/modules/accounts/utils/expiry";

/* Más que esto empuja la fila a tres líneas en 320 px; el resto va en «+N». */
const MAX_VISIBLE = 3;

/**
 * Lo que alquila un cliente como **badges chicos con el nombre del servicio**, uno por perfil
 * (acordado 2026-11-04, en vez de los logos): el que vence hoy, pronto o ya venció lleva su
 * color; el que está al día va neutro, para no llenar la lista de color. El detalle de la
 * fecha va en el tooltip.
 */
export default function RentalServiceBadges({ rentals }: { rentals: IRentalResource[] }) {
  const visible = rentals.slice(0, MAX_VISIBLE);
  const hidden = rentals.slice(MAX_VISIBLE);

  return (
    <ul className="flex min-w-0 flex-wrap items-center gap-1">
      {visible.map((rental) => {
        const expiry = expiryOf(rental.expiresOn);
        const text = `${rental.service.name} · ${describeExpiry(rental.expiresOn, expiry)}`;
        return (
          <li key={rental.id} title={text}>
            <Badge color={expiry.status === "ok" ? "neutral" : EXPIRY_COLORS[expiry.status]}>
              {rental.service.name}
            </Badge>
            <span className="sr-only">: {describeExpiry(rental.expiresOn, expiry)}</span>
          </li>
        );
      })}
      {hidden.length > 0 && (
        <li title={hidden.map((rental) => rental.service.name).join(", ")}>
          <Badge color="neutral">+{hidden.length}</Badge>
          <span className="sr-only">: {hidden.map((rental) => rental.service.name).join(", ")}</span>
        </li>
      )}
    </ul>
  );
}
