import { Switch } from "@yiya/ui/components/switch";
import { Skeleton } from "@yiya/ui/components/skeleton";
import type { IBusinessResource } from "@yiya/shared/businesses";
import { cn } from "@yiya/ui/lib/utils";
import { Store } from "lucide-react";

import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { formatShortDate } from "@/common/utils/format-date";

import BusinessStatusBadge from "./business-status-badge";

interface IBusinessCardProps {
  business: IBusinessResource;
  actions: IRowAction[];
  isToggling: boolean;
  onToggleActive: () => void;
}

/**
 * Card de listado (equivalente mobile de la fila de tabla): identidad arriba a la
 * izquierda, switch + menú arriba a la derecha, detalles abajo tras una línea.
 */
export default function BusinessCard({
  business,
  actions,
  isToggling,
  onToggleActive,
}: IBusinessCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl bg-card p-4 shadow-card transition-opacity",
        !business.isActive && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Store className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-bold text-foreground">{business.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {business.owner?.name ?? "Sin dueño"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Switch
            /* Sin `disabled` (nunca se apaga): mientras guarda, un toque más no hace nada. */
            aria-busy={isToggling}
            checked={business.isActive}
            aria-label={business.isActive ? "Desactivar negocio" : "Activar negocio"}
            onCheckedChange={onToggleActive}
          />
          <RowActions actions={actions} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          {business.owner?.email ?? "—"} · desde {formatShortDate(business.createdAt)}
        </p>
        <BusinessStatusBadge isActive={business.isActive} />
      </div>
    </article>
  );
}

export function BusinessCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Skeleton className="size-11 shrink-0 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-7 w-12 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-4 w-48 rounded-md" />
    </div>
  );
}
