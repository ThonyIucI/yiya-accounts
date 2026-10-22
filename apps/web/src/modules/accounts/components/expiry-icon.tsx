import type { TExpiryStatus } from "@yiya/shared/purchases";
import { cn } from "@yiya/ui/lib/utils";
import {
  CircleCheck,
  CircleDashed,
  CircleX,
  Clock,
  type LucideIcon,
  TriangleAlert,
} from "lucide-react";

import { EXPIRY_TEXT_CLASSES, describeExpiry, expiryOf } from "@/modules/accounts/utils/expiry";

const ICONS: Record<TExpiryStatus, LucideIcon> = {
  expired: CircleX,
  today: TriangleAlert,
  soon: Clock,
  ok: CircleCheck,
};

/* Al día en verde; los demás, con los colores de su estado. */
const ICON_CLASSES: Record<TExpiryStatus, string> = {
  ...EXPIRY_TEXT_CLASSES,
  ok: "text-success",
};

interface IExpiryIconProps {
  expiresOn: string | null;
  className?: string;
}

/**
 * El estado de la cuenta como ícono, a la derecha de su nombre (acordado 2026-10-22):
 * check verde si está al día, círculo con x rojo si venció, triángulo naranja si vence
 * hoy, reloj amarillo si faltan 1 o 2 días y círculo con «−» gris si no tiene compras. El
 * texto va en el `title` y para el lector de pantalla.
 *
 * PENDIENTE (paso 4b): el ícono gris de «no alquilada» se agrega con los alquileres; hoy no
 * hay forma de saberlo y saldría en todas las cuentas.
 */
export default function ExpiryIcon({ expiresOn, className }: IExpiryIconProps) {
  const label = expiresOn === null ? "Sin compras" : describeExpiry(expiresOn, expiryOf(expiresOn));
  const status = expiresOn === null ? null : expiryOf(expiresOn).status;
  const Icon = status === null ? CircleDashed : ICONS[status];

  return (
    <span title={label} className={cn("inline-flex shrink-0", className)}>
      <Icon
        aria-hidden
        className={cn("size-3.5", status === null ? "text-muted-foreground" : ICON_CLASSES[status])}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
