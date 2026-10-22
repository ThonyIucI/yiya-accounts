import { cn } from "@yiya/ui/lib/utils";

import { formatShortDate } from "@/common/utils/format-date";
import { EXPIRY_TEXT_CLASSES, describeExpiry, expiryOf } from "@/modules/accounts/utils/expiry";

interface IExpiryDateProps {
  /** El vencimiento de la cuenta; `null` si todavía no tiene compras. */
  expiresOn: string | null;
  className?: string;
}

/**
 * La fecha de vencimiento («18 nov 2026») pintada según su estado: rojo si venció, naranja
 * si vence hoy, amarillo si faltan 1 o 2 días. Al pasar el mouse dice «Vence en 2 días».
 * Para la tabla y el detalle, donde hay espacio para la fecha.
 */
export default function ExpiryDate({ expiresOn, className }: IExpiryDateProps) {
  if (expiresOn === null) {
    return <span className={cn("text-muted-foreground", className)}>Sin compras</span>;
  }

  const expiry = expiryOf(expiresOn);

  return (
    <span
      title={describeExpiry(expiresOn, expiry)}
      className={cn("font-semibold tabular-nums", EXPIRY_TEXT_CLASSES[expiry.status], className)}
    >
      {formatShortDate(expiresOn)}
    </span>
  );
}
