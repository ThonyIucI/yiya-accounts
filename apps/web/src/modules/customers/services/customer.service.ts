import type { ICustomerResource } from "@yiya/shared/customers";
import type { IPhone } from "@yiya/shared/phones";

import { apiRequest } from "@/lib/api";

export interface ICreateCustomerPayload {
  name: string;
  phone: IPhone | null;
  whatsappUsername: string | null;
  note: string | null;
}

export type TUpdateCustomerPayload = Partial<ICreateCustomerPayload>;

/** Los clientes del negocio en el que se está. */
export const listCustomersRequest = (signal?: AbortSignal) =>
  apiRequest<ICustomerResource[]>("/customers", { signal });

export const createCustomerRequest = (payload: ICreateCustomerPayload) =>
  apiRequest<ICustomerResource>("/customers", { method: "POST", body: payload });

export const updateCustomerRequest = (id: string, payload: TUpdateCustomerPayload) =>
  apiRequest<ICustomerResource>(`/customers/${id}`, { method: "PATCH", body: payload });

export const deleteCustomerRequest = (id: string) =>
  apiRequest<{ id: string }>(`/customers/${id}`, { method: "DELETE" });
