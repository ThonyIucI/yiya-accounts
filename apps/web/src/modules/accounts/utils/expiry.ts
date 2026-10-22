import { todayInLima } from "@yiya/shared/dates";
import { type IExpiry, type TExpiryStatus, getExpiry } from "@yiya/shared/purchases";

import { formatCompactDate, isCurrentYear } from "@/common/utils/format-date";

/**
 * Cómo se ve un vencimiento (RF-14, acordado 2026-10-22): rojo si venció, naranja si vence
 * hoy, amarillo si faltan 1 o 2 días. Los tres colores pasan 4.5:1 de contraste.
 */
export const EXPIRY_TEXT_CLASSES: Record<TExpiryStatus, string> = {
  expired: "text-status-expired",
  today: "text-status-today",
  soon: "text-status-soon",
  ok: "text-foreground",
};

/** El estado con «hoy» en Perú. */
export const expiryOf = (expiresOn: string): IExpiry => getExpiry(expiresOn, todayInLima());

/* «el 06-set» si es de este año; «en oct-2025» si no (un mes no lleva «el»). */
const whenText = (expiresOn: string): string =>
  `${isCurrentYear(expiresOn) ? "el" : "en"} ${formatCompactDate(expiresOn)}`;

/** «Venció el 06-set» · «Venció en oct-2025» · «Vence hoy» · «Vence mañana» · «Vence en 2 días» · «Vence el 18-nov». */
export const describeExpiry = (expiresOn: string, expiry: IExpiry): string => {
  switch (expiry.status) {
    case "expired":
      return `Venció ${whenText(expiresOn)}`;
    case "today":
      return "Vence hoy";
    case "soon":
      return expiry.days === 1 ? "Vence mañana" : `Vence en ${expiry.days} días`;
    case "ok":
      return `Vence ${whenText(expiresOn)}`;
  }
};
