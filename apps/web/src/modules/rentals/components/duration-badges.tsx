import { Badge } from "@yiya/ui/components/badge";
import { Input } from "@yiya/ui/components/input";
import { addMonths } from "@yiya/shared/dates";
import { CalendarDays, Check } from "lucide-react";

import { formatCompactDate, formatDayMonth } from "@/common/utils/format-date";
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
    <Badge color="primary">
      {months === null
        ? `${formatCompactDate(dates.startsOn)} → ${formatCompactDate(dates.expiresOn)}`
        : durationLabel(months)}
    </Badge>
  );
}

interface IChoiceBadgeProps {
  isChosen: boolean;
  label: string;
  /** Va al inicio cuando no está elegido; elegido, siempre el check. */
  icon?: typeof Check;
  onClick: () => void;
}

/**
 * Un badge que se elige (acordado 2026-11-04): el elegido lleno, de marca y con check; el
 * resto en **outline** neutro, para que se vea tocable (ajustado por Thony).
 */
function ChoiceBadge({ isChosen, label, icon: Icon, onClick }: IChoiceBadgeProps) {
  const LeadIcon = isChosen ? Check : Icon;
  return (
    <Badge
      size="lg"
      color={isChosen ? "primary" : "neutral"}
      variant={isChosen ? "solid" : "outline"}
      className="cursor-pointer transition-transform duration-150 ease-out active:scale-95"
      render={<button type="button" role="radio" aria-checked={isChosen} onClick={onClick} />}
    >
      {LeadIcon && <LeadIcon data-icon="inline-start" />}
      {label}
    </Badge>
  );
}

interface IDurationBadgesProps {
  dates: TLineDates;
  /** «Más…» abierto: las fechas a mano. */
  isCustomOpen: boolean;
  onChange: (expiresOn: string) => void;
  onToggleCustom: () => void;
}

/** Los 4 tiempos y «Más…» (fechas a mano), como badges. */
export function DurationBadges({ dates, isCustomOpen, onChange, onToggleCustom }: IDurationBadgesProps) {
  const current = shortcutOf(dates);
  return (
    <div role="radiogroup" aria-label="Tiempo de alquiler" className="flex flex-wrap gap-2">
      {RENTAL_MONTH_SHORTCUTS.map((months) => (
        <ChoiceBadge
          key={months}
          isChosen={!isCustomOpen && current === months}
          label={durationLabel(months)}
          onClick={() => onChange(addMonths(dates.startsOn, months))}
        />
      ))}
      <ChoiceBadge
        isChosen={isCustomOpen || current === null}
        label="Más…"
        icon={CalendarDays}
        onClick={onToggleCustom}
      />
    </div>
  );
}

/* Delgado: va en línea con el texto. `text-base` en celular evita el zoom de iOS. */
const RANGE_INPUT_CLASS = "h-9 w-auto min-w-0 flex-1 rounded-lg px-2 tabular-nums";

interface IDurationRangeProps {
  dates: TLineDates;
  /** «Más…»: las mismas fechas, pero como inputs en su lugar. */
  isEditable: boolean;
  onStartsOnChange: (startsOn: string) => void;
  onExpiresOnChange: (expiresOn: string) => void;
}

/**
 * De cuándo a cuándo va el alquiler (acordado 2026-11-04): «Del 04 nov → 04 dic» sobre
 * `bg-muted`. Con «Más…», en el mismo lugar van los inputs, «Del [ ] Al [ ]»: es lo mismo,
 * solo que editable.
 */
export function DurationRange({ dates, isEditable, onStartsOnChange, onExpiresOnChange }: IDurationRangeProps) {
  if (!isEditable) {
    return (
      <p className="rounded-lg bg-muted px-3 py-2 text-sm font-semibold text-foreground tabular-nums">
        Del {formatDayMonth(dates.startsOn)} → {formatDayMonth(dates.expiresOn)}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-muted p-2 text-sm font-semibold text-foreground">
      <label className="flex min-w-40 flex-1 items-center gap-2">
        Del
        <Input
          type="date"
          value={dates.startsOn}
          className={RANGE_INPUT_CLASS}
          onChange={(event) => onStartsOnChange(event.target.value)}
        />
      </label>
      <label className="flex min-w-40 flex-1 items-center gap-2">
        Al
        <Input
          type="date"
          min={dates.startsOn}
          value={dates.expiresOn}
          className={RANGE_INPUT_CLASS}
          onChange={(event) => onExpiresOnChange(event.target.value)}
        />
      </label>
    </div>
  );
}
