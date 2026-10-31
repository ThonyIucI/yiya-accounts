import { Skeleton } from "@yiya/ui/components/skeleton";
import type { IProviderResource } from "@yiya/shared/providers";
import { MessageSquareText } from "lucide-react";

import InitialsAvatar from "@/common/components/initials-avatar";
import PhoneValue from "@/common/components/phone-value";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import WhatsAppButton from "@/common/components/whatsapp-button";
import { formatAccountCount } from "@/modules/providers/utils/account-count";
import ServiceAvatarStack from "@/modules/services/components/service-avatar-stack";

interface IProviderCardProps {
  provider: IProviderResource;
  actions: IRowAction[];
}

/**
 * Card de un proveedor, con el formato de la de cuentas (acordado 2026-10-30):
 * - **Cabecera** (fondo gris): sus iniciales, el nombre y debajo el badge «3 cuentas». A la
 *   derecha, WhatsApp (abre el chat) y `⋯`.
 * - **Cuerpo:** «Celular» (se copia manteniéndolo presionado) y «Servicios» (los logos de lo
 *   que vende) en dos columnas, y la nota debajo si tiene.
 */
export default function ProviderCard({ provider, actions }: IProviderCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="flex items-center justify-between gap-2 bg-muted px-3 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <InitialsAvatar name={provider.name} />
          <div className="space-x-2 min-w-0 space-y-0">
            <p className="truncate font-heading font-bold text-foreground">{provider.name}</p>
            <span className="text-primary text-xs font-semibold">{formatAccountCount(provider.accountCount)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <WhatsAppButton phone={provider.phone} />
          <RowActions actions={actions} />
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="grid grid-cols-2 gap-x-4">
          <div className="min-w-0 space-y-1">
            <p className="text-muted-foreground">Celular</p>
            <PhoneValue phone={provider.phone} />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-muted-foreground">Servicios</p>
            <ServiceAvatarStack services={provider.services} />
          </div>
        </div>

        {provider.note && (
          /* El ícono avisa que es una nota y no otro dato del proveedor. */
          <p className="flex items-start gap-2 text-muted-foreground">
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
    <div className="overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="flex items-center gap-3 bg-muted px-4 py-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 px-4 py-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
