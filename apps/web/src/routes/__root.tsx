import { Toaster } from "@yiya/ui/components/sonner";
import { cn } from "@yiya/ui/lib/utils";
import { HeadContent, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Suspense, lazy } from "react";

import { EUserRole } from "@yiya/shared/roles";

import { useNavItems } from "@/common/hooks/use-nav-items";
import { useSessionRole } from "@/common/hooks/use-session-role";
import AppSidebar from "@/components/app-sidebar";
import BottomNav from "@/components/bottom-nav";
import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { ActiveBusinessProvider } from "@/modules/businesses/context/active-business";

import "../index.css";

/* Solo en desarrollo: Alt + clic sobre un elemento abre su componente en el editor. */
const ClickToComponent = import.meta.env.DEV
  ? lazy(() =>
      import("click-to-react-component-next").then((module) => ({ default: module.ClickToComponent })),
    )
  : null;

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Yiya Accounts",
      },
      {
        name: "description",
        content: "Inventario y alquiler de perfiles de cuentas de streaming.",
      },
    ],
  }),
});

function RootComponent() {
  /* El hueco para la barra inferior solo se reserva cuando la barra existe (hay sesión). */
  const hasBottomNav = useNavItems().length > 0;
  /* Por ahora el menú lateral (y el cambio de negocio) es solo del superadmin. */
  const hasSidebar = useSessionRole() === EUserRole.SUPERADMIN;

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
        storageKey="vite-ui-theme"
      >
        <ActiveBusinessProvider isEnabled={hasSidebar}>
          {/* En escritorio el menú lateral va `fixed`: el resto se corre su ancho. */}
          <div className={cn("grid min-h-svh grid-rows-[auto_1fr]", hasSidebar && "md:pl-64")}>
            <Header />
            <div className={cn("min-w-0", hasBottomNav && "pb-20 sm:pb-0")}>
              <Outlet />
            </div>
          </div>

          {hasSidebar && <AppSidebar />}

          {/*
            La barra inferior va `fixed`, por eso no es una fila de la grilla y el contenido
            lleva `pb-20` para no quedar debajo (solo con sesión).
          */}
          <BottomNav />
        </ActiveBusinessProvider>
        <Toaster richColors />
      </ThemeProvider>
      {ClickToComponent && (
        <Suspense>
          <ClickToComponent />
        </Suspense>
      )}
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-left" />}
    </>
  );
}
