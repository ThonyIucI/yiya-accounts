import { Button } from "@yiya/ui/components/button";
import { Skeleton } from "@yiya/ui/components/skeleton";
import { Switch } from "@yiya/ui/components/switch";
import type { IAccountResource } from "@yiya/shared/accounts";
import { cn } from "@yiya/ui/lib/utils";
import { Copy } from "lucide-react";

import RowActions, { type IRowAction } from "@/common/components/row-actions";
import { copyToClipboard } from "@/common/utils/clipboard";
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
 * Card de una cuenta (referencia que pasó Thony el 2026-10-13): servicio, correo y
 * proveedor arriba con el switch; la ocupación de perfiles en el medio; el vencimiento y
 * «Gestionar» al pie. Sin badge de «Activa»: lo dice el switch. La contraseña no va acá:
 * solo en el detalle.
 */
export default function AccountCard({
  account,
  actions,
  isToggling,
  onToggleActive,
  onOpen,
}: IAccountCardProps) {
  return (
    <article
      className={cn(
        "space-y-3 rounded-2xl bg-card p-4 shadow-card transition-opacity",
        !account.isActive && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <ServiceAvatar name={account.service.name} imageUrl={account.service.imageUrl} />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center">
              <p className="truncate font-heading text-base font-bold text-foreground">{account.email}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                title="Copiar correo"
                aria-label={`Copiar el correo ${account.email}`}
                onClick={() => copyToClipboard(account.email, "Correo copiado")}
              >
                <Copy />
              </Button>
            </div>
            <p className="truncate text-sm text-muted-foreground">Proveedor: {account.provider.name}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Switch
            checked={account.isActive}
            disabled={isToggling}
            aria-label={account.isActive ? "Desactivar cuenta" : "Activar cuenta"}
            onCheckedChange={onToggleActive}
          />
          <RowActions actions={actions} />
        </div>
      </div>

      <ProfileChips profiles={account.profiles} />

      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        {/* Las compras todavía no están: el vencimiento queda vacío, no se inventa. */}
        <p className="text-sm text-muted-foreground">
          Renueva: <span className="font-semibold">—</span>
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={onOpen}>
          Gestionar
        </Button>
      </div>
    </article>
  );
}

export function AccountCardSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 shrink-0 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-44 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded-lg" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );
}
