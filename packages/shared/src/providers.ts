/**
 * Proveedores: a quién le compra cuentas el negocio. Un proveedor vende varios servicios y
 * un servicio se compra a varios proveedores; se relacionan por la cuenta, no por una lista
 * aparte. Ver `docs/planes/03-inventario.md`.
 */
import type { IPhone } from "./phones";

export const PROVIDER_NAME_MIN_LENGTH = 2;
export const PROVIDER_NAME_MAX_LENGTH = 60;
export const PROVIDER_NOTE_MAX_LENGTH = 200;

export interface IProviderResource {
  id: string;
  name: string;
  /** Su WhatsApp. `null` si no lo tiene. */
  phone: IPhone | null;
  note: string | null;
  createdAt: string;
}

/**
 * Nombre normalizado para que no haya dos proveedores iguales en un negocio: sin
 * mayúsculas, sin espacios en los bordes ni dobles («Juan Pérez » = «juan pérez»).
 */
export const toProviderNameKey = (name: string): string =>
  name.trim().replace(/\s+/g, " ").toLowerCase();
