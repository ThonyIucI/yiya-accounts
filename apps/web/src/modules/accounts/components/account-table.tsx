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
import type { IAccountResource } from "@yiya/shared/accounts";
import { cn } from "@yiya/ui/lib/utils";
import type { ReactNode } from "react";

import RowActions from "@/common/components/row-actions";
import { freeProfiles } from "@/modules/accounts/utils/profile-occupancy";
import ServiceAvatar from "@/modules/services/components/service-avatar";

import type { IAccountListHandlers } from "./account-list-props";

const SKELETON_COUNT = 4;
const COLUMN_COUNT = 6;

interface IAccountTableProps extends IAccountListHandlers {
  accounts: IAccountResource[];
  isLoading: boolean;
  /** El paginado, dentro de la card (como el saas). */
  footer?: ReactNode;
}

/**
 * Tabla de escritorio. Oculta en celular: allí se usa `AccountMobileList`. Tocar la fila
 * abre el detalle lateral; el switch y el menú no la abren.
 */
export default function AccountTable({
  accounts,
  isLoading,
  footer,
  togglingId,
  buildActions,
  onToggleActive,
  onOpen,
}: IAccountTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-2xl bg-card shadow-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="min-w-64">Cuenta</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Perfiles</TableHead>
            <TableHead>Renueva</TableHead>
            <TableHead className="text-center">Activa</TableHead>
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
            : accounts.map((account) => (
                <TableRow
                  key={account.id}
                  className={cn("cursor-pointer", !account.isActive && "opacity-70")}
                  onClick={() => onOpen(account)}
                >
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <ServiceAvatar
                        name={account.service.name}
                        imageUrl={account.service.imageUrl}
                        className="size-10"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-heading text-base font-bold text-foreground">
                          {account.email}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{account.service.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{account.provider.name}</TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    {freeProfiles(account.profiles).length} / {account.profiles.length} libres
                  </TableCell>
                  {/* Las compras todavía no están: queda vacío, no se inventa. */}
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell>
                    <div className="flex justify-center" onClick={(event) => event.stopPropagation()}>
                      <Switch
                        checked={account.isActive}
                        disabled={togglingId === account.id}
                        aria-label={account.isActive ? "Desactivar cuenta" : "Activar cuenta"}
                        onCheckedChange={() => onToggleActive(account)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <RowActions actions={buildActions(account)} />
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
