/**
 * Clientes finales: la agenda de cada negocio. El nombre se puede repetir; lo que no se
 * repite es su WhatsApp, el número o el usuario (acordado 2026-10-30). Ver
 * `docs/planes/04a-clientes.md`.
 */
import type { IPhone } from "./phones";

export const CUSTOMER_NAME_MIN_LENGTH = 2;
export const CUSTOMER_NAME_MAX_LENGTH = 60;
export const CUSTOMER_NOTE_MAX_LENGTH = 200;

export const CUSTOMER_NAME_LENGTH_MESSAGE = "El nombre va de 2 a 60 letras.";
export const CUSTOMER_NOTE_LENGTH_MESSAGE = "La nota va hasta 200 letras.";

export interface ICustomerResource {
  id: string;
  name: string;
  /** Su número de WhatsApp. `null` si no lo tiene. */
  phone: IPhone | null;
  /** Su usuario de WhatsApp, sin «@». `null` si no lo tiene. */
  whatsappUsername: string | null;
  note: string | null;
  createdAt: string;
}
