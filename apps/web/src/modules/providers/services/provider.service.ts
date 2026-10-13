import type { IPhone } from "@yiya/shared/phones";
import type { IProviderResource } from "@yiya/shared/providers";

import { apiRequest } from "@/lib/api";

export interface ICreateProviderPayload {
  name: string;
  phone: IPhone | null;
  note: string | null;
}

export type TUpdateProviderPayload = Partial<ICreateProviderPayload>;

/** Los proveedores del negocio en el que se está. */
export const listProvidersRequest = (signal?: AbortSignal) =>
  apiRequest<IProviderResource[]>("/providers", { signal });

export const createProviderRequest = (payload: ICreateProviderPayload) =>
  apiRequest<IProviderResource>("/providers", { method: "POST", body: payload });

export const updateProviderRequest = (id: string, payload: TUpdateProviderPayload) =>
  apiRequest<IProviderResource>(`/providers/${id}`, { method: "PATCH", body: payload });

export const deleteProviderRequest = (id: string) =>
  apiRequest<{ id: string }>(`/providers/${id}`, { method: "DELETE" });
