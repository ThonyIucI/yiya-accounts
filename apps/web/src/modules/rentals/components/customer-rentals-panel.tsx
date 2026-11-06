import { Button } from "@yiya/ui/components/button";
import { cn } from "@yiya/ui/lib/utils";
import { formatSoles } from "@yiya/shared/money";
import type { TExpiryStatus } from "@yiya/shared/purchases";
import { type IRentalResource, rentalDebt } from "@yiya/shared/rentals";
import { ArrowDown, ArrowRight, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import { DetailSection } from "@/common/components/detail-section";
import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import RowActions from "@/common/components/row-actions";
import SidePanel from "@/common/components/side-panel";
import { formatCompactDate } from "@/common/utils/format-date";
import ExpiryBadge from "@/modules/accounts/components/expiry-badge";
import { EXPIRY_TEXT_CLASSES, expiryOf } from "@/modules/accounts/utils/expiry";
import type { ICustomerRentals } from "@/modules/rentals/utils/rental-groups";
import ServiceAvatar from "@/modules/services/components/service-avatar";

interface ICustomerRentalsPanelProps {
  /** El cliente abierto con sus alquileres; `null` cierra el panel. */
  group: ICustomerRentals | null;
  onAdd: (group: ICustomerRentals) => void;
  onEdit: (rental: IRentalResource) => void;
  onRenew: (rental: IRentalResource) => void;
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

/**
 * Lo pagado en verde y lo que falta en amarillo, sin la palabra «pagado» (Thony, 2026-11-06).
 * Si no pagó nada, solo el monto en amarillo.
 */
function RentalAmount({ rental }: { rental: IRentalResource }) {
  const debt = rentalDebt(rental);
  const debtTitle = rental.payBy ? `Debe · prometió pagar el ${formatCompactDate(rental.payBy)}` : "Debe";
  return (
    <>
      {rental.paidAmount > 0 && (
        <p className="truncate font-semibold text-success" title="Pagado">
          {formatSoles(rental.paidAmount)}
        </p>
      )}
      {debt > 0 && (
        <p className="truncate font-semibold text-yellow" title={debtTitle}>
          {formatSoles(debt)}
          <span className="sr-only"> por pagar</span>
        </p>
      )}
    </>
  );
}

/** Un perfil alquilado, como un producto en el detalle de una orden (RF-17). */
function RentalItem({
  rental,
  onEdit,
  onRenew,
  onDelete,
}: {
  rental: IRentalResource;
  onEdit: () => void;
  onRenew: () => void;
  onDelete: () => void;
}) {
  const status = expiryOf(rental.expiresOn).status;
  return (
    <li className="space-y-3 py-3">
      <div className="flex items-start gap-3">
        <ServiceAvatar name={rental.service.name} imageUrl={rental.service.imageUrl} className="size-10" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-heading font-semibold text-foreground">{rental.service.name}</p>
            <ExpiryBadge expiresOn={rental.expiresOn} labels={RENTAL_EXPIRY_LABELS} />
          </div>
          <p className="truncate text-muted-foreground">{rental.account.email}</p>
        </div>
        {/* Renovar como acción a la vista, junto al ⋯ (Thony, 2026-11-06): no suelto en la card. */}
        <RowActions
          actions={[
            { icon: RefreshCw, label: "Renovar", inline: true, onClick: onRenew },
            { icon: Pencil, label: "Editar", onClick: onEdit },
            { icon: Trash2, label: "Eliminar", variant: "destructive", onClick: onDelete },
          ]}
        />
      </div>

      {/* Tres columnas, como Correo y Contraseña en la card de cuenta (Thony, 2026-11-06). */}
      <div className="grid grid-cols-3 gap-x-4 pl-2">
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
    </li>
  );
}

/**
 * El cliente en Alquileres (RF-17, RF-18): sus perfiles alquilados como los productos de una
 * orden, cada uno con su `⋯`, y «Agregar perfil» para sumarle otro sin crear otra fila. En
 * la porción 2: Renovar, un botón por perfil (2026-11-06); falta Liberar y el historial.
 */
export default function CustomerRentalsPanel({
  group,
  onAdd,
  onEdit,
  onRenew,
  onDelete,
  onClose,
}: ICustomerRentalsPanelProps) {
  /* El panel se queda con el último cliente mientras se anima al cerrarse. */
  const [shown, setShown] = useState<ICustomerRentals | null>(group);

  useEffect(() => {
    if (group) {
      setShown(group);
    }
  }, [group]);

  const current = group ?? shown;

  return (
    <SidePanel
      open={group !== null}
      label={current ? `Alquileres de ${current.customer.name}` : "Alquileres"}
      backLabel="Alquileres"
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

          <DetailSection
            title={`Perfiles · ${current.rentals.length}`}
            action={
              <Button type="button" variant="ghost" size="sm" onClick={() => onAdd(current)}>
                <Plus />
                Agregar perfil
              </Button>
            }
          >
            <ul className="-my-3 divide-y divide-border/60">
              {current.rentals.map((rental) => (
                <RentalItem
                  key={rental.id}
                  rental={rental}
                  onEdit={() => onEdit(rental)}
                  onRenew={() => onRenew(rental)}
                  onDelete={() => onDelete(rental)}
                />
              ))}
            </ul>
          </DetailSection>
        </div>
      )}
    </SidePanel>
  );
}
