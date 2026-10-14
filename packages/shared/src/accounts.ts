/**
 * Cuentas de streaming y sus perfiles. La cuenta es el **acceso** (correo y contraseña);
 * cada perfil es la unidad que se alquila (nombre y PIN). Las compras y renovaciones van
 * aparte y todavía no están. Ver `docs/planes/03-inventario.md`.
 */

export const ACCOUNT_EMAIL_MAX_LENGTH = 254;
export const ACCOUNT_PASSWORD_MAX_LENGTH = 200;
export const ACCOUNT_NOTE_MAX_LENGTH = 300;
export const ACCOUNT_MIN_PROFILES = 1;
/** Tope de cordura al crear (no de negocio: el servicio no tiene tope de perfiles). */
export const ACCOUNT_MAX_PROFILES = 50;

export const PROFILE_NAME_MAX_LENGTH = 30;
/** El PIN de un perfil: 4 dígitos (acordado 2026-10-13). */
export const PROFILE_PIN_PATTERN = /^\d{4}$/;
export const PROFILE_PIN_MESSAGE = "El PIN son 4 números.";

export interface IProfileResource {
  id: string;
  name: string;
  /** 4 dígitos, o `null` si el perfil no tiene PIN. */
  pin: string | null;
  position: number;
}

/** Lo que trae el listado. **Nunca** la contraseña. */
export interface IAccountResource {
  id: string;
  service: { id: string; name: string; imageUrl: string | null };
  provider: { id: string; name: string };
  email: string;
  isActive: boolean;
  note: string | null;
  profiles: IProfileResource[];
  createdAt: string;
}

/** Correo normalizado para no registrar dos veces la misma cuenta de un servicio. */
export const toAccountEmailKey = (email: string): string => email.trim().toLowerCase();

/** El nombre que se le pone al perfil N al crearlo: «Perfil 1», «Perfil 2»… */
export const defaultProfileName = (position: number): string => `Perfil ${position}`;
