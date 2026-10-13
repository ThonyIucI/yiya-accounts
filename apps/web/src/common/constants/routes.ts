import { LayoutDashboard, Store, Truck, Tv, Users } from "lucide-react";
import type { ComponentType } from "react";

import { EUserRole, type TUserRole } from "@yiya/shared/roles";

/**
 * Las rutas se listan como literales y no como `string` porque el `to` de TanStack Router
 * está tipado: un enlace a una ruta inexistente tiene que romper el build, no la página.
 */
export type TNavPath = "/dashboard" | "/servicios" | "/proveedores" | "/negocios" | "/usuarios";

export interface INavItem {
  to: TNavPath;
  label: string;
  /** Etiqueta corta para la barra inferior, donde no entra la larga. */
  shortLabel: string;
  icon: ComponentType<{ className?: string }>;
}

const APP_NAV: readonly INavItem[] = [
  { to: "/dashboard", label: "Panel", shortLabel: "Panel", icon: LayoutDashboard },
  { to: "/servicios", label: "Servicios", shortLabel: "Servicios", icon: Tv },
  { to: "/proveedores", label: "Proveedores", shortLabel: "Proveedores", icon: Truck },
];

/* Negocios y Usuarios no son del día a día: no van en la barra inferior (ver abajo). */
const SUPERADMIN_NAV: readonly INavItem[] = [
  ...APP_NAV,
  { to: "/negocios", label: "Negocios", shortLabel: "Negocios", icon: Store },
  { to: "/usuarios", label: "Usuarios", shortLabel: "Usuarios", icon: Users },
];

/** Los enlaces que le tocan a cada rol. Sin sesión, ninguno. */
export const navItemsForRole = (role: TUserRole | null): readonly INavItem[] => {
  if (role === EUserRole.SUPERADMIN) {
    return SUPERADMIN_NAV;
  }

  return role ? APP_NAV : [];
};

/**
 * Los de la barra inferior (acceso rápido): los módulos del negocio, iguales para todos.
 * Negocios y Usuarios del superadmin quedan solo en su menú lateral: con seis botones la
 * barra no entra en un celular (acordado 2026-10-13).
 */
export const quickAccessItemsForRole = (role: TUserRole | null): readonly INavItem[] =>
  role ? APP_NAV : [];
