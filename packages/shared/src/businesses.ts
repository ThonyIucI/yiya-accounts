/**
 * Rol **dentro de un negocio**, guardado en la membresía (no en `user.role`).
 *
 * - `OWNER`: el dueño. Ve y administra todo lo de su negocio.
 * - `HELPER`: ayudante. Todavía no se usa: cuando el cliente tenga equipo se definirá qué
 *   puede hacer.
 */
export enum EBusinessRole {
  OWNER = "OWNER",
  HELPER = "HELPER",
}

export type TBusinessRole = `${EBusinessRole}`;

export const businessRoleLabels: Record<TBusinessRole, string> = {
  [EBusinessRole.OWNER]: "Dueño",
  [EBusinessRole.HELPER]: "Ayudante",
};

export interface IBusinessOwner {
  id: string;
  name: string;
  email: string;
}

/** Un negocio tal como lo ve el superadmin en su listado. */
export interface IBusinessResource {
  id: string;
  name: string;
  isActive: boolean;
  /** `null` solo si al dueño se lo borró; al crear un negocio siempre se asigna uno. */
  owner: IBusinessOwner | null;
  createdAt: string;
}

/** El negocio de quien tiene la sesión, con su rol en él. */
export interface ICurrentBusiness {
  id: string;
  name: string;
  role: TBusinessRole;
}

export const BUSINESS_NAME_MIN_LENGTH = 2;
export const BUSINESS_NAME_MAX_LENGTH = 80;
