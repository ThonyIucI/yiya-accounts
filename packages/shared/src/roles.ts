/**
 * Rol de **plataforma**, guardado en `user.role` (better-auth additionalFields).
 *
 * - `SUPERADMIN`: el dueño de la plataforma. Da de alta negocios y sus dueños.
 * - `USER`: quien entra a administrar un negocio. Qué puede hacer **dentro** del negocio
 *   (dueño / ayudante) lo decidirá su membresía al negocio, no este campo.
 */
export enum EUserRole {
  SUPERADMIN = "SUPERADMIN",
  USER = "USER",
}

export type TUserRole = `${EUserRole}`;

export const userRoleLabels: Record<TUserRole, string> = {
  [EUserRole.SUPERADMIN]: "Superadministrador",
  [EUserRole.USER]: "Usuario",
};

/** Normaliza el rol que llega del backend; cae a USER (el menos privilegiado) si no coincide. */
export const parseUserRole = (value: string | null | undefined): TUserRole => {
  const isKnownRole = Object.values(EUserRole).some((role) => role === value);
  return isKnownRole ? (value as TUserRole) : EUserRole.USER;
};
