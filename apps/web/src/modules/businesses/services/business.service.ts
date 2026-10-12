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

/** El negocio de quien tiene la sesión. */
export const getMyBusinessRequest = (signal?: AbortSignal) =>
  apiRequest<ICurrentBusiness>("/my-business", { signal });
