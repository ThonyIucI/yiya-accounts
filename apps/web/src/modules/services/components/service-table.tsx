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
import type { ReactNode } from "react";

import RowActions from "@/common/components/row-actions";
import {
  type IServiceListHandlers,
  type IServiceRow,
  PRICE_LABELS,
  pluralize,
} from "@/modules/services/service-row";

import PriceField from "./price-field";
import ServiceAvatar from "./service-avatar";
import ServiceProfit from "./service-profit";

const SKELETON_COUNT = 4;

interface IServiceTableProps extends IServiceListHandlers {
  services: IServiceRow[];
  isLoading: boolean;
  /** El paginado, dentro de la card (como el saas). */
  footer?: ReactNode;
}

/** Tabla de escritorio. Oculta en celular: allí se usa `ServiceMobileList`. */
export default function ServiceTable({ services, isLoading, footer, ...handlers }: IServiceTableProps) {
  const { canManageBusiness, isSuperadmin } = handlers;
  const columnCount = 2 + (canManageBusiness ? 4 : 0) + (isSuperadmin ? 2 : 0);

  return (
    <div className="hidden overflow-hidden rounded-2xl bg-card shadow-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="min-w-48">Servicio</TableHead>
            <TableHead>Perfiles</TableHead>
            {canManageBusiness && (
              <>
                <TableHead className="w-36">{PRICE_LABELS.purchasePrice}</TableHead>
                <TableHead className="w-36">{PRICE_LABELS.profilePrice}</TableHead>
                <TableHead>Ganancia por cuenta</TableHead>
                <TableHead className="text-center">Activo</TableHead>
              </>
            )}
            {isSuperadmin && (
              <>
                <TableHead>Activo en</TableHead>
                <TableHead />
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: columnCount }, (_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-5 w-full max-w-32 rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : services.map((service) => (
                <ServiceTableRow key={service.id} service={service} {...handlers} />
              ))}
        </TableBody>
      </Table>
      {footer && <div className="border-t border-border/60 px-5 py-3">{footer}</div>}
    </div>
  );
}

interface IServiceTableRowProps extends IServiceListHandlers {
  service: IServiceRow;
}

function ServiceTableRow({
  service,
  canManageBusiness,
  isSuperadmin,
  togglingId,
  buildActions,
  onToggleActive,
  onSavePrice,
}: IServiceTableRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-0 items-center gap-3">
          <ServiceAvatar name={service.name} imageUrl={service.imageUrl} className="size-10" />
          <span className="truncate font-heading text-sm font-bold text-foreground">
            {service.name}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">{service.profilesPerAccount}</TableCell>

      {canManageBusiness && (
        <>
          {/* Los precios se editan solo con el servicio activo; se ponen al activarlo (modal). */}
          <TableCell className="align-top">
            {service.isActive && (
              <PriceField
                id={`purchase-${service.id}`}
                label={`${PRICE_LABELS.purchasePrice} de ${service.name}`}
                value={service.purchasePrice}
                isRequired
                isCompact
                onSave={(value) => onSavePrice(service, "purchasePrice", value)}
              />
            )}
          </TableCell>
          <TableCell className="align-top">
            {service.isActive && (
              <PriceField
                id={`profile-${service.id}`}
                label={`${PRICE_LABELS.profilePrice} de ${service.name}`}
                value={service.profilePrice}
                isRequired
                isCompact
                onSave={(value) => onSavePrice(service, "profilePrice", value)}
              />
            )}
          </TableCell>
          <TableCell>{service.isActive && <ServiceProfit service={service} />}</TableCell>
          <TableCell>
            <div className="flex justify-center">
              <Switch
                /* Sin `disabled` (nunca se apaga): mientras guarda, un toque más no hace nada. */
                aria-busy={togglingId === service.id}
                checked={service.isActive}
                aria-label={service.isActive ? `Desactivar ${service.name}` : `Activar ${service.name}`}
                onCheckedChange={(isActive) => onToggleActive(service, isActive)}
              />
            </div>
          </TableCell>
        </>
      )}

      {isSuperadmin && (
        <>
          <TableCell className="whitespace-nowrap text-muted-foreground">
            {pluralize(service.activeInCount ?? 0, "negocio", "negocios")}
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end">
              <RowActions actions={buildActions(service)} />
            </div>
          </TableCell>
        </>
      )}
    </TableRow>
  );
}
