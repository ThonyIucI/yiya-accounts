import { Skeleton } from "@yiya/ui/components/skeleton";
import type { IProviderResource } from "@yiya/shared/providers";
import { MessageSquareText, Truck } from "lucide-react";

import RowActions, { type IRowAction } from "@/common/components/row-actions";

import ProviderPhone from "./provider-phone";

interface IProviderCardProps {
  provider: IProviderResource;
  actions: IRowAction[];
}

/**
 * Card de listado (equivalente mobile de la fila): identidad arriba a la izquierda, menú
 * arriba a la derecha, el WhatsApp y la nota abajo.
 */
export default function ProviderCard({ provider, actions }: IProviderCardProps) {
  return (
    <article className="rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Truck className="size-5" />
          </span>
          <p className="min-w-0 truncate font-heading text-base font-bold text-foreground">
            {provider.name}
          </p>
        </div>
        <RowActions actions={actions} />
      </div>

      <div className="mt-3 space-y-1 border-t border-border/60 pt-1 text-sm">
        <ProviderPhone phone={provider.phone} />
        <p className="text-sm font-semibold text-muted-foreground">
          {provider.accountCount === 1 ? "1 cuenta" : `${provider.accountCount} cuentas`}
        </p>
        {provider.note && (
          /* El ícono avisa que es una nota y no otro dato del proveedor. */
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MessageSquareText aria-hidden className="mt-px size-4 shrink-0" />
            <span className="line-clamp-2">{provider.note}</span>
          </p>
        )}
      </div>
    </article>
  );
}

export function ProviderCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 shrink-0 rounded-xl" />
        <Skeleton className="h-5 w-36 rounded-md" />
      </div>
      <Skeleton className="mt-4 h-4 w-44 rounded-md" />
    </div>
  );
}
