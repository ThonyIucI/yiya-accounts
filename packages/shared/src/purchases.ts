import { daysBetween } from "./dates";

/**
 * Compras de una cuenta: cada vez que se le pagó al proveedor (la primera y cada
 * renovación). Van aparte de la cuenta (acordado 2026-10-13). Ver
 * `docs/planes/03-inventario.md`, RF-15a a RF-15d.
 */

/** Cuántos meses dura una compra por defecto (RF-15c). Se puede cambiar en el formulario. */
export const DEFAULT_PURCHASE_MONTHS = 1;
/** «Por vencer» cuando faltan **menos de 3 días** (RF-14, acordado 2026-10-22): 1 o 2. */
export const EXPIRY_SOON_DAYS = 2;

export const INVALID_DATE_MESSAGE = "Elige una fecha válida.";
export const EXPIRES_BEFORE_PURCHASE_MESSAGE =
  "El vencimiento no puede ser antes de la fecha de compra.";
export const LAST_PURCHASE_MESSAGE = "La cuenta necesita al menos una compra.";

export interface IPurchaseResource {
  id: string;
  /** Lo que se pagó esa vez, en soles. */
  price: number;
  /** «2026-10-22». */
  purchasedOn: string;
  /** «2026-11-22». */
  expiresOn: string;
}

/** Vencida · vence hoy · por vencer (1 o 2 días) · al día. */
export type TExpiryStatus = "expired" | "today" | "soon" | "ok";

export interface IExpiry {
  status: TExpiryStatus;
  /** Días que faltan: 0 = vence hoy, negativo = ya venció. */
  days: number;
}

/** El vencimiento de la cuenta: el más lejano de sus compras. `null` si no tiene. */
export const accountExpiresOn = (purchases: IPurchaseResource[]): string | null =>
  purchases.reduce<string | null>(
    (latest, item) => (latest === null || item.expiresOn > latest ? item.expiresOn : latest),
    null,
  );

/** RF-14: vencida si ya pasó; hoy; por vencer si faltan `EXPIRY_SOON_DAYS` o menos. */
export const getExpiry = (expiresOn: string, today: string): IExpiry => {
  const days = daysBetween(today, expiresOn);
  if (days < 0) {
    return { status: "expired", days };
  }
  if (days === 0) {
    return { status: "today", days };
  }
  return { status: days <= EXPIRY_SOON_DAYS ? "soon" : "ok", days };
};
