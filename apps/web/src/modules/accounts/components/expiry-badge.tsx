import type { TExpiryStatus } from "@yiya/shared/purchases";
import { Badge } from "@yiya/ui/components/badge";

import { EXPIRY_COLORS, describeExpiry, expiryOf } from "@/modules/accounts/utils/expiry";

/** Los de la cuenta. Un alquiler pasa los suyos («Vencido»). */
const ACCOUNT_LABELS: Record<TExpiryStatus, string> = {
  expired: "Vencida",
  today: "Por vencer",
  soon: "Por vencer",
  ok: "Al día",
};

interface IExpiryBadgeProps {
  expiresOn: string | null;
  labels?: Record<TExpiryStatus, string>;
}

/**
 * El estado de la cuenta al lado de su nombre en el detalle (acordado 2026-10-22): Vencida,
 * Por vencer (naranja si es hoy, amarillo si faltan 1 o 2 días) o Al día. Sin compras no
 * lleva badge: la sección Compras ya lo dice.
 */
export default function ExpiryBadge({ expiresOn, labels = ACCOUNT_LABELS }: IExpiryBadgeProps) {
  if (expiresOn === null) {
    return null;
  }

  const expiry = expiryOf(expiresOn);

  return (
    <Badge color={EXPIRY_COLORS[expiry.status]} title={describeExpiry(expiresOn, expiry)}>
      {labels[expiry.status]}
    </Badge>
  );
}
