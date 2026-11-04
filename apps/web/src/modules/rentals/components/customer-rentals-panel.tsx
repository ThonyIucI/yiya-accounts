import { Button } from "@yiya/ui/components/button";
import { formatSoles } from "@yiya/shared/money";
import type { TExpiryStatus } from "@yiya/shared/purchases";
import { type IRentalResource, rentalDebt } from "@yiya/shared/rentals";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { DetailSection } from "@/common/components/detail-section";
import InitialsAvatar, { avatarColorOf } from "@/common/components/initials-avatar";
import RowActions from "@/common/components/row-actions";
import SidePanel from "@/common/components/side-panel";
import { formatCompactDate } from "@/common/utils/format-date";
import ExpiryBadge from "@/modules/accounts/components/expiry-badge";
import ExpiryDate from "@/modules/accounts/components/expiry-date";
import type { ICustomerRentals } from "@/modules/rentals/utils/rental-groups";
import ServiceAvatar from "@/modules/services/components/service-avatar";

interface ICustomerRentalsPanelProps {
  /** El cliente abierto con sus alquileres; `null` cierra el panel. */
  group: ICustomerRentals | null;
  onAdd: (group: ICustomerRentals) => void;
  onEdit: (rental: IRentalResource) => void;
  onDelete: (rental: IRentalResource) => void;
  onClose: () => void;
}

const RENTAL_EXPIRY_LABELS: Record<TExpiryStatus, string> = {
  expired: "Vencido",
  today: "Vence hoy",
  soon: "Por vencer",
  ok: "Al día",
};

/** «S/ 15.00 · pagado» o «S/ 15.00 · debe S/ 10.00 hasta el 10-nov». */
function RentalPayment({ rental }: { rental: IRentalResource }) {
  const debt = rentalDebt(rental);
  if (debt === 0) {
    return (
      <span className="tabular-nums">
        {formatSoles(rental.price)} <span className="text-muted-foreground">· pagado</span>
      </span>
    );
  }
  return (
    <span className="tabular-nums">
      {formatSoles(rental.price)}{" "}
      <span className="font-semibold text-destructive-on-muted">
        · debe {formatSoles(debt)}
        {rental.payBy && ` hasta el ${formatCompactDate(rental.payBy)}`}
      </span>
    </span>
  );
}

/** Un perfil alquilado, como un producto en el detalle de una orden (RF-17). */
function RentalItem({
  rental,
  onEdit,
  onDelete,
}: {
  rental: IRentalResource;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-start gap-3 py-3">
      <ServiceAvatar name={rental.service.name} imageUrl={rental.service.imageUrl} className="size-10" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="truncate font-heading font-bold text-foreground">{rental.service.name}</p>
          <ExpiryBadge expiresOn={rental.expiresOn} labels={RENTAL_EXPIRY_LABELS} />
        </div>
        <p className="truncate text-muted-foreground">{rental.account.email}</p>
        <p className="text-foreground">
          {rental.profile.name}
          {rental.profile.pin && <span className="text-muted-foreground"> · PIN {rental.profile.pin}</span>}
        </p>
        <p>
          <RentalPayment rental={rental} />
        </p>
        <p className="text-muted-foreground">
          {formatCompactDate(rental.startsOn)} → <ExpiryDate expiresOn={rental.expiresOn} />
        </p>
      </div>
      <RowActions
        actions={[
          { icon: Pencil, label: "Editar", onClick: onEdit },
          { icon: Trash2, label: "Eliminar", variant: "destructive", onClick: onDelete },
        ]}
      />
    </li>
  );
}

/**
 * El cliente en Alquileres (RF-17, RF-18): sus perfiles alquilados como los productos de una
 * orden, cada uno con su `⋯`, y «Agregar perfil» para sumarle otro sin crear otra fila. En
 * la porción 2 llegan Renovar, Liberar y el historial.
 */
export default function CustomerRentalsPanel({ group, onAdd, onEdit, onDelete, onClose }: ICustomerRentalsPanelProps) {
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
            <h2 className="min-w-0 truncate font-heading text-xl font-extrabold text-foreground">
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
