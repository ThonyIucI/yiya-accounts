import type { IBusinessResource, ICurrentBusiness } from "@yiya/shared/businesses";

import { apiRequest } from "@/lib/api";

export interface ICreateBusinessPayload {
  name: string;
  ownerId: string;
}

export interface IUpdateBusinessPayload {
  name?: string;
  isActive?: boolean;
}

/** Todos los negocios con su dueño. Solo SUPERADMIN. */
export const listBusinessesRequest = (signal?: AbortSignal) =>
  apiRequest<IBusinessResource[]>("/businesses", { signal });

export const createBusinessRequest = (payload: ICreateBusinessPayload) =>
  apiRequest<IBusinessResource>("/businesses", { method: "POST", body: payload });

export const updateBusinessRequest = (id: string, payload: IUpdateBusinessPayload) =>
  apiRequest<IBusinessResource>(`/businesses/${id}`, { method: "PATCH", body: payload });

/** El negocio en el que se está trabajando: el del dueño, o el que eligió el superadmin. */
export const getMyBusinessRequest = (signal?: AbortSignal) =>
  apiRequest<ICurrentBusiness>("/my-business", { signal });

/** El superadmin cambia de negocio. Queda guardado en el server. */
export const chooseActiveBusinessRequest = (businessId: string) =>
  apiRequest<ICurrentBusiness>("/me/active-business", { method: "PUT", body: { businessId } });
