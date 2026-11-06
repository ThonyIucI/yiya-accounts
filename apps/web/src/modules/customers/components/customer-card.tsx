import { Skeleton } from "@yiya/ui/components/skeleton";
import type { ICustomerResource } from "@yiya/shared/customers";

import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import WhatsAppButton from "@/common/components/whatsapp-button";
import { formatMonthYear } from "@/common/utils/format-date";

import CustomerWhatsAppValue from "./customer-whatsapp-value";

interface ICustomerCardProps {
  customer: ICustomerResource;
  actions: IRowAction[];
  onOpen: () => void;
}

/**
 * Card de un cliente, con el formato de la de proveedores (acordado 2026-10-30):
 * - **Cabecera** (fondo gris): sus iniciales en su color, el nombre y debajo «Cliente desde
 *   oct 2026». A la derecha, WhatsApp (abre el chat) y `⋯`.
 * - **Cuerpo:** «WhatsApp», el número o el usuario. Desde el 4b, «Servicios» al lado.
 * - **Sin nota:** se ve solo en el detalle.
 *
 * La cabecera abre el detalle, como en cuentas: el cuerpo no, porque ahí se mantiene
 * presionado el número para copiarlo.
 */
export default function CustomerCard({ customer, actions, onOpen }: ICustomerCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="flex items-center justify-between gap-2 bg-muted px-3 py-3">
        {/* Toda la cabecera abre el detalle; WhatsApp y `⋯` no. */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`Ver a ${customer.name}`}
          onClick={onOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpen();
            }
          }}
          className="-m-1 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl p-1"
        >
          <InitialsAvatar name={customer.name} color={avatarColorOf(customer.name)} />
          <div className="min-w-0">
            <p className="truncate font-heading font-semibold text-foreground">{customer.name}</p>
            <p className="text-muted-foreground">Cliente desde {formatMonthYear(customer.createdAt)}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <WhatsAppButton phone={customer.phone} username={customer.whatsappUsername} />
          <RowActions actions={actions} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 px-4 py-3">
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground">WhatsApp</p>
          <CustomerWhatsAppValue customer={customer} />
        </div>
      </div>
    </article>
  );
}

export function CustomerCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="flex items-center gap-3 bg-muted px-4 py-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
      </div>
      <div className="px-4 py-3">
        <Skeleton className="h-10 w-1/2 rounded-lg" />
      </div>
    </div>
  );
}
