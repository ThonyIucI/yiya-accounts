import { Skeleton } from "@yiya/ui/components/skeleton";
import { Switch } from "@yiya/ui/components/switch";

import RowActions from "@/common/components/row-actions";
import StatusBadge from "@/common/components/status-badge";
import { useActivationGuard } from "@/modules/services/hooks/use-activation-guard";
import {
  type IServiceListHandlers,
  type IServiceRow,
  PRICE_LABELS,
  pluralize,
} from "@/modules/services/service-row";

import PriceField from "./price-field";
import ServiceAvatar from "./service-avatar";
import ServiceProfit from "./service-profit";

interface IServiceCardProps extends IServiceListHandlers {
  service: IServiceRow;
}

/**
 * Card de listado en celular (referencia: productos de id-pos). Arriba la identidad y, a la
 * derecha, el switch y el menú; en el medio los dos precios editables; abajo lo que deja
 * una cuenta llena y el estado.
 */
export default function ServiceCard({
  service,
  canManageBusiness,
  isSuperadmin,
  togglingId,
  buildActions,
  onToggleActive,
  onSavePrice,
}: IServiceCardProps) {
  const guard = useActivationGuard(service, (isActive) => onToggleActive(service, isActive));
  const actions = buildActions(service);

  return (
    <article className="rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ServiceAvatar name={service.name} imageUrl={service.imageUrl} />
          <div className="min-w-0">
            <p className="truncate font-heading text-lg font-bold text-foreground">{service.name}</p>
            <p className="text-sm text-muted-foreground">
              {pluralize(service.profilesPerAccount, "perfil", "perfiles")} por cuenta
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {canManageBusiness && (
            <Switch
              checked={service.isActive}
              disabled={togglingId === service.id}
              aria-label={service.isActive ? `Desactivar ${service.name}` : `Activar ${service.name}`}
              onCheckedChange={guard.handleToggle}
            />
          )}
          {actions.length > 0 && <RowActions actions={actions} />}
        </div>
      </div>

      {canManageBusiness && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <PriceField
            id={`purchase-${service.id}`}
            label={PRICE_LABELS.purchasePrice}
            value={service.purchasePrice}
            isRequired={service.isActive}
            hint={guard.purchaseHint}
            onSave={(value) => onSavePrice(service, "purchasePrice", value)}
          />
          <PriceField
            id={`profile-${service.id}`}
            label={PRICE_LABELS.profilePrice}
            value={service.profilePrice}
            isRequired={service.isActive}
            hint={guard.profileHint}
            onSave={(value) => onSavePrice(service, "profilePrice", value)}
          />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        <div className="min-w-0 space-y-0.5">
          {canManageBusiness && <ServiceProfit service={service} />}
          {isSuperadmin && service.activeInCount !== undefined && (
            <p className="text-sm text-muted-foreground">
              Activo en {pluralize(service.activeInCount, "negocio", "negocios")}
            </p>
          )}
        </div>
        {canManageBusiness && <StatusBadge isActive={service.isActive} />}
      </div>
    </article>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 shrink-0 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-7 w-12 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-13 rounded-xl" />
        <Skeleton className="h-13 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-4 w-48 rounded-md" />
    </div>
  );
}
