import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";

import { useChromeHidden } from "@/common/hooks/use-chrome-hidden";
import { useNavItems } from "@/common/hooks/use-nav-items";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

/** El login es pantalla completa y trae su propio control de tema. */
const CHROMELESS_ROUTES: readonly string[] = ["/login"];

export default function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  /* Los enlaces dependen del rol. */
  const navItems = useNavItems();
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
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/dashboard" className="font-heading text-xl font-extrabold text-foreground">
            Yiya
          </Link>

          {/* En móvil los mismos enlaces están en la barra inferior, no se repiten acá. */}
          <nav className="hidden gap-4 font-heading text-base font-bold sm:flex">
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
