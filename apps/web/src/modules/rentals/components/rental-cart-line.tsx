import { Button } from "@yiya/ui/components/button";
import { IconButton } from "@yiya/ui/components/icon-button";
import { Input } from "@yiya/ui/components/input";
import type { IAccountResource } from "@yiya/shared/accounts";
import { addMonths, isIsoDate } from "@yiya/shared/dates";
import { X } from "lucide-react";
import { useState } from "react";

import { formatCompactDate } from "@/common/utils/format-date";
import type { ICartLine } from "@/modules/rentals/utils/rental-cart";
import { RENTAL_MONTH_SHORTCUTS } from "@/modules/rentals/utils/rental-form";
import type { TProfileHolders } from "@/modules/rentals/utils/profile-options";
import ServiceAvatar from "@/modules/services/components/service-avatar";

interface IRentalCartLineProps {
  line: ICartLine;
  account: IAccountResource;
  holders: TProfileHolders;
  /** Los perfiles de esta cuenta que ya usan otras líneas del carrito. */
  takenProfileIds: Set<string>;
  onChange: (next: ICartLine) => void;
  onRemove: () => void;
}

const monthsLabel = (months: number) => (months === 12 ? "1 año" : `${months} ${months === 1 ? "mes" : "meses"}`);

/**
 * Un perfil del carrito: logo, correo y el perfil (se cambia ahí mismo), la duración con
 * atajos y, si hace falta, otras fechas. Sin precio: se cobra un solo total (2026-11-04).
 */
export default function RentalCartLine({
  line,
  account,
  holders,
  takenProfileIds,
  onChange,
  onRemove,
}: IRentalCartLineProps) {
  const [areDatesShown, setAreDatesShown] = useState(false);
  const sharedWith = holders.get(line.profileId) ?? [];

  const applyMonths = (months: number) => onChange({ ...line, expiresOn: addMonths(line.startsOn, months) });

  return (
    <li className="space-y-2.5 py-3">
      <div className="flex items-center gap-3">
        <ServiceAvatar name={account.service.name} imageUrl={account.service.imageUrl} className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground" title={account.email}>
            {account.email}
          </p>
          {/* Una lista corta y fija (los perfiles de una cuenta): `<select>` nativo. */}
          <select
            aria-label="Perfil"
            value={line.profileId}
            onChange={(event) => onChange({ ...line, profileId: event.target.value })}
            className="-ml-1 max-w-full cursor-pointer truncate rounded-md bg-transparent px-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {account.profiles
              .filter((profile) => profile.id === line.profileId || !takenProfileIds.has(profile.id))
              .map((profile) => {
                const names = holders.get(profile.id) ?? [];
                return (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                    {names.length > 0 ? ` · con ${names.join(", ")}` : " · libre"}
                  </option>
                );
              })}
          </select>
        </div>
        <IconButton size="sm" label="Quitar del carrito" onClick={onRemove}>
          <X />
        </IconButton>
      </div>

      {sharedWith.length > 0 && (
        <p className="text-xs font-semibold text-orange">Lo compartes con {sharedWith.join(", ")}.</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Duración">
        {RENTAL_MONTH_SHORTCUTS.map((months) => {
          const isCurrent = line.expiresOn === addMonths(line.startsOn, months);
          return (
            <Button
              key={months}
              type="button"
              size="xs"
              variant={isCurrent ? "default" : "outline"}
              aria-pressed={isCurrent}
              onClick={() => applyMonths(months)}
            >
              {monthsLabel(months)}
            </Button>
          );
        })}
        <button
          type="button"
          onClick={() => setAreDatesShown((shown) => !shown)}
          className="cursor-pointer px-1.5 text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
        >
          {areDatesShown ? "Listo" : `${formatCompactDate(line.startsOn)} → ${formatCompactDate(line.expiresOn)}`}
        </button>
      </div>

      {areDatesShown && (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            aria-label="Inicio"
            value={line.startsOn}
            className="h-10"
            onChange={(event) => {
              const startsOn = event.target.value;
              /* Correr el inicio corre el vencimiento: se mantiene la duración. */
              const months = RENTAL_MONTH_SHORTCUTS.find(
                (shortcut) => line.expiresOn === addMonths(line.startsOn, shortcut),
              );
              onChange({
                ...line,
                startsOn,
                expiresOn: isIsoDate(startsOn) && months ? addMonths(startsOn, months) : line.expiresOn,
              });
            }}
          />
          <Input
            type="date"
            aria-label="Vencimiento"
            min={line.startsOn}
            value={line.expiresOn}
            className="h-10"
            onChange={(event) => onChange({ ...line, expiresOn: event.target.value })}
          />
        </div>
      )}
    </li>
  );
}
