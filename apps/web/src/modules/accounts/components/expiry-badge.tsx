import type { TExpiryStatus } from "@yiya/shared/purchases";

import Badge, { type TBadgeTone } from "@/common/components/badge";
import { describeExpiry, expiryOf } from "@/modules/accounts/utils/expiry";

const BADGES: Record<TExpiryStatus, { label: string; tone: TBadgeTone }> = {
  expired: { label: "Vencida", tone: "expired" },
  today: { label: "Por vencer", tone: "today" },
  soon: { label: "Por vencer", tone: "soon" },
  ok: { label: "Al día", tone: "success" },
};

/**
 * El estado de la cuenta al lado de su nombre en el detalle (acordado 2026-10-22): Vencida,
 * Por vencer (naranja si es hoy, amarillo si faltan 1 o 2 días) o Al día. Sin compras no
 * lleva badge: la sección Compras ya lo dice.
 */
export default function ExpiryBadge({ expiresOn }: { expiresOn: string | null }) {
  if (expiresOn === null) {
    return null;
  }

  const expiry = expiryOf(expiresOn);
  const badge = BADGES[expiry.status];

  return (
    <span title={describeExpiry(expiresOn, expiry)}>
      <Badge tone={badge.tone}>{badge.label}</Badge>
    </span>
  );
}
