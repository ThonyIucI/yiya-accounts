import { Skeleton } from "@yiya/ui/components/skeleton";
import { Switch } from "@yiya/ui/components/switch";
import type { IAccountResource } from "@yiya/shared/accounts";
import { cn } from "@yiya/ui/lib/utils";
import { SendHorizontal } from "lucide-react";

import RowActions, { type IRowAction } from "@/common/components/row-actions";
import CopyButton from "@/common/components/copy-button";
import { useRevealablePassword } from "@/modules/accounts/hooks/use-revealable-password";
import { buildAccessText } from "@/modules/accounts/utils/access-text";
import ServiceAvatar from "@/modules/services/components/service-avatar";

import PasswordEyeButton from "./password-eye-button";
import ProfileChips from "./profile-chips";

interface IAccountCardProps {
  account: IAccountResource;
  actions: IRowAction[];
  isToggling: boolean;
  onToggleActive: () => void;
  onOpen: () => void;
}

/**
 * Card de una cuenta (acordado 2026-10-13, ajustado 2026-10-22):
 * - **Cabecera** (fondo gris, como las cards de id-pos): logo, **el servicio como título** y
 *   el proveedor. Tocarla abre el detalle. A la derecha, **enviar** (copia el acceso completo
 *   listo para WhatsApp), el switch y `⋯`; sin badge de «Activa».
 * - **Cuerpo:** correo y contraseña (oculta), cada uno con su copiar al lado de la etiqueta
 *   (así no se corre con el ancho del texto); la contraseña además con su ojo. Debajo, los
 *   perfiles plegados.
 */
export default function AccountCard({
  account,
  actions,
  isToggling,
  onToggleActive,
  onOpen,
}: IAccountCardProps) {
  const password = useRevealablePassword(account.id);

  /* La contraseña se pide en el mismo toque: `CopyButton` acepta la promesa. */
  const getAccessText = async () =>
    buildAccessText(account.service.name, account.email, await password.getText());

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl bg-card shadow-card transition-opacity",
        !account.isActive && "opacity-70",
      )}
    >
      <div className="flex items-center justify-between gap-2 bg-muted px-4 py-3">
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
            <p className="truncate font-heading font-bold text-foreground">{account.service.name}</p>
            <p className="truncate text-muted-foreground">{account.provider.name}</p>
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
          {/* Enviar = copia el acceso listo para pegarlo en WhatsApp. */}
          <CopyButton
            label={`Copiar el acceso de ${account.email} para enviarlo`}
            icon={SendHorizontal}
            getText={getAccessText}
            className="bg-success/15 text-success hover:bg-success/25 hover:text-success"
          />
          <RowActions actions={actions} />
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="grid grid-cols-[minmax(0,1fr)_max-content] gap-x-4">
          <div className="min-w-0">
            <div className="flex items-center text-muted-foreground">
              Correo
              <CopyButton label="Copiar correo" getText={() => account.email} />
            </div>
            <p className="truncate font-semibold text-foreground">{account.email}</p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center text-muted-foreground">
              Contraseña
              <PasswordEyeButton isVisible={password.isVisible} onToggle={password.toggle} />
              <CopyButton label="Copiar contraseña" getText={password.getText} />
            </div>
            <p className="truncate font-mono font-semibold text-foreground">{password.text}</p>
          </div>
        </div>

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
