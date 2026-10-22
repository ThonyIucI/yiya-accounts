import { cn } from "@yiya/ui/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";

import { EUserRole } from "@yiya/shared/roles";

import { useChromeHidden } from "@/common/hooks/use-chrome-hidden";
import { useNavItems } from "@/common/hooks/use-nav-items";
import { useSessionRole } from "@/common/hooks/use-session-role";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

/** El login es pantalla completa y trae su propio control de tema. */
const CHROMELESS_ROUTES: readonly string[] = ["/login"];

export default function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  /* Los enlaces dependen del rol. */
  const navItems = useNavItems();
  const hasSidebar = useSessionRole() === EUserRole.SUPERADMIN;
  const isHidden = useChromeHidden();

  if (CHROMELESS_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    /* Al bajar se esconde junto con la barra inferior; al subir vuelven los dos. */
    <motion.header
      className="sticky top-0 z-20 border-b-2 border-border bg-card/90 backdrop-blur"
      initial={false}
      animate={{ y: isHidden ? "-100%" : 0 }}
      transition={{ duration: 0.2, ease: isHidden ? "easeIn" : "easeOut" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/dashboard" className="font-heading text-xl font-extrabold text-foreground">
            Yiya
          </Link>

          {/*
            En móvil los mismos enlaces están en la barra inferior, y en escritorio el
            superadmin los tiene en su menú lateral: no se repiten acá.
          */}
          <nav
            className={cn(
              "hidden gap-4 font-heading text-sm font-bold sm:flex",
              hasSidebar && "md:hidden",
            )}
          >
            {navItems.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-lg px-1 text-muted-foreground transition-colors hover:text-foreground [&.active]:text-primary"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </motion.header>
  );
}
