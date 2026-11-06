import { addMonths, daysBetween } from "@yiya/shared/dates";
import { Popover, PopoverContent, PopoverTrigger } from "@yiya/ui/components/popover";
import { Switch } from "@yiya/ui/components/switch";
import { cn } from "@yiya/ui/lib/utils";
import dayjs from "dayjs";
import { CalendarDays, CornerDownRight } from "lucide-react";
import { type ReactNode, useState } from "react";

import DateInput from "@/common/components/date-input";
import HorizontalScroller from "@/common/components/horizontal-scroller";
import MonthCalendar from "@/common/components/month-calendar";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import { formatDayMonth } from "@/common/utils/format-date";
import { durationLabel } from "@/modules/rentals/components/duration-badges";
import { RENTAL_MONTH_SHORTCUTS } from "@/modules/rentals/utils/rental-form";

export interface IRentalPeriod {
  startsOn: string;
  expiresOn: string;
}

type TStep = "start" | "end";

/* Los meses que se ofrecen para terminar: el año que sigue al inicio. */
const MONTH_OPTIONS = 12;
/* Más allá de esto no se busca un número exacto de meses: ya es una fecha escrita. */
const MAX_EXACT_MONTHS = 24;
const DEFAULT_MONTHS = 1;

/** Los meses exactos del periodo (del 5 al 5), o `null` si es otra fecha (una semana…). */
export const exactMonthsOf = ({ startsOn, expiresOn }: IRentalPeriod): number | null => {
  for (let months = 1; months <= MAX_EXACT_MONTHS; months += 1) {
    if (addMonths(startsOn, months) === expiresOn) {
      return months;
    }
  }
  return null;
};

/** «2 meses», o los días si no son meses exactos («7 días»). */
export const lengthLabel = (period: IRentalPeriod): string => {
  const months = exactMonthsOf(period);
  if (months !== null) {
    return durationLabel(months);
  }
  const days = daysBetween(period.startsOn, period.expiresOn);
  return days === 1 ? "1 día" : `${days} días`;
};

interface IChoiceChipProps {
  isChosen: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}

/**
 * Una opción como en Airbnb: borde fino gris y, la elegida, borde grueso del color del
 * texto. Sin fondo de marca (Thony, 2026-11-06: colores simples, más cómodos a la vista).
 */
export function ChoiceChip({ isChosen, onClick, className, children }: IChoiceChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isChosen}
      onClick={onClick}
      className={cn(
        "cursor-pointer border bg-card text-foreground transition-[transform,border-color] duration-150 ease-out active:scale-[0.97]",
        isChosen ? "border-foreground ring-1 ring-foreground" : "border-border hover:border-foreground/40",
        className,
      )}
    >
      {children}
    </button>
  );
}

interface IStepTabsProps {
  step: TStep;
  period: IRentalPeriod;
  onChange: (step: TStep) => void;
}

/**
 * «Inicia · Finaliza» como el «Fechas · Flexible» de Airbnb, con la fecha de cada uno. La
 * pestaña elegida lleva el texto más oscuro; la otra, gris.
 */
function StepTabs({ step, period, onChange }: IStepTabsProps) {
  const tabs: { id: TStep; label: string; date: string }[] = [
    { id: "start", label: "Inicia", date: period.startsOn },
    { id: "end", label: "Finaliza", date: period.expiresOn },
  ];
  return (
    <div role="tablist" className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
      {tabs.map((tab) => {
        const isActive = step === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-1.5 text-center transition-[background-color,box-shadow,color] duration-150",
              isActive ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:bg-card/60",
            )}
          >
            {/* Elegida en 500, la otra en 400 (Thony, 2026-11-06): el color ya marca la diferencia. */}
            <span className={cn("block text-xs", isActive ? "font-medium" : "font-normal")}>{tab.label}</span>
            <span className={cn("block tabular-nums", isActive ? "font-medium" : "font-normal")}>
              {formatDayMonth(tab.date)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface IEndOptionsProps {
  period: IRentalPeriod;
  /** Un tiempo o un mes: ya está elegido. */
  onPick: (expiresOn: string) => void;
  /** La fecha escrita o del calendario: se sigue eligiendo, no se cierra nada. */
  onWrite: (expiresOn: string) => void;
}

/**
 * Cuándo termina: los tiempos de siempre (1 · 3 · 6 meses · 1 año) y, debajo, los meses del
 * año que sigue en una fila con scroll horizontal (para no estirar el popover). Tocar un mes
 * termina el mismo día del inicio en ese mes. Con el switch, la fecha se escribe o se elige
 * en un calendario: cubre lo raro, como una semana.
 */
function EndOptions({ period, onPick, onWrite }: IEndOptionsProps) {
  const months = exactMonthsOf(period);
  const [isWritten, setIsWritten] = useState(months === null);
  const start = dayjs(period.startsOn);

  return (
    <div className="min-w-0 space-y-4">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="text-sm text-foreground">Escribir la fecha</span>
        <Switch checked={isWritten} onCheckedChange={setIsWritten} />
      </label>

      {isWritten ? (
        <DateInput
          label="Fecha en que finaliza"
          value={period.expiresOn}
          rangeEdge={period.startsOn}
          validate={(iso) => (iso <= period.startsOn ? "El fin tiene que ser después del inicio." : null)}
          onChange={onWrite}
        />
      ) : (
        <>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">¿Cuánto tiempo?</h3>
            <div role="radiogroup" aria-label="Tiempo de alquiler" className="flex flex-wrap gap-2">
              {RENTAL_MONTH_SHORTCUTS.map((option) => (
                <ChoiceChip
                  key={option}
                  isChosen={months === option}
                  onClick={() => onPick(addMonths(period.startsOn, option))}
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                >
                  {durationLabel(option)}
                </ChoiceChip>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">¿Hasta qué mes?</h3>
            <HorizontalScroller
              role="radiogroup"
              label="Mes en que finaliza"
              previousLabel="Meses anteriores"
              nextLabel="Más meses"
              className="snap-x gap-2"
            >
              {Array.from({ length: MONTH_OPTIONS }, (_, index) => {
                const offset = index + 1;
                const month = start.add(offset, "month");
                return (
                  <ChoiceChip
                    key={offset}
                    isChosen={months === offset}
                    onClick={() => onPick(addMonths(period.startsOn, offset))}
                    className="flex w-24 shrink-0 snap-start flex-col items-center gap-1 rounded-xl px-2 py-3"
                  >
                    <CalendarDays className="size-5 text-muted-foreground" aria-hidden />
                    <span className="text-sm font-semibold capitalize">{month.format("MMMM")}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{month.format("YYYY")}</span>
                  </ChoiceChip>
                );
              })}
            </HorizontalScroller>
          </section>
        </>
      )}
    </div>
  );
}

interface IRentalPeriodPickerProps {
  value: IRentalPeriod;
  onChange: (period: IRentalPeriod) => void;
  /**
   * El inicio más temprano que se acepta (renovar: el vencimiento anterior). Un día antes no se
   * apaga en el calendario: al tocarlo, dice por qué.
   */
  minStartsOn?: string;
  className?: string;
}

/**
 * **Un solo campo para el inicio y el fin** del alquiler (Thony, 2026-11-06). Dice «Del 05 nov
 * al 05 dic» y, debajo, «↳ 1 mes» (dentro del campo le quitaba espacio a las fechas). Abre
 * un popover con las pestañas Inicia y Finaliza:
 *
 * - Escritorio: las dos mitades a la vez, el calendario del inicio y, al lado, cuándo termina.
 * - Celular: una mitad a la vez, para no pasarse de ancho.
 *
 * Elegir el inicio pasa a Finaliza y conserva la duración (si eran 3 meses, siguen 3); si no
 * eran meses exactos, pone 1 mes. Elegir un tiempo o un mes cierra el popover.
 */
export default function RentalPeriodPicker({ value, onChange, minStartsOn, className }: IRentalPeriodPickerProps) {
  const isWide = useMediaQuery("(min-width: 640px)");
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<TStep>("start");
  const [startError, setStartError] = useState<string | null>(null);

  const handleStartSelect = (startsOn: string) => {
    if (minStartsOn && startsOn < minStartsOn) {
      setStartError(`No puede empezar antes del ${formatDayMonth(minStartsOn)}. Para otras fechas, edita el alquiler.`);
      return;
    }
    setStartError(null);
    const months = exactMonthsOf(value) ?? DEFAULT_MONTHS;
    onChange({ startsOn, expiresOn: addMonths(startsOn, months) });
    setStep("end");
  };

  const handleEndChange = (expiresOn: string) => onChange({ ...value, expiresOn });

  const handleEndPicked = (expiresOn: string) => {
    handleEndChange(expiresOn);
    setIsOpen(false);
  };

  const calendar = (
    <div className="space-y-2">
      <MonthCalendar value={value.startsOn} rangeEdge={value.expiresOn} onSelect={handleStartSelect} />
      {startError && <p className="text-xs font-medium text-destructive">{startError}</p>}
    </div>
  );
  /* `key`: con otro inicio, el switch vuelve a decidir si son meses exactos. */
  const endOptions = (
    <EndOptions key={value.startsOn} period={value} onPick={handleEndPicked} onWrite={handleEndChange} />
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) {
            setStep("start");
            setStartError(null);
          }
        }}
      >
        <PopoverTrigger
          render={
            <button
              type="button"
              className="flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 text-left text-sm text-foreground transition-colors hover:border-foreground/40 focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:outline-none"
            />
          }
        >
          <CalendarDays className="size-4.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate tabular-nums">
            Del {formatDayMonth(value.startsOn)} al {formatDayMonth(value.expiresOn)}
          </span>
        </PopoverTrigger>

        <PopoverContent className={cn("space-y-4", isWide ? "w-160" : "w-[calc(100vw-2rem)]")}>
          <StepTabs step={step} period={value} onChange={setStep} />
          {isWide ? (
            <div className="grid grid-cols-2 gap-6">
              <div className={cn("transition-opacity", step === "end" && "opacity-60 hover:opacity-100")}>
                {calendar}
              </div>
              <div className={cn("min-w-0 transition-opacity", step === "start" && "opacity-60 hover:opacity-100")}>
                {endOptions}
              </div>
            </div>
          ) : step === "start" ? (
            calendar
          ) : (
            endOptions
          )}
        </PopoverContent>
      </Popover>

      {/* La flecha que baja y dobla dice que la duración es de la fecha de arriba. */}
      <p className="flex items-center gap-1.5 pl-3.5 text-xs font-medium text-muted-foreground">
        <CornerDownRight className="size-3.5 shrink-0" aria-hidden />
        {lengthLabel(value)}
      </p>
    </div>
  );
}
