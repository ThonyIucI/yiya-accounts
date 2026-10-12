import { LayoutDashboard, Users } from "lucide-react";
import type { ComponentType } from "react";

import { EUserRole, type TUserRole } from "@yiya/shared/roles";

/**
 * Las rutas se listan como literales y no como `string` porque el `to` de TanStack Router
 * está tipado: un enlace a una ruta inexistente tiene que romper el build, no la página.
 */
export type TNavPath = "/dashboard" | "/usuarios";

export interface INavItem {
  to: TNavPath;
  label: string;
  /** Etiqueta corta para la barra inferior, donde no entra la larga. */
  shortLabel: string;
  icon: ComponentType<{ className?: string }>;
}

const APP_NAV: readonly INavItem[] = [
  { to: "/dashboard", label: "Panel", shortLabel: "Panel", icon: LayoutDashboard },
];

const SUPERADMIN_NAV: readonly INavItem[] = [
  ...APP_NAV,
  { to: "/usuarios", label: "Usuarios", shortLabel: "Usuarios", icon: Users },
];

/** Los enlaces que le tocan a cada rol. Sin sesión, ninguno. */
export const navItemsForRole = (role: TUserRole | null): readonly INavItem[] => {
  if (role === EUserRole.SUPERADMIN) {
    return SUPERADMIN_NAV;
  }

  return role ? APP_NAV : [];
};
