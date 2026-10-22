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

/** Card con título de un detalle («Acceso», «Compra»…), como las de id-pos. */
export function DetailSection({ title, action, children, className }: IDetailSectionProps) {
  return (
    <section className={cn("rounded-2xl bg-card shadow-card", className)}>
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <h3 className="font-heading text-sm font-extrabold text-foreground">{title}</h3>
        {action}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </section>
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

/** Una fila **ícono + etiqueta: valor** del detalle, con sus acciones al final. */
export function DetailRow({ icon: Icon, label, children, actions }: IDetailRowProps) {
  const isEmpty = children === undefined || children === null || children === "";

  return (
    <div className="flex min-h-11 items-center gap-3 py-1">
      <Icon aria-hidden className="size-4.5 shrink-0 text-muted-foreground" />
      <span className="shrink-0 text-sm text-muted-foreground">{label}:</span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-semibold",
          isEmpty ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {isEmpty ? "—" : children}
      </span>
      {actions && <div className="-mr-2 flex shrink-0 items-center">{actions}</div>}
    </div>
  );
}
