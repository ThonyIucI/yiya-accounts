import {
  KeyRound,
  LayoutDashboard,
  ShoppingCart,
  Store,
  Truck,
  Tv,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

import { EUserRole, type TUserRole } from "@yiya/shared/roles";

/**
 * Las rutas se listan como literales y no como `string` porque el `to` de TanStack Router
 * está tipado: un enlace a una ruta inexistente tiene que romper el build, no la página.
 */
export type TNavPath =
  | "/dashboard"
  | "/cuentas"
  | "/servicios"
  | "/proveedores"
  | "/negocios"
  | "/usuarios";

export interface INavItem {
  to: TNavPath;
  label: string;
  /** Etiqueta corta para la barra inferior, donde no entra la larga. */
  shortLabel: string;
  icon: ComponentType<{ className?: string }>;
}

/** Un grupo del menú lateral, con sus módulos como submenú (p. ej. Compras). */
export interface INavGroup {
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: readonly INavItem[];
}

export type TSidebarEntry = INavItem | INavGroup;

export const isNavGroup = (entry: TSidebarEntry): entry is INavGroup => "items" in entry;

const DASHBOARD: INavItem = {
  to: "/dashboard",
  label: "Panel",
  shortLabel: "Panel",
  icon: LayoutDashboard,
};
const ACCOUNTS: INavItem = { to: "/cuentas", label: "Cuentas", shortLabel: "Cuentas", icon: KeyRound };
const SERVICES: INavItem = { to: "/servicios", label: "Servicios", shortLabel: "Servicios", icon: Tv };
const PROVIDERS: INavItem = {
  to: "/proveedores",
  label: "Proveedores",
  shortLabel: "Proveedores",
  icon: Truck,
};
const BUSINESSES: INavItem = {
  to: "/negocios",
  label: "Negocios",
  shortLabel: "Negocios",
  icon: Store,
};
const USERS: INavItem = { to: "/usuarios", label: "Usuarios", shortLabel: "Usuarios", icon: Users };

const APP_NAV: readonly INavItem[] = [DASHBOARD, ACCOUNTS, SERVICES, PROVIDERS];

/* Negocios y Usuarios no son del día a día: no van en la barra inferior (ver abajo). */
const SUPERADMIN_NAV: readonly INavItem[] = [...APP_NAV, BUSINESSES, USERS];

/**
 * El menú lateral, con submenús (acordado 2026-10-13): lo que tiene que ver con comprarle
 * cuentas al proveedor va dentro de **Compras**. La barra inferior sigue plana.
 */
const SUPERADMIN_SIDEBAR: readonly TSidebarEntry[] = [
  DASHBOARD,
  SERVICES,
  { label: "Compras", icon: ShoppingCart, items: [PROVIDERS, ACCOUNTS] },
  BUSINESSES,
  USERS,
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

/** El menú lateral, con grupos. Por ahora solo lo tiene el superadmin. */
export const sidebarEntriesForRole = (role: TUserRole | null): readonly TSidebarEntry[] =>
  role === EUserRole.SUPERADMIN ? SUPERADMIN_SIDEBAR : [];
