import { Badge } from "@yiya/ui/components/badge";
import { addMonths } from "@yiya/shared/dates";

import { formatCompactDate } from "@/common/utils/format-date";
import type { ICartLine } from "@/modules/rentals/utils/rental-cart";
import { RENTAL_MONTH_SHORTCUTS } from "@/modules/rentals/utils/rental-form";

type TLineDates = Pick<ICartLine, "startsOn" | "expiresOn">;

/** «1 mes» · «3 meses» · «6 meses» · «1 año». */
export const durationLabel = (months: number): string =>
  months === 12 ? "1 año" : `${months} ${months === 1 ? "mes" : "meses"}`;

/** El atajo que corresponde a las fechas, o `null` si son otras. */
export const shortcutOf = (dates: TLineDates): number | null =>
  RENTAL_MONTH_SHORTCUTS.find((months) => dates.expiresOn === addMonths(dates.startsOn, months)) ?? null;

/**
 * La duración de una línea como **badge** (acordado 2026-11-04: badge, no botón con borde):
 * «3 meses», o las fechas si no es un atajo («04-nov → 20-dic»).
 */
export function DurationBadge({ dates }: { dates: TLineDates }) {
  const months = shortcutOf(dates);
  return (
    /* Como las opciones del calendario (Thony, 2026-11-06): borde fino neutro, sin color de marca. */
    <Badge color="neutral" variant="outline" className="border-border text-foreground">
      {months === null
        ? `${formatCompactDate(dates.startsOn)} → ${formatCompactDate(dates.expiresOn)}`
        : durationLabel(months)}
    </Badge>
  );
}
