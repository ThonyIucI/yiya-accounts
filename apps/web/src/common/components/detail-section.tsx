import { cn } from "@yiya/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface IDetailSectionProps {
  title: string;
  /** A la derecha del título (p. ej. «Agregar perfil»). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Card con título de un detalle («Cuenta», «Nota»…), como las de id-pos: el encabezado va
 * sobre un fondo más oscuro que el cuerpo.
 */
export function DetailSection({ title, action, children, className }: IDetailSectionProps) {
  return (
    <section className={cn("overflow-hidden rounded-2xl bg-card shadow-card", className)}>
      <div className="flex min-h-12 items-center justify-between gap-2 bg-muted px-4 py-1.5">
        <h3 className="font-heading text-sm font-extrabold text-foreground">{title}</h3>
        {action}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

/**
 * Las filas `DetailRow` de una sección. Comparten columnas (etiqueta · valor · acciones):
 * todos los valores arrancan en el mismo punto, sin importar lo largo de cada etiqueta.
 */
export function DetailList({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[max-content_minmax(0,1fr)_max-content] items-center gap-x-3">
      {children}
    </div>
  );
}

interface IDetailRowProps {
  icon: LucideIcon;
  label: string;
  /** Sin valor se muestra «—» en gris: el dato todavía no está, no se inventa. */
  children?: ReactNode;
  /** Botones al final de la fila (copiar, ver…). */
  actions?: ReactNode;
}

/** Una fila **ícono + etiqueta: valor** del detalle, con sus acciones al final. Va dentro de `DetailList`. */
export function DetailRow({ icon: Icon, label, children, actions }: IDetailRowProps) {
  const isEmpty = children === undefined || children === null || children === "";

  return (
    <div className="col-span-3 grid min-h-11 grid-cols-subgrid items-center py-1">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon aria-hidden className="size-4.5 shrink-0" />
        {label}:
      </span>
      <span
        className={cn(
          "min-w-0 truncate font-semibold",
          isEmpty ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {isEmpty ? "—" : children}
      </span>
      <div className="-mr-2 flex items-center">{actions}</div>
    </div>
  );
}
