import { Skeleton } from "@yiya/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@yiya/ui/components/table";
import type { ICustomerResource } from "@yiya/shared/customers";
import type { ReactNode } from "react";

import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import WhatsAppButton from "@/common/components/whatsapp-button";

import CustomerWhatsAppValue from "./customer-whatsapp-value";

const SKELETON_COUNT = 4;
const COLUMN_COUNT = 3;

interface ICustomerTableProps {
  customers: ICustomerResource[];
  isLoading: boolean;
  buildActions: (customer: ICustomerResource) => IRowAction[];
  onOpen: (customer: ICustomerResource) => void;
  /** El paginado, dentro de la card (como el saas). */
  footer?: ReactNode;
}

/**
 * Tabla de escritorio. Oculta en celular: allí se usa `CustomerMobileList`. Cliente ·
 * WhatsApp · acciones con borde; desde el 4b suma Servicios y Alquileres. Sin nota. Tocar
 * la fila abre el detalle; copiar, WhatsApp y `⋯` no.
 */
export default function CustomerTable({
  customers,
  isLoading,
  buildActions,
  onOpen,
  footer,
}: ICustomerTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-md bg-card shadow-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="w-[40%]">Cliente</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: COLUMN_COUNT }, (_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-5 w-full max-w-32 rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="cursor-pointer"
                  onClick={() => onOpen(customer)}
                >
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <InitialsAvatar name={customer.name} color={avatarColorOf(customer.name)} />
                      <span className="truncate font-heading font-semibold text-foreground">
                        {customer.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CustomerWhatsAppValue customer={customer} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <WhatsAppButton
                        phone={customer.phone}
                        username={customer.whatsappUsername}
                        isBordered
                      />
                      <RowActions actions={buildActions(customer)} isBordered />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
      {footer && <div className="border-t border-border/60 px-5 py-3">{footer}</div>}
    </div>
  );
}
