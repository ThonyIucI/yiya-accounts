import type { IAccountResource, IProfileResource } from "@yiya/shared/accounts";

import { apiRequest } from "@/lib/api";

/** Una compra con el proveedor: la primera de la cuenta, una renovación o una corrección. */
export interface IPurchasePayload {
  price: number;
  /** «2026-10-22». */
  purchasedOn: string;
  expiresOn: string;
}

export interface ICreateAccountPayload {
  serviceId: string;
  providerId: string;
  email: string;
  password: string;
  profileCount: number;
  note: string | null;
  /** No hay cuenta sin compra (RF-08). */
  purchase: IPurchasePayload;
}

/** El servicio no se cambia: los perfiles dependen de él. */
export interface IUpdateAccountPayload {
  providerId?: string;
  email?: string;
  /** Solo si se cambió: sin esto la contraseña queda igual. */
  password?: string;
  note?: string | null;
  isActive?: boolean;
}

export interface IUpdateProfilePayload {
  name?: string;
  /** `null` o vacío quita el PIN. */
  pin?: string | null;
}

/** Las cuentas del negocio con sus perfiles. Sin contraseñas. */
export const listAccountsRequest = (signal?: AbortSignal) =>
  apiRequest<IAccountResource[]>("/accounts", { signal });

export const createAccountRequest = (payload: ICreateAccountPayload) =>
  apiRequest<IAccountResource>("/accounts", { method: "POST", body: payload });

export const updateAccountRequest = (id: string, payload: IUpdateAccountPayload) =>
  apiRequest<IAccountResource>(`/accounts/${id}`, { method: "PATCH", body: payload });

export const deleteAccountRequest = (id: string) =>
  apiRequest<{ id: string }>(`/accounts/${id}`, { method: "DELETE" });

/** La contraseña en claro: solo la piden el ojo y copiar del detalle. */
export const getAccountPasswordRequest = (id: string) =>
  apiRequest<{ password: string }>(`/accounts/${id}/password`);

/** Agrega «Perfil N+1» y devuelve la cuenta con sus perfiles. */
export const addProfileRequest = (accountId: string) =>
  apiRequest<IAccountResource>(`/accounts/${accountId}/profiles`, { method: "POST" });

export const updateProfileRequest = (id: string, payload: IUpdateProfilePayload) =>
  apiRequest<IProfileResource>(`/profiles/${id}`, { method: "PATCH", body: payload });

export const deleteProfileRequest = (id: string) =>
  apiRequest<{ id: string }>(`/profiles/${id}`, { method: "DELETE" });

/** Renovar (o la primera compra de una cuenta anterior a las compras). Devuelve la cuenta. */
export const createPurchaseRequest = (accountId: string, payload: IPurchasePayload) =>
  apiRequest<IAccountResource>(`/accounts/${accountId}/purchases`, { method: "POST", body: payload });

/** Corrige una compra. Devuelve la cuenta, con el vencimiento al día. */
export const updatePurchaseRequest = (id: string, payload: IPurchasePayload) =>
  apiRequest<IAccountResource>(`/purchases/${id}`, { method: "PATCH", body: payload });

export const deletePurchaseRequest = (id: string) =>
  apiRequest<IAccountResource>(`/purchases/${id}`, { method: "DELETE" });
