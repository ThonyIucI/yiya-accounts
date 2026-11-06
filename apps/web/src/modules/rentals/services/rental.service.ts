import type { IRentalHistoryResource, IRentalResource } from "@yiya/shared/rentals";

import { apiRequest } from "@/lib/api";

/** Un perfil para el cliente, como lo manda el formulario. */
export interface IRentalItemPayload {
  profileId: string;
  price: number;
  paidAmount: number;
  payBy: string | null;
  startsOn: string;
  expiresOn: string;
}

export interface ICreateRentalsPayload {
  customerId: string;
  items: IRentalItemPayload[];
}

export type TUpdateRentalPayload = Partial<IRentalItemPayload>;

/** Los alquileres abiertos del negocio, lo que vence primero arriba. */
export const listRentalsRequest = (signal?: AbortSignal) =>
  apiRequest<IRentalResource[]>("/rentals", { signal });

/** Uno o varios perfiles para un cliente, de una vez. */
export const createRentalsRequest = (payload: ICreateRentalsPayload) =>
  apiRequest<IRentalResource[]>("/rentals", { method: "POST", body: payload });

export const updateRentalRequest = (id: string, payload: TUpdateRentalPayload) =>
  apiRequest<IRentalResource>(`/rentals/${id}`, { method: "PATCH", body: payload });

export const deleteRentalRequest = (id: string) =>
  apiRequest<{ id: string }>(`/rentals/${id}`, { method: "DELETE" });

/** Desde cuándo, hasta cuándo y por cuánto (RF-11). */
export interface IRenewRentalPayload {
  price: number;
  /** Lo que pagó; si no llega, el servidor lo da por pagado completo. */
  paidAmount: number;
  /** Cuándo paga lo que falta; solo si debe. */
  payBy: string | null;
  /** Desde el vencimiento anterior en adelante (si volvió después de unos días). */
  startsOn: string;
  expiresOn: string;
}

/** Crea el alquiler que sigue y marca este como renovado. Devuelve el nuevo. */
export const renewRentalRequest = (id: string, payload: IRenewRentalPayload) =>
  apiRequest<IRentalResource>(`/rentals/${id}/renew`, { method: "POST", body: payload });

/** Libera hoy (RF-10): pasa al historial y sale de la lista. */
export const releaseRentalRequest = (id: string) =>
  apiRequest<{ id: string }>(`/rentals/${id}/release`, { method: "POST" });

/** Todos los alquileres del cliente, abiertos e historial, lo más nuevo arriba (RF-18). */
export const listCustomerRentalsRequest = (customerId: string, signal?: AbortSignal) =>
  apiRequest<IRentalHistoryResource[]>(`/customers/${customerId}/rentals`, { signal });
