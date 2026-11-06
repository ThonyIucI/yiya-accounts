import type { IAccountResource } from "@yiya/shared/accounts";
import { formatSoles } from "@yiya/shared/money";
import { cn } from "@yiya/ui/lib/utils";
import { Plus } from "lucide-react";

import ServiceAvatar from "@/modules/services/components/service-avatar";

interface IRentableAccountCardProps {
  account: IAccountResource;
  /** El precio de venta de un perfil por un mes; `null` si el negocio no lo puso. */
  profilePrice: number | null;
  /** Perfiles sin nadie (sin contar los del carrito). */
  freeCount: number;
  /** Cuántos perfiles de esta cuenta ya están en el carrito. */
  inCartCount: number;
  /** Tocar la card: el detalle, para elegir perfiles y tiempo. */
  onOpen: () => void;
  /** El «+»: agrega el siguiente perfil libre por un mes, sin abrir nada. */
  onAdd: () => void;
}

/**
 * Una cuenta para alquilar, **como la card de un producto** del carrito de id-pos (acordado
 * 2026-11-04): horizontal, el logo a la izquierda, el correo, el precio por perfil y, abajo
 * a la derecha, cuántos van en el carrito y el «+». Como en id-pos, tocar la card abre su
 * detalle (`RentalItemModal`) y el «+» agrega directo el siguiente perfil libre.
 *
 * Lleva además «3 libres» en chico: sin eso no se sabe qué cuenta tiene espacio antes de
 * tocarla. Va sobre el fondo gris del catálogo, para que se vea su sombra.
 */
export default function RentableAccountCard({
  account,
  profilePrice,
  freeCount,
  inCartCount,
  onOpen,
  onAdd,
}: IRentableAccountCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      aria-label={`Ver los perfiles de ${account.email}`}
      className={cn(
        "flex w-full cursor-pointer items-stretch gap-3 rounded-lg bg-card p-2.5 text-left shadow-card",
        "transition-[transform,box-shadow] duration-150 ease-out active:scale-[0.98]",
        inCartCount > 0 && "ring-2 ring-primary",
      )}
    >
      <ServiceAvatar
        name={account.service.name}
        imageUrl={account.service.imageUrl}
        className="size-14 rounded-md"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
        <p className="truncate font-semibold text-foreground" title={account.email}>
          {account.email}
        </p>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="font-heading font-semibold text-foreground tabular-nums">
              {profilePrice === null ? "Sin precio" : formatSoles(profilePrice)}
            </p>
            <p className={cn("text-xs font-semibold", freeCount > 0 ? "text-muted-foreground" : "text-orange")}>
              {freeCount === 1 ? "1 libre" : `${freeCount} libres`}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5">
            <span
              className={cn(
                "min-w-7 rounded-full px-2 py-1 text-center text-xs font-semibold tabular-nums",
                inCartCount > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {inCartCount}
            </span>
            <button
              type="button"
              aria-label={`Agregar un perfil de ${account.email}`}
              onClick={(event) => {
                event.stopPropagation();
                onAdd();
              }}
              className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-150 ease-out active:scale-90"
            >
              <Plus className="size-4.5" />
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
