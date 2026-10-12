import { INVALID_SOLES_MESSAGE, parseSoles, toSolesInput } from "@yiya/shared/money";
import { cn } from "@yiya/ui/lib/utils";
import { type KeyboardEvent, useRef, useState } from "react";

import { useDebouncedCallback } from "@/common/hooks/use-debounced-callback";

import SolesInput from "./soles-input";

const ACTIVE_NEEDS_PRICE_MESSAGE = "Un servicio activo necesita sus dos precios.";
/** Pausa al escribir antes de guardar: no se manda un request por cada tecla. */
const SAVE_DEBOUNCE_MS = 700;

interface IPriceFieldProps {
  id: string;
  label: string;
  value: number | null;
  /** Si el servicio está activo: entonces no se puede vaciar. */
  isRequired: boolean;
  isCompact?: boolean;
  /** Guarda el precio; `false` si falló (el campo vuelve al valor guardado). */
  onSave: (value: number | null) => Promise<boolean>;
}

/**
 * Precio en soles editable ahí mismo, en la card o en la fila. Se guarda solo al dejar de
 * escribir (debounce), y al salir del campo o con Enter se guarda en el momento. Con Escape
 * se descarta. Si algo no es válido, el error queda debajo; al salir, el campo vuelve al
 * valor guardado.
 */
export default function PriceField({
  id,
  label,
  value,
  isRequired,
  isCompact = false,
  onSave,
}: IPriceFieldProps) {
  const [text, setText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /*
    Lo último que se mandó a guardar mientras se edita. Evita mandar dos veces lo mismo
    cuando el debounce ya guardó y después llega el blur, antes de que vuelva `value`.
  */
  const lastSentRef = useRef<number | null | undefined>(undefined);
  /* Escape: el blur que sigue no guarda nada. */
  const isDiscardingRef = useRef(false);

  /* Mientras no se edita, el campo muestra lo guardado: nunca un texto viejo. */
  const shownText = isEditing ? text : toSolesInput(value);
  const messageId = `${id}-message`;

  const save = async (next: number | null) => {
    lastSentRef.current = next;
    setIsSaving(true);
    const isSaved = await onSave(next);
    setIsSaving(false);
    if (!isSaved) {
      lastSentRef.current = undefined;
    }
  };

  /** `isFinal`: al salir del campo. Mientras se escribe, un campo vacío todavía no es error. */
  const commit = async (raw: string, isFinal: boolean) => {
    const trimmed = raw.trim();
    const baseline = lastSentRef.current !== undefined ? lastSentRef.current : value;

    if (trimmed === "") {
      if (baseline === null) {
        return;
      }
      if (isRequired) {
        if (isFinal) {
          setError(ACTIVE_NEEDS_PRICE_MESSAGE);
        }
        return;
      }
      await save(null);
      return;
    }

    const parsed = parseSoles(trimmed);
    if (parsed === null) {
      setError(INVALID_SOLES_MESSAGE);
      return;
    }
    if (parsed !== baseline) {
      await save(parsed);
    }
  };

  const debounced = useDebouncedCallback((raw: string) => commit(raw, false), SAVE_DEBOUNCE_MS);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      isDiscardingRef.current = true;
      event.currentTarget.blur();
    }
  };

  return (
    <div className="min-w-0 space-y-1">
      <label
        htmlFor={id}
        className={cn("block text-sm font-semibold text-muted-foreground", isCompact && "sr-only")}
      >
        {label}
      </label>
      <SolesInput
        id={id}
        isCompact={isCompact}
        isSaving={isSaving}
        value={shownText}
        aria-invalid={error !== null}
        aria-describedby={error ? messageId : undefined}
        onFocus={() => {
          setText(toSolesInput(value));
          setIsEditing(true);
          setError(null);
          lastSentRef.current = undefined;
        }}
        onChange={(event) => {
          setText(event.target.value);
          setError(null);
          debounced.schedule(event.target.value);
        }}
        onBlur={() => {
          debounced.cancel();
          setIsEditing(false);
          if (isDiscardingRef.current) {
            isDiscardingRef.current = false;
            return;
          }
          commit(text, true);
        }}
        onKeyDown={handleKeyDown}
      />
      {error && (
        <p id={messageId} className="text-sm font-bold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
