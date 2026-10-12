import { Button } from "@yiya/ui/components/button";
import { cn } from "@yiya/ui/lib/utils";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect } from "react";

import { useMediaQuery } from "@/common/hooks/use-media-query";
import { useVisualViewport } from "@/common/hooks/use-visual-viewport";

/** El mismo corte que el `sm:` de Tailwind, para que la animación siga al layout. */
const DESKTOP_QUERY = "(min-width: 640px)";

type TModalWidth = "sm" | "md" | "lg";

const WIDTH_CLASS: Record<TModalWidth, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

interface IModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  /** Botones del pie. Van pegados abajo y no se van con el scroll del cuerpo. */
  footer?: ReactNode;
  width?: TModalWidth;
  onClose: () => void;
}

/**
 * Modal de la app: **hoja inferior en celular y tarjeta centrada en escritorio**.
 *
 * Reemplaza al `<dialog>` nativo que usábamos antes. El nativo no sabe animar su salida
 * ni se puede anclar al teclado, y un formulario largo en un celular de gama baja
 * terminaba detrás del teclado.
 *
 * El cuerpo hace scroll por su cuenta: el encabezado y el pie se quedan fijos, que es lo
 * que permite sacar los formularios del cuerpo de la página sin que el botón de guardar
 * quede a tres pantallas de distancia.
 */
export default function Modal({
  open,
  title,
  description,
  children,
  footer,
  width = "md",
  onClose,
}: IModalProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const prefersReducedMotion = useReducedMotion();
  const viewport = useVisualViewport(open);

  /* Escape cierra, y el fondo se congela: sin esto la página de atrás scrollea sola. */
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const hidden = prefersReducedMotion
    ? { opacity: 0 }
    : isDesktop
      ? { opacity: 0, scale: 0.96 }
      : { opacity: 0, y: "100%" };

  const visible = prefersReducedMotion
    ? { opacity: 1 }
    : isDesktop
      ? { opacity: 1, scale: 1 }
      : { opacity: 1, y: 0 };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-x-0 z-50 flex items-end justify-center bg-foreground/50 backdrop-blur-sm sm:items-center sm:p-4"
          /*
            Se ancla al viewport visible y no al layout: en celular, al abrirse el
            teclado, el layout no se encoge y la hoja quedaría debajo de las teclas.
          */
          style={{ top: viewport.offsetTop, height: viewport.height || "100%" }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "flex max-h-full w-full flex-col rounded-t-3xl border-2 border-b-0 border-border bg-card pb-[env(safe-area-inset-bottom)] text-foreground shadow-sticker-md",
              "sm:max-h-[90vh] sm:rounded-3xl sm:border-b-2 sm:pb-0",
              WIDTH_CLASS[width],
            )}
            initial={hidden}
            animate={visible}
            exit={{
              ...hidden,
              transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.18, ease: "easeIn" },
            }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
          >
            {/* Agarradera: en celular avisa que es una hoja que se puede bajar. */}
            <div className="flex shrink-0 justify-center pt-3 sm:hidden">
              <span className="h-1 w-10 rounded-full bg-border" />
            </div>

            <div className="flex shrink-0 items-start justify-between gap-3 border-b-2 border-border px-5 py-4">
              <div className="min-w-0">
                <h2 className="font-heading text-xl font-extrabold break-words text-foreground">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-base text-muted-foreground">{description}</p>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Cerrar"
                className="shrink-0"
                onClick={onClose}
              >
                <X />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

            {footer && (
              /* Lado a lado siempre: en celular se reparten el ancho, en escritorio van a la derecha. */
              <div className="flex shrink-0 gap-2 border-t-2 border-border px-5 py-4 *:flex-1 sm:justify-end sm:*:flex-none">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
