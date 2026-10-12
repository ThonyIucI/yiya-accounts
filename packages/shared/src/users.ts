import type { TUserRole } from "./roles";

/** Usuario tal como lo devuelve la API. Nunca incluye la contraseña. */
export interface IUserResource {
  id: string;
  name: string;
  email: string;
  role: TUserRole;
  createdAt: string;
}

export const USER_MIN_PASSWORD_LENGTH = 8;
