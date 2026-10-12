import { Input } from "@yiya/ui/components/input";
import { INVALID_SOLES_MESSAGE, parseSoles, toSolesInput } from "@yiya/shared/money";
import { cn } from "@yiya/ui/lib/utils";
import { Loader2 } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

const ACTIVE_NEEDS_PRICE_MESSAGE = "Un servicio activo necesita sus dos precios.";

interface IPriceFieldProps {
  id: string;
  label: string;
  value: number | null;
  /** Si el servicio está activo: entonces no se puede vaciar. */
  isRequired: boolean;
  /** Aviso del switch cuando se intentó activar sin este precio. */
  hint?: string | null;
  isCompact?: boolean;
  /** Guarda el precio; `false` si falló (el campo vuelve al valor anterior). */
  onSave: (value: number | null) => Promise<boolean>;
}

/**
 * Precio en soles editable ahí mismo, en la card o en la fila. Se guarda al salir del
 * campo o con Enter, solo si cambió y es válido; con Escape se descarta. Si algo falla, el
 * error queda debajo y el campo vuelve al valor guardado.
 */
export default function PriceField({
  id,
  label,
  value,
  isRequired,
  hint,
  isCompact = false,
  onSave,
}: IPriceFieldProps) {
  const [text, setText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Mientras no se edita, el campo muestra lo guardado: nunca un texto viejo. */
  const shownText = isEditing ? text : toSolesInput(value);
  const message = error ?? (shownText === "" ? hint : null) ?? null;
  const messageId = `${id}-message`;

  const save = async (next: number | null) => {
    setIsSaving(true);
    await onSave(next);
    setIsSaving(false);
  };

  const commit = async () => {
    const trimmed = text.trim();
    setIsEditing(false);

    if (trimmed === "") {
      if (value === null) {
        return;
      }
      if (isRequired) {
        setError(ACTIVE_NEEDS_PRICE_MESSAGE);
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
    if (parsed !== value) {
      await save(parsed);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      setText(toSolesInput(value));
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
      <div className="relative">
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-semibold text-muted-foreground",
            isCompact ? "text-base" : "text-lg",
          )}
        >
          S/
        </span>
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={shownText}
          disabled={isSaving}
          aria-invalid={message !== null}
          aria-describedby={message ? messageId : undefined}
          className={cn("pr-9 pl-10 tabular-nums", isCompact && "h-11 text-base")}
          onFocus={() => {
            setText(toSolesInput(value));
            setIsEditing(true);
            setError(null);
          }}
          onChange={(event) => {
            setText(event.target.value);
            setError(null);
          }}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
        {isSaving && (
          <Loader2
            aria-hidden
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground motion-reduce:animate-none"
          />
        )}
      </div>
      {message && (
        <p id={messageId} className="text-sm font-bold text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
