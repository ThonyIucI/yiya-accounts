import { Skeleton } from "@yiya/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@yiya/ui/components/table";
import type { IProviderResource } from "@yiya/shared/providers";
import type { ReactNode } from "react";

import InitialsAvatar from "@/common/components/initials-avatar";
import PhoneValue from "@/common/components/phone-value";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import WhatsAppButton from "@/common/components/whatsapp-button";
import ServiceAvatarStack from "@/modules/services/components/service-avatar-stack";

const SKELETON_COUNT = 4;
const COLUMN_COUNT = 6;

interface IProviderTableProps {
  providers: IProviderResource[];
  isLoading: boolean;
  buildActions: (provider: IProviderResource) => IRowAction[];
  /** El paginado, dentro de la card (como el saas). */
  footer?: ReactNode;
}

/**
 * Tabla de escritorio. Oculta en celular: allí se usa `ProviderMobileList`. Las acciones van
 * con borde: WhatsApp y `⋯`, como enviar y `⋯` en cuentas (acordado 2026-10-30).
 */
export default function ProviderTable({ providers, isLoading, buildActions, footer }: IProviderTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-md bg-card shadow-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="w-[28%]">Proveedor</TableHead>
            <TableHead>Celular</TableHead>
            <TableHead>Servicios</TableHead>
            <TableHead>Cuentas</TableHead>
            <TableHead>Nota</TableHead>
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
            : providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <InitialsAvatar name={provider.name} />
                      <span className="truncate font-heading font-bold text-foreground">
                        {provider.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PhoneValue phone={provider.phone} />
                  </TableCell>
                  <TableCell>
                    <ServiceAvatarStack services={provider.services} />
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">{provider.accountCount}</TableCell>
                  <TableCell className="max-w-72">
                    <p className="truncate text-muted-foreground" title={provider.note ?? undefined}>
                      {provider.note ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <WhatsAppButton phone={provider.phone} isBordered />
                      <RowActions actions={buildActions(provider)} isBordered />
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
