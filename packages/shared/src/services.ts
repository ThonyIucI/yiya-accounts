/**
 * Servicios (Netflix, Disney+…). El catálogo es **global** y lo mantiene el superadmin;
 * cada negocio activa los que trabaja y les pone sus dos precios. Ver
 * `docs/planes/02-servicios-y-precios.md`.
 */

export const SERVICE_NAME_MIN_LENGTH = 2;
export const SERVICE_NAME_MAX_LENGTH = 40;
/** Sin tope: hay cuentas con más de 10 perfiles. */
export const SERVICE_MIN_PROFILES = 1;
export const SERVICE_IMAGE_URL_MAX_LENGTH = 500;

/** Un servicio del catálogo global. */
export interface IServiceResource {
  id: string;
  name: string;
  /** Valor por defecto para las cuentas del paso 3. */
  profilesPerAccount: number;
  /** Link `https://` a un PNG alojado afuera. Sin imagen se muestra la inicial. */
  imageUrl: string | null;
  createdAt: string;
}

/** El catálogo como lo ve el superadmin: con en cuántos negocios está activo. */
export interface ICatalogServiceResource extends IServiceResource {
  activeInCount: number;
}

/** Un servicio dentro del negocio en el que se está: si lo trabaja y sus dos precios. */
export interface IBusinessServiceResource extends IServiceResource {
  isActive: boolean;
  /** Lo que le cuesta **una cuenta** al negocio, en soles. */
  purchasePrice: number | null;
  /** A cuánto alquila **un perfil por un mes**, en soles. */
  profilePrice: number | null;
}

/**
 * Nombre normalizado para que no haya dos servicios iguales: sin mayúsculas, sin espacios
 * en los bordes ni dobles («Netflix » = «netflix»).
 */
export const toServiceNameKey = (name: string): string =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

/** Lo que deja una cuenta llena: perfiles × venta − compra. `null` si falta un precio. */
export const fullAccountProfit = (
  service: Pick<IBusinessServiceResource, "profilesPerAccount" | "purchasePrice" | "profilePrice">,
): { revenue: number; profit: number } | null => {
  if (service.purchasePrice === null || service.profilePrice === null) {
    return null;
  }
  const revenue = service.profilesPerAccount * service.profilePrice;
  return { revenue, profit: revenue - service.purchasePrice };
};
