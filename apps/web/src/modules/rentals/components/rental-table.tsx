import { Skeleton } from "@yiya/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@yiya/ui/components/table";
import type { ReactNode } from "react";

import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import RowActions, { type IRowAction } from "@/common/components/row-actions";
import ExpiryDate from "@/modules/accounts/components/expiry-date";
import type { ICustomerRentals } from "@/modules/rentals/utils/rental-groups";

import RentalDueBadge from "./rental-due-badge";
import RentalServiceStack from "./rental-service-stack";

const SKELETON_COUNT = 4;
const COLUMN_COUNT = 5;

interface IRentalTableProps {
  groups: ICustomerRentals[];
  isLoading: boolean;
  buildActions: (group: ICustomerRentals) => IRowAction[];
  onOpen: (group: ICustomerRentals) => void;
  /** El paginado, dentro de la card (como el saas). */
  footer?: ReactNode;
}

/**
 * Tabla de escritorio, una fila por cliente: Cliente · Servicios (un logo por perfil, con el
 * punto del que vence) · Vence (el más cercano) · A cobrar (el badge con el monto) ·
 * acciones. Sin «total al mes»: no se suma un perfil de 1 mes con uno de 12 (2026-11-01).
 * Oculta en celular: allí se usa `RentalMobileList`.
 */
export default function RentalTable({ groups, isLoading, buildActions, onOpen, footer }: IRentalTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-md bg-card shadow-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="w-[35%]">Cliente</TableHead>
            <TableHead>Servicios</TableHead>
            <TableHead>Vence</TableHead>
            <TableHead>A cobrar</TableHead>
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
            : groups.map((group) => (
                <TableRow key={group.customer.id} className="cursor-pointer" onClick={() => onOpen(group)}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <InitialsAvatar name={group.customer.name} color={avatarColorOf(group.customer.name)} />
                      <span className="truncate font-heading font-semibold text-foreground">
                        {group.customer.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RentalServiceStack rentals={group.rentals} />
                  </TableCell>
                  <TableCell>
                    <ExpiryDate expiresOn={group.rentals[0]?.expiresOn ?? null} />
                  </TableCell>
                  <TableCell>
                    <RentalDueBadge due={group.due} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <RowActions actions={buildActions(group)} isBordered />
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
