import { todayInLima } from "@yiya/shared/dates";
import { getExpiry } from "@yiya/shared/purchases";
import { cn } from "@yiya/ui/lib/utils";

import { formatShortDate } from "@/common/utils/format-date";

interface IExpiryLabelProps {
  /** El vencimiento de la cuenta; `null` si todavía no tiene compras. */
  expiresOn: string | null;
  className?: string;
}

const daysLeftText = (days: number): string => {
  if (days === 0) {
    return "Vence hoy";
  }
  return days === 1 ? "Vence mañana" : `Vence en ${days} días`;
};

/**
 * RF-14: «Vencida» en rojo si ya pasó; «Vence en N días» en ámbar si faltan 3 o menos; si
 * no, la fecha. «Hoy» es el de Perú.
 */
export default function ExpiryLabel({ expiresOn, className }: IExpiryLabelProps) {
  if (expiresOn === null) {
    return <span className={cn("text-muted-foreground", className)}>Sin compras</span>;
  }

  const expiry = getExpiry(expiresOn, todayInLima());

  return (
    <span
      title={expiry.status === "ok" ? undefined : formatShortDate(expiresOn)}
      className={cn(
        "font-semibold tabular-nums",
        expiry.status === "expired" && "text-destructive",
        expiry.status === "warning" && "text-warning",
        expiry.status === "ok" && "text-foreground",
        className,
      )}
    >
      {expiry.status === "expired" && "Vencida"}
      {expiry.status === "warning" && daysLeftText(expiry.days)}
      {expiry.status === "ok" && formatShortDate(expiresOn)}
    </span>
  );
}
