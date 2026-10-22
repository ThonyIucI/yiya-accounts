import { cn } from "@yiya/ui/lib/utils";

import { EXPIRY_TEXT_CLASSES, describeExpiry, expiryOf } from "@/modules/accounts/utils/expiry";

interface IExpiryNoticeProps {
  expiresOn: string | null;
  className?: string;
}

/**
 * El aviso de la cabecera de la card (acordado 2026-10-22): «● Venció el 06-set» en
 * rojo, «● Vence hoy» en naranja, «● Vence mañana» en amarillo. **Al día no dice nada**: la
 * card no lleva la fecha, que está en la tabla y en el detalle.
 */
export default function ExpiryNotice({ expiresOn, className }: IExpiryNoticeProps) {
  if (expiresOn === null) {
    return <p className={cn("truncate text-xs text-muted-foreground", className)}>Sin compras</p>;
  }

  const expiry = expiryOf(expiresOn);
  if (expiry.status === "ok") {
    return null;
  }

  return (
    <p
      className={cn(
        /* 12 px, como los badges: el aviso no compite con el nombre del servicio. */
        "flex items-center gap-1.5 truncate text-xs font-semibold",
        EXPIRY_TEXT_CLASSES[expiry.status],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {describeExpiry(expiresOn, expiry)}
    </p>
  );
}
