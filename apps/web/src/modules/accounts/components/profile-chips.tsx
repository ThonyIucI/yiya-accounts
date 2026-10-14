import type { IProfileResource } from "@yiya/shared/accounts";
import { cn } from "@yiya/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { EASE_OUT } from "@/common/constants/motion";
import { freeProfiles, profileChipLabel } from "@/modules/accounts/utils/profile-occupancy";

interface IProfileChipsProps {
  profiles: IProfileResource[];
}

/**
 * Ocupación de perfiles de la card: «Perfiles · 5 / 5 libres» y, al abrir con el chevron,
 * un chip por perfil. **Plegada por defecto** (acordado 2026-10-13): con muchas cuentas, la
 * lista se lee mejor sin los chips. Hasta los alquileres (paso 4) todos están libres; ahí
 * los alquilados se pintan distinto.
 */
export default function ProfileChips({ profiles }: IProfileChipsProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const freeCount = freeProfiles(profiles).length;

  return (
    <div>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="-mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted"
      >
        <span className="font-semibold text-muted-foreground">Perfiles</span>
        <span className="flex items-center gap-1.5 font-bold text-primary tabular-nums">
          {freeCount} / {profiles.length} {freeCount === 1 ? "libre" : "libres"}
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.ul
            className="flex flex-wrap gap-1.5 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, paddingTop: 6 }}
            exit={{ height: 0, opacity: 0, paddingTop: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: EASE_OUT }}
          >
            {profiles.map((profile) => (
              <li
                key={profile.id}
                title={profile.name}
                className="min-w-11 rounded-lg bg-muted px-2 py-1 text-center text-sm font-bold text-muted-foreground"
              >
                {profileChipLabel(profile)}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
