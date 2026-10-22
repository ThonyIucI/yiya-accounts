import { Input } from "@yiya/ui/components/input";
import { cn } from "@yiya/ui/lib/utils";
import { Loader2 } from "lucide-react";
import { type InputHTMLAttributes, type KeyboardEvent, useRef, useState } from "react";

import { useDebouncedCallback } from "@/common/hooks/use-debounced-callback";

/** Pausa al escribir antes de guardar, igual que los precios de Servicios. */
const SAVE_DEBOUNCE_MS = 700;

interface IInlineTextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onBlur"> {
  id: string;
  label: string;
  value: string;
  /** `null` si es válido; si no, el mensaje (se muestra debajo y no se guarda). */
  validate: (value: string) => string | null;
  /** Guarda; `false` si falló (el campo vuelve a lo guardado). */
  onSave: (value: string) => Promise<boolean>;
}

/**
 * Texto editable ahí mismo (nombre o PIN de un perfil), con el patrón de los precios de
 * Servicios: se guarda al dejar de escribir y, al salir o con Enter, en el momento. Con
 * Escape se descarta. Mientras no se edita muestra lo guardado.
 */
export default function InlineTextField({
  id,
  label,
  value,
  validate,
  onSave,
  className,
  ...inputProps
}: IInlineTextFieldProps) {
  const [text, setText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* Lo último que se mandó: no se manda dos veces lo mismo (debounce y después blur). */
  const lastSentRef = useRef<string | undefined>(undefined);
  const isDiscardingRef = useRef(false);

  const messageId = `${id}-message`;

  const commit = async (raw: string, isFinal: boolean) => {
    const next = raw.trim();
    const baseline = lastSentRef.current ?? value;
    if (next === baseline) {
      return;
    }
    const message = validate(next);
    if (message) {
      /* Mientras se escribe, un valor a medias todavía no es error. */
      if (isFinal) {
        setError(message);
      }
      return;
    }
    lastSentRef.current = next;
    setIsSaving(true);
    const isSaved = await onSave(next);
    setIsSaving(false);
    if (!isSaved) {
      lastSentRef.current = undefined;
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
    <div className={cn("min-w-0 space-y-1", className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          value={isEditing ? text : value}
          aria-invalid={error !== null}
          aria-describedby={error ? messageId : undefined}
          className="h-11 text-base md:text-sm"
          onFocus={() => {
            setText(value);
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
          {...inputProps}
        />
        {isSaving && (
          <Loader2
            aria-label="Guardando"
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground motion-reduce:animate-none"
          />
        )}
      </div>
      {error && (
        <p id={messageId} className="text-sm font-bold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
