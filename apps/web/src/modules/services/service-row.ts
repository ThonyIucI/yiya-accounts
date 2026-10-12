import type { IBusinessServiceResource } from "@yiya/shared/services";

import type { IRowAction } from "@/common/components/row-actions";

/**
 * Una fila de la pantalla Servicios: el servicio con lo que tiene el negocio actual y, para
 * el superadmin, en cuántos negocios está activo.
 */
export interface IServiceRow extends IBusinessServiceResource {
  activeInCount?: number;
}

export type TPriceField = "purchasePrice" | "profilePrice";

/** Lo que la tabla y las cards necesitan de la página. */
export interface IServiceListHandlers {
  /** Hay un negocio en el que trabajar: se ven el switch y los precios. */
  canManageBusiness: boolean;
  /** Superadmin: ve «Activo en N negocios» y el menú con «Editar». */
  isSuperadmin: boolean;
  togglingId: string | null;
  buildActions: (service: IServiceRow) => IRowAction[];
  onToggleActive: (service: IServiceRow, isActive: boolean) => void;
  onSavePrice: (service: IServiceRow, field: TPriceField, value: number | null) => Promise<boolean>;
}

export const PRICE_LABELS: Record<TPriceField, string> = {
  purchasePrice: "Compra (cuenta)",
  profilePrice: "Venta (perfil/mes)",
};

export const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;
