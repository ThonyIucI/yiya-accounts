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
import { Truck } from "lucide-react";
import type { ReactNode } from "react";

import RowActions, { type IRowAction } from "@/common/components/row-actions";

import ProviderPhone from "./provider-phone";

const SKELETON_COUNT = 4;
const COLUMN_COUNT = 5;

interface IProviderTableProps {
  providers: IProviderResource[];
  isLoading: boolean;
  buildActions: (provider: IProviderResource) => IRowAction[];
  /** El paginado, dentro de la card (como el saas). */
  footer?: ReactNode;
}

/** Tabla de escritorio. Oculta en celular: allí se usa `ProviderMobileList`. */
export default function ProviderTable({ providers, isLoading, buildActions, footer }: IProviderTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-2xl bg-card shadow-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="w-[32%]">Proveedor</TableHead>
            <TableHead className="w-[28%]">WhatsApp</TableHead>
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
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Truck className="size-5" />
                      </span>
                      <span className="truncate font-heading text-sm font-bold text-foreground">
                        {provider.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProviderPhone phone={provider.phone} />
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">{provider.accountCount}</TableCell>
                  <TableCell className="max-w-72">
                    <p className="truncate text-muted-foreground" title={provider.note ?? undefined}>
                      {provider.note ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <RowActions actions={buildActions(provider)} />
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
