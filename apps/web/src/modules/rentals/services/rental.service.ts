import type { IRentalResource } from "@yiya/shared/rentals";

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
