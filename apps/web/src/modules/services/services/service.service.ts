import type { IBusinessServiceResource, ICatalogServiceResource } from "@yiya/shared/services";

import { apiRequest } from "@/lib/api";

export interface ICreateServicePayload {
  name: string;
  profilesPerAccount: number;
  /** Vacío o `null`: sin imagen. */
  imageUrl?: string | null;
}

export type TUpdateServicePayload = Partial<ICreateServicePayload>;

export interface IUpdateBusinessServicePayload {
  isActive?: boolean;
  /** `null` borra el precio (solo si el servicio no está activo). */
  purchasePrice?: number | null;
  profilePrice?: number | null;
}

/** El catálogo global, con en cuántos negocios está activo cada servicio. Solo SUPERADMIN. */
export const listCatalogRequest = (signal?: AbortSignal) =>
  apiRequest<ICatalogServiceResource[]>("/services", { signal });

export const createServiceRequest = (payload: ICreateServicePayload) =>
  apiRequest<ICatalogServiceResource>("/services", { method: "POST", body: payload });

export const updateServiceRequest = (id: string, payload: TUpdateServicePayload) =>
  apiRequest<ICatalogServiceResource>(`/services/${id}`, { method: "PATCH", body: payload });

/** El catálogo dentro del negocio en el que se está: si lo trabaja y sus dos precios. */
export const listBusinessServicesRequest = (signal?: AbortSignal) =>
  apiRequest<IBusinessServiceResource[]>("/business-services", { signal });

export const updateBusinessServiceRequest = (
  serviceId: string,
  payload: IUpdateBusinessServicePayload,
) =>
  apiRequest<IBusinessServiceResource>(`/business-services/${serviceId}`, {
    method: "PATCH",
    body: payload,
  });
