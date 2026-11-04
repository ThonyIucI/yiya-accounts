import { IconButton } from "@yiya/ui/components/icon-button";
import type { IAccountResource } from "@yiya/shared/accounts";
import { formatSoles } from "@yiya/shared/money";
import { Trash2 } from "lucide-react";

import type { ICartLine } from "@/modules/rentals/utils/rental-cart";
import type { TProfileHolders } from "@/modules/rentals/utils/profile-options";
import ServiceAvatar from "@/modules/services/components/service-avatar";

import { DurationBadge } from "./duration-badges";

interface IRentalCartLineProps {
  line: ICartLine;
  account: IAccountResource;
  /** Su parte del total (RF-02a). */
  amount: number;
  holders: TProfileHolders;
  /** Abre el detalle para cambiar el perfil o el tiempo. */
  onOpen: () => void;
  onRemove: () => void;
}

/**
 * Un perfil del carrito, sin amontonar (acordado 2026-11-04): el logo, el perfil que se
 * asignó solo y al lado su **badge** de tiempo; debajo el correo en chico; a la derecha su
 * parte del total y el tacho. Tocar la línea abre el detalle para cambiarla.
 */
export default function RentalCartLine({ line, account, amount, holders, onOpen, onRemove }: IRentalCartLineProps) {
  const profile = account.profiles.find((item) => item.id === line.profileId);
  const sharedWith = holders.get(line.profileId) ?? [];

  return (
    <li className="flex items-center gap-2 py-2.5">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Cambiar ${profile?.name ?? "el perfil"} de ${account.email}`}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
        className="-m-1 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg p-1 transition-colors hover:bg-muted"
      >
        <ServiceAvatar name={account.service.name} imageUrl={account.service.imageUrl} className="size-10 rounded-md" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold text-foreground">{profile?.name ?? "Perfil"}</span>
            <DurationBadge dates={line} />
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {account.email}
            {sharedWith.length > 0 && <span className="text-orange"> · con {sharedWith.join(", ")}</span>}
          </p>
        </div>
        <span className="shrink-0 font-heading font-bold text-foreground tabular-nums">{formatSoles(amount)}</span>
      </div>
      <IconButton tone="destructive" label="Quitar del carrito" onClick={onRemove}>
        <Trash2 />
      </IconButton>
    </li>
  );
}
