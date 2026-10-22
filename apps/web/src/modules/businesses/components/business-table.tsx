import { Skeleton } from "@yiya/ui/components/skeleton";
import { Switch } from "@yiya/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@yiya/ui/components/table";
import type { IBusinessResource } from "@yiya/shared/businesses";
import { cn } from "@yiya/ui/lib/utils";
import { Store } from "lucide-react";

import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { formatShortDate } from "@/common/utils/format-date";

import BusinessStatusBadge from "./business-status-badge";

const SKELETON_COUNT = 4;

interface IBusinessTableProps {
  businesses: IBusinessResource[];
  isLoading: boolean;
  buildActions: (business: IBusinessResource) => IRowAction[];
  togglingId: string | null;
  onToggleActive: (business: IBusinessResource) => void;
}

/** Tabla de escritorio. Oculta en celular: allí se usa `BusinessMobileList`. */
export default function BusinessTable({
  businesses,
  isLoading,
  buildActions,
  togglingId,
  onToggleActive,
}: IBusinessTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-2xl bg-card shadow-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="w-[34%]">Negocio</TableHead>
            <TableHead className="w-[30%]">Dueño</TableHead>
            <TableHead>Desde</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-xl" />
                      <Skeleton className="h-5 w-36 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="mx-auto h-7 w-12 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto size-9 rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            : businesses.map((business) => (
                <TableRow key={business.id} className={cn(!business.isActive && "opacity-70")}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Store className="size-5" />
                      </span>
                      <span className="truncate font-heading text-sm font-bold text-foreground">
                        {business.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="truncate font-semibold text-foreground">
                      {business.owner?.name ?? "Sin dueño"}
                    </p>
                    {business.owner && (
                      <p className="truncate text-sm text-muted-foreground">{business.owner.email}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatShortDate(business.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        /* Sin `disabled` (nunca se apaga): mientras guarda, un toque más no hace nada. */
                        aria-busy={togglingId === business.id}
                        checked={business.isActive}
                        aria-label={business.isActive ? "Desactivar negocio" : "Activar negocio"}
                        onCheckedChange={() => onToggleActive(business)}
                      />
                      <BusinessStatusBadge isActive={business.isActive} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <RowActions actions={buildActions(business)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
