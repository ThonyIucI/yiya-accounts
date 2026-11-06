/**
 * Alquileres: cada uno es **un perfil para un cliente**, con su precio, lo pagado y sus
 * fechas. El cliente es la orden y cada perfil un producto (acordado 2026-10-31). Ver
 * `docs/planes/04b-alquileres.md`.
 */
import type { IServiceSummary } from "./services";

/** Cuántos perfiles se alquilan de una vez, como tope de cordura (y de parámetros en D1). */
export const RENTAL_MAX_ITEMS = 20;

export const RENTAL_NO_ITEMS_MESSAGE = "Agrega al menos un perfil.";
export const RENTAL_EXPIRES_BEFORE_START_MESSAGE =
  "El vencimiento no puede ser antes del inicio.";
export const RENTAL_PAID_OVER_PRICE_MESSAGE = "Lo pagado no puede ser más que el precio.";
export const RENTAL_ALREADY_RENEWED_MESSAGE = "Este alquiler ya se renovó.";
export const RENTAL_ALREADY_RELEASED_MESSAGE = "Este alquiler ya se liberó.";
export const RENTAL_RENEW_STARTS_TOO_SOON_MESSAGE =
  "La renovación no puede empezar antes del vencimiento actual. Para otras fechas, edita el alquiler.";
export const RENTAL_RENEW_ENDS_TOO_SOON_MESSAGE = "La renovación tiene que terminar después de su inicio.";
export const RENTAL_INVALID_PAID_MESSAGE =
  "Escribe lo pagado en soles, con hasta 2 decimales (por ejemplo, 7.50).";

/** Lo justo del cliente para el listado; el resto se pide a `/customers`. */
export interface IRentalCustomer {
  id: string;
  name: string;
}

export interface IRentalProfile {
  id: string;
  name: string;
  pin: string | null;
  position: number;
}

export interface IRentalResource {
  id: string;
  customer: IRentalCustomer;
  service: IServiceSummary;
  /** La cuenta del perfil: su correo, nunca la contraseña. */
  account: { id: string; email: string };
  profile: IRentalProfile;
  /** Lo acordado, con el descuento, en soles. */
  price: number;
  /** Lo pagado hasta hoy (RF-07b). Menos que el precio = por cobrar. */
  paidAmount: number;
  /** El día del último pago. `null` si no pagó nada. */
  paidOn: string | null;
  /** El día en que se comprometió a pagar, solo si debe y lo dio (RF-07c). */
  payBy: string | null;
  /** «2026-11-04». */
  startsOn: string;
  expiresOn: string;
  createdAt: string;
}

/**
 * Un alquiler del cliente, abierto o ya historial (RF-18): renovado (`renewedById`) o
 * liberado (`releasedOn`). Lo devuelve `GET /customers/:id/rentals`.
 */
export interface IRentalHistoryResource extends IRentalResource {
  /** El día en que se liberó; `null` si no se liberó. */
  releasedOn: string | null;
  /** El alquiler que lo renovó; `null` si no se renovó. */
  renewedById: string | null;
}

/** Lo que falta pagar. 0 si está pagado. */
export const rentalDebt = (rental: Pick<IRentalResource, "price" | "paidAmount">): number =>
  Math.max(0, Math.round((rental.price - rental.paidAmount) * 100) / 100);
