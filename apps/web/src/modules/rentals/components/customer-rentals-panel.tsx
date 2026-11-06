import { Button } from "@yiya/ui/components/button";
import { cn } from "@yiya/ui/lib/utils";
import type { TExpiryStatus } from "@yiya/shared/purchases";
import type { IRentalHistoryResource, IRentalResource } from "@yiya/shared/rentals";
import { ArrowDown, ChevronDown, LogOut, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import RowActions from "@/common/components/row-actions";
import SidePanel from "@/common/components/side-panel";
import { formatCompactDate } from "@/common/utils/format-date";
import ExpiryBadge from "@/modules/accounts/components/expiry-badge";
import { EXPIRY_TEXT_CLASSES, expiryOf } from "@/modules/accounts/utils/expiry";
import { useCustomerRentalHistory } from "@/modules/rentals/hooks/use-customer-rental-history";
import type { ICustomerRentals } from "@/modules/rentals/utils/rental-groups";
import ServiceAvatar from "@/modules/services/components/service-avatar";

import RentalAmount from "./rental-amount";
import RentalHistory from "./rental-history";

interface ICustomerRentalsPanelProps {
  /** El cliente abierto con sus alquileres; `null` cierra el panel. */
  group: ICustomerRentals | null;
  onAdd: (group: ICustomerRentals) => void;
  onEdit: (rental: IRentalResource) => void;
  onRenew: (rental: IRentalResource) => void;
  onRelease: (rental: IRentalResource) => void;
  onDelete: (rental: IRentalResource) => void;
  onClose: () => void;
}

const RENTAL_EXPIRY_LABELS: Record<TExpiryStatus, string> = {
  expired: "Vencido",
  today: "Vence hoy",
  soon: "Por vencer",
  ok: "Al día",
};

/** Un dato de la card: el nombre en gris arriba y el valor debajo, como en la card de cuenta. */
function RentalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="min-w-0 tabular-nums">{children}</div>
    </div>
  );
}

interface IRentalItemProps {
  rental: IRentalResource;
  history: IRentalHistoryResource[] | null;
  isHistoryLoading: boolean;
  /** Pide el historial del cliente la primera vez que se abre uno. */
  onHistoryOpen: () => void;
  onEdit: () => void;
  onRenew: () => void;
  onRelease: () => void;
  onDelete: () => void;
}

/** Un perfil alquilado, como un producto en el detalle de una orden (RF-17). */
function RentalItem({
  rental,
  history,
  isHistoryLoading,
  onHistoryOpen,
  onEdit,
  onRenew,
  onRelease,
  onDelete,
}: IRentalItemProps) {
  const status = expiryOf(rental.expiresOn).status;
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const toggleHistory = () => {
    if (!isHistoryOpen) {
      onHistoryOpen();
    }
    setIsHistoryOpen(!isHistoryOpen);
  };

  return (
    /* Una card propia por perfil, con su cabecera gris como la card de cuenta (Thony, 2026-11-06). */
    <li className="overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="flex items-center justify-between gap-2 bg-muted px-3 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <ServiceAvatar name={rental.service.name} imageUrl={rental.service.imageUrl} />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate font-heading font-semibold text-foreground">{rental.service.name}</p>
              <ExpiryBadge expiresOn={rental.expiresOn} labels={RENTAL_EXPIRY_LABELS} />
            </div>
            <p className="truncate text-muted-foreground">{rental.account.email}</p>
          </div>
        </div>
        {/* Renovar como acción a la vista, junto al ⋯ (Thony, 2026-11-06): no suelto en la card. */}
        <div className="flex shrink-0 items-center gap-1">
          <RowActions
            actions={[
              { icon: RefreshCw, label: "Renovar", inline: true, onClick: onRenew },
              { icon: Pencil, label: "Editar", onClick: onEdit },
              { icon: LogOut, label: "Liberar", onClick: onRelease },
              { icon: Trash2, label: "Eliminar", variant: "destructive", onClick: onDelete },
            ]}
          />
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        {/* Tres columnas, como Correo y Contraseña en la card de cuenta (Thony, 2026-11-06). */}
        <div className="grid grid-cols-3 gap-x-4">
          <RentalField label="Perfil">
            <p className="truncate font-semibold text-foreground">{rental.profile.name}</p>
            {rental.profile.pin && <p className="truncate text-xs text-muted-foreground">PIN {rental.profile.pin}</p>}
          </RentalField>
          <RentalField label="Monto">
            <RentalAmount rental={rental} />
          </RentalField>
          <RentalField label="Fechas">
            {/* La flecha dice «de esta a esta» sin texto: el inicio arriba, el vencimiento abajo. */}
            <p className="flex items-center gap-1 text-foreground">
              <ArrowDown className="size-3.5 shrink-0 text-muted-foreground" aria-label="desde" />
              {formatCompactDate(rental.startsOn)}
            </p>
            <p className={cn("pl-4.5 font-semibold", EXPIRY_TEXT_CLASSES[status])}>
              <span className="sr-only">hasta </span>
              {formatCompactDate(rental.expiresOn)}
            </p>
          </RentalField>
        </div>
  
        {/* Plegado y pedido al abrirlo (RF-18, RNF-08): los meses anteriores de este perfil. */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-expanded={isHistoryOpen}
            onClick={toggleHistory}
            className="-ml-2.5 text-muted-foreground"
          >
            Historial
            <ChevronDown
              className={cn("transition-transform duration-200 ease-out", isHistoryOpen && "rotate-180")}
              aria-hidden
            />
          </Button>
          {isHistoryOpen && (
            <RentalHistory rental={rental} history={history} isLoading={isHistoryLoading} onRetry={onHistoryOpen} />
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * El cliente en Alquileres (RF-17, RF-18): sus perfiles alquilados como los productos de una
 * orden, cada uno con su `⋯`, y «Agregar perfil» para sumarle otro sin crear otra fila. En
 * la porción 2: Renovar, Liberar y el historial de cada perfil (2026-11-06).
 */
export default function CustomerRentalsPanel({
  group,
  onAdd,
  onEdit,
  onRenew,
  onRelease,
  onDelete,
  onClose,
}: ICustomerRentalsPanelProps) {
  /* El panel se queda con el último cliente mientras se anima al cerrarse. */
  const [shown, setShown] = useState<ICustomerRentals | null>(group);
  const History = useCustomerRentalHistory();

  useEffect(() => {
    if (group) {
      setShown(group);
    }
  }, [group]);

  const current = group ?? shown;

  /*
    Otro cliente, o los mismos perfiles cambiaron (renovó, liberó, agregó): el historial
    guardado ya no sirve y se vuelve a pedir al abrirlo.
  */
  const rentalsKey = current ? `${current.customer.id}:${current.rentals.map((item) => item.id).join(",")}` : "";
  useEffect(() => {
    History.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentalsKey]);

  const openHistory = () => {
    if (current && History.history === null && !History.loading) {
      History.handler(current.customer.id);
    }
  };

  return (
    <SidePanel
      open={group !== null}
      label={current ? `Alquileres de ${current.customer.name}` : "Alquileres"}
      backLabel="Alquileres"
      /* «Agregar perfil» sube al encabezado del panel (Thony, 2026-11-06). */
      actions={
        current && (
          <Button type="button" variant="outline" size="sm" onClick={() => onAdd(current)}>
            <Plus />
            Agregar perfil
          </Button>
        )
      }
      onClose={onClose}
    >
      {current && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <InitialsAvatar
              name={current.customer.name}
              color={avatarColorOf(current.customer.name)}
              className="size-14 text-lg"
            />
            <h2 className="min-w-0 truncate font-heading text-xl font-bold text-foreground">
              {current.customer.name}
            </h2>
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Perfiles · {current.rentals.length}</h3>
            <ul className="space-y-3">
              {current.rentals.map((rental) => (
                <RentalItem
                  key={rental.id}
                  rental={rental}
                  history={History.history}
                  isHistoryLoading={History.loading}
                  onHistoryOpen={openHistory}
                  onEdit={() => onEdit(rental)}
                  onRenew={() => onRenew(rental)}
                  onRelease={() => onRelease(rental)}
                  onDelete={() => onDelete(rental)}
                />
              ))}
            </ul>
          </section>
        </div>
      )}
    </SidePanel>
  );
}
