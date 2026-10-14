import type { IProfileResource } from "@yiya/shared/accounts";

import { freeProfiles, profileChipLabel } from "@/modules/accounts/utils/profile-occupancy";

interface IProfileChipsProps {
  profiles: IProfileResource[];
}

/**
 * Ocupación de perfiles de la card: «Perfiles · 5 / 5 libres» y un chip por perfil. Hasta
 * los alquileres (paso 4) todos están libres; ahí los alquilados se pintan distinto.
 */
export default function ProfileChips({ profiles }: IProfileChipsProps) {
  const freeCount = freeProfiles(profiles).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-muted-foreground">Perfiles</span>
        <span className="font-bold text-primary tabular-nums">
          {freeCount} / {profiles.length} {freeCount === 1 ? "libre" : "libres"}
        </span>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {profiles.map((profile) => (
          <li
            key={profile.id}
            title={profile.name}
            className="min-w-11 rounded-lg bg-muted px-2 py-1 text-center text-sm font-bold text-muted-foreground"
          >
            {profileChipLabel(profile)}
          </li>
        ))}
      </ul>
    </div>
  );
}
