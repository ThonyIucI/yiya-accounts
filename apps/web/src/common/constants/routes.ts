import {
  CalendarClock,
  Contact,
  HandCoins,
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
  | "/alquileres"
  | "/clientes"
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
const RENTALS: INavItem = {
  to: "/alquileres",
  label: "Alquileres",
  shortLabel: "Alquileres",
  icon: CalendarClock,
};
const CUSTOMERS: INavItem = { to: "/clientes", label: "Clientes", shortLabel: "Clientes", icon: Contact };
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

/* Todos los módulos del negocio: el menú del usuario y los enlaces del encabezado. */
const APP_NAV: readonly INavItem[] = [DASHBOARD, RENTALS, CUSTOMERS, ACCOUNTS, PROVIDERS, SERVICES];

const SUPERADMIN_NAV: readonly INavItem[] = [...APP_NAV, BUSINESSES, USERS];

/**
 * La barra inferior: solo lo más usado (acordado 2026-10-30). Desde el 4b, Alquileres en
 * lugar de Clientes (acordado 2026-11-01): Clientes, Proveedores y Servicios se abren desde
 * el menú lateral.
 */
const QUICK_ACCESS: readonly INavItem[] = [DASHBOARD, RENTALS, ACCOUNTS];

/**
 * El menú lateral, con submenús (acordado 2026-10-13): lo que se le vende al cliente va
 * dentro de **Ventas** y lo que se le compra al proveedor, dentro de **Compras**. El dueño lo
 * tiene desde el 4a (acordado 2026-10-31), sin Negocios ni Usuarios.
 */
const OWNER_SIDEBAR: readonly TSidebarEntry[] = [
  DASHBOARD,
  { label: "Ventas", icon: HandCoins, items: [RENTALS, CUSTOMERS] },
  { label: "Compras", icon: ShoppingCart, items: [PROVIDERS, ACCOUNTS] },
  SERVICES,
];

const SUPERADMIN_SIDEBAR: readonly TSidebarEntry[] = [...OWNER_SIDEBAR, BUSINESSES, USERS];

/** Los enlaces que le tocan a cada rol. Sin sesión, ninguno. */
export const navItemsForRole = (role: TUserRole | null): readonly INavItem[] => {
  if (role === EUserRole.SUPERADMIN) {
    return SUPERADMIN_NAV;
  }

  return role ? APP_NAV : [];
};

/** Los de la barra inferior (acceso rápido), iguales para todos. Sin sesión, ninguno. */
export const quickAccessItemsForRole = (role: TUserRole | null): readonly INavItem[] =>
  role ? QUICK_ACCESS : [];

/** El menú lateral, con grupos. El superadmin suma Negocios y Usuarios. Sin sesión, nada. */
export const sidebarEntriesForRole = (role: TUserRole | null): readonly TSidebarEntry[] => {
  if (role === EUserRole.SUPERADMIN) {
    return SUPERADMIN_SIDEBAR;
  }

  return role ? OWNER_SIDEBAR : [];
};

/** Con sesión, todos tienen menú lateral: el layout le deja su espacio. */
export const hasSidebarForRole = (role: TUserRole | null): boolean =>
  sidebarEntriesForRole(role).length > 0;
