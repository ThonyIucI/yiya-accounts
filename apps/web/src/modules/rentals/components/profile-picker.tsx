import type { IProfileResource } from "@yiya/shared/accounts";
import { cn } from "@yiya/ui/lib/utils";
import { Check } from "lucide-react";

import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import { profileChipLabel } from "@/modules/accounts/utils/profile-occupancy";
import type { TProfileHolders } from "@/modules/rentals/utils/profile-options";

interface IProfilePickerProps {
  profiles: IProfileResource[];
  holders: TProfileHolders;
  selectedIds: string[];
  /** Los que ya están en otra línea del carrito: se ven, pero no se eligen dos veces. */
  inCartIds: Set<string>;
  onToggle: (profile: IProfileResource) => void;
}

/**
 * Los perfiles de una cuenta como cards (acordado 2026-11-04): el **libre** con un círculo
 * punteado y su número; el **ocupado** con las iniciales de quien lo tiene y su nombre
 * debajo. El elegido lleva el anillo y el check. Un ocupado se puede elegir igual: se
 * comparte (RF-05).
 */
export default function ProfilePicker({ profiles, holders, selectedIds, inCartIds, onToggle }: IProfilePickerProps) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {profiles.map((profile) => {
        const names = holders.get(profile.id) ?? [];
        const [holder] = names;
        const isSelected = selectedIds.includes(profile.id);
        const isInCart = inCartIds.has(profile.id);
        return (
          <li key={profile.id}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(profile)}
              className={cn(
                "relative flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-lg bg-card px-1.5 py-3 text-center shadow-card",
                "transition-[transform,box-shadow] duration-150 ease-out active:scale-[0.97]",
                isSelected && "ring-2 ring-primary",
                isInCart && "opacity-60",
              )}
            >
              {holder ? (
                <InitialsAvatar name={holder} color={avatarColorOf(holder)} />
              ) : (
                <span className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 font-heading text-sm font-extrabold text-muted-foreground">
                  {profileChipLabel(profile)}
                </span>
              )}
              <span className="w-full min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">{profile.name}</span>
                {/* El libre no dice «Libre»: el círculo punteado y sin nombre ya lo dicen. */}
                {(isInCart || holder) && (
                  <span className={cn("block truncate text-xs", isInCart ? "text-muted-foreground" : "text-orange")}>
                    {isInCart ? "En el carrito" : names.join(", ")}
                  </span>
                )}
              </span>
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3.5" />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
