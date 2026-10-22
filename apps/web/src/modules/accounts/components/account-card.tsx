import { Skeleton } from "@yiya/ui/components/skeleton";
import { Switch } from "@yiya/ui/components/switch";
import type { IAccountResource } from "@yiya/shared/accounts";
import { cn } from "@yiya/ui/lib/utils";

import RowActions, { type IRowAction } from "@/common/components/row-actions";
import CopyButton from "@/common/components/copy-button";
import { getAccountPasswordRequest } from "@/modules/accounts/services/account.service";
import { buildAccessText } from "@/modules/accounts/utils/access-text";
import ServiceAvatar from "@/modules/services/components/service-avatar";

import ProfileChips from "./profile-chips";

interface IAccountCardProps {
  account: IAccountResource;
  actions: IRowAction[];
  isToggling: boolean;
  onToggleActive: () => void;
  onOpen: () => void;
}

/**
 * Card de una cuenta (acordado 2026-10-13):
 * - **Cabecera:** logo, correo y el nombre del proveedor. Tocarla abre el detalle (no hay
 *   botón «Gestionar»). Copiar copia **el acceso completo** (correo y contraseña), listo
 *   para WhatsApp. A la derecha el switch y `⋯`; sin badge de «Activa».
 * - **Perfiles:** plegados, con chevron, en el cuerpo (cabecera y cuerpo van en fondos
 *   distintos, como las cards de id-pos).
 */
export default function AccountCard({
  account,
  actions,
  isToggling,
  onToggleActive,
  onOpen,
}: IAccountCardProps) {
  /* La contraseña se pide en el mismo toque: `CopyButton` acepta la promesa. */
  const getAccessText = () =>
    getAccountPasswordRequest(account.id).then(({ password }) =>
      buildAccessText(account.service.name, account.email, password),
    );

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl bg-card shadow-card transition-opacity",
        !account.isActive && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2 bg-muted px-4 py-3">
        {/* Toda la cabecera abre el detalle; copiar, el switch y `⋯` no. */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`Ver la cuenta ${account.email}`}
          onClick={onOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpen();
            }
          }}
          className="-m-1 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl p-1"
        >
          <ServiceAvatar name={account.service.name} imageUrl={account.service.imageUrl} />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center">
              <p className="truncate font-heading text-sm font-bold text-foreground">{account.email}</p>
              <CopyButton label={`Copiar el acceso de ${account.email}`} getText={getAccessText} />
            </div>
            <p className="truncate text-sm text-muted-foreground">{account.provider.name}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Switch
            /* Sin `disabled` (nunca se apaga): mientras guarda, un toque más no hace nada. */
            aria-busy={isToggling}
            checked={account.isActive}
            aria-label={account.isActive ? "Desactivar cuenta" : "Activar cuenta"}
            onCheckedChange={onToggleActive}
          />
          <RowActions actions={actions} />
        </div>
      </div>

      <div className="px-4 py-3">
        <ProfileChips profiles={account.profiles} />
      </div>
    </article>
  );
}

export function AccountCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="flex items-center gap-3 bg-muted px-4 py-3">
        <Skeleton className="size-11 shrink-0 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-44 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
      </div>
      <div className="px-4 py-3">
        <Skeleton className="h-6 w-full rounded-lg" />
      </div>
    </div>
  );
}
