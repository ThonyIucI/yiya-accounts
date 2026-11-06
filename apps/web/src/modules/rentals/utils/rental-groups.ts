import { roundSoles } from "@yiya/shared/money";
import type { TExpiryStatus } from "@yiya/shared/purchases";
import { type IRentalCustomer, type IRentalResource, rentalDebt } from "@yiya/shared/rentals";
import type { TBadgeColor } from "@yiya/ui/components/badge";

import { formatCompactDate } from "@/common/utils/format-date";
import { EXPIRY_COLORS, describeExpiry, expiryOf } from "@/modules/accounts/utils/expiry";

/**
 * El listado va **una fila por cliente**: el cliente es la orden y cada perfil un producto
 * (acordado 2026-10-31). La API devuelve los alquileres sueltos; acá se agrupan.
 */

/** Lo que toca cobrar, del más urgente al menos (RF-13b). Al día no tiene. */
export type TRentalDueStatus = "expired" | "debt" | "today" | "soon";

export interface IRentalDue {
  status: TRentalDueStatus;
  /** El badge es el monto (acordado 2026-11-04). */
  amount: number;
  /** La frase va en el tooltip: «Venció el 03-nov», «Debe S/ 5.00»… */
  description: string;
}

export interface ICustomerRentals {
  customer: IRentalCustomer;
  /** Ordenados por vencimiento: el primero es el más cercano. */
  rentals: IRentalResource[];
  due: IRentalDue | null;
}

const DUE_COLORS: Record<TRentalDueStatus, TBadgeColor> = {
  expired: EXPIRY_COLORS.expired,
  debt: EXPIRY_COLORS.expired,
  today: EXPIRY_COLORS.today,
  soon: EXPIRY_COLORS.soon,
};

export const dueColorOf = (status: TRentalDueStatus): TBadgeColor => DUE_COLORS[status];

/** El estado de un alquiler por su vencimiento («al día», «por vencer»…). */
export const rentalExpiryStatus = (rental: IRentalResource): TExpiryStatus =>
  expiryOf(rental.expiresOn).status;

const sumPrices = (items: IRentalResource[]): number =>
  roundSoles(items.reduce((total, item) => total + item.price, 0));

const sumDebts = (items: IRentalResource[]): number =>
  roundSoles(items.reduce((total, item) => total + rentalDebt(item), 0));

const withStatus = (items: IRentalResource[], statuses: TExpiryStatus[]) =>
  items.filter((item) => statuses.includes(rentalExpiryStatus(item)));

const debtDescription = (items: IRentalResource[]): string => {
  const promised = items
    .map((item) => item.payBy)
    .filter((date): date is string => date !== null)
    .sort()[0];
  return promised ? `Debe · prometió pagar el ${formatCompactDate(promised)}` : "Debe";
};

/**
 * Lo más urgente del cliente (RF-13b): vencido › debe › vence hoy › por vencer. El monto de
 * un vencimiento suma lo vencido y lo que vence pronto, con el último precio: es lo que se
 * le cobraría al renovar (Thony, 2026-11-01). El de la deuda es lo que falta pagar.
 */
export const dueOf = (rentals: IRentalResource[]): IRentalDue | null => {
  const [nearest] = rentals;
  if (!nearest) {
    return null;
  }
  const nearestText = describeExpiry(nearest.expiresOn, expiryOf(nearest.expiresOn));
  const owing = rentals.filter((item) => rentalDebt(item) > 0);

  const expired = withStatus(rentals, ["expired"]);
  if (expired.length > 0) {
    return {
      status: "expired",
      amount: sumPrices(withStatus(rentals, ["expired", "today", "soon"])),
      description: nearestText,
    };
  }
  if (owing.length > 0) {
    return { status: "debt", amount: sumDebts(owing), description: debtDescription(owing) };
  }
  const today = withStatus(rentals, ["today"]);
  if (today.length > 0) {
    return {
      status: "today",
      amount: sumPrices(withStatus(rentals, ["today", "soon"])),
      description: nearestText,
    };
  }
  const soon = withStatus(rentals, ["soon"]);
  if (soon.length > 0) {
    return { status: "soon", amount: sumPrices(soon), description: nearestText };
  }
  return null;
};

/** Lo próximo a cobrarle a un cliente, para la fila del celular. */
export interface IRentalNextCharge {
  amount: number;
  /** El vencimiento más cercano. */
  expiresOn: string;
  /** Pinta la fecha y el monto: la deuda va en rojo, como lo vencido; al día, neutro. */
  status: TExpiryStatus;
  description: string;
}

/**
 * **Siempre** hay un monto en la fila (Thony, 2026-11-06), no solo cuando toca cobrar: si
 * hay algo urgente es eso (`dueOf`); si está al día, lo que vence en la fecha más cercana.
 */
export const nextChargeOf = (group: ICustomerRentals): IRentalNextCharge | null => {
  const [nearest] = group.rentals;
  if (!nearest) {
    return null;
  }
  if (group.due) {
    return {
      amount: group.due.amount,
      expiresOn: nearest.expiresOn,
      status: group.due.status === "debt" ? "expired" : group.due.status,
      description: group.due.description,
    };
  }
  return {
    amount: sumPrices(group.rentals.filter((rental) => rental.expiresOn === nearest.expiresOn)),
    expiresOn: nearest.expiresOn,
    status: "ok",
    description: describeExpiry(nearest.expiresOn, expiryOf(nearest.expiresOn)),
  };
};

/**
 * Agrupa por cliente, el que vence primero arriba. `rentals` ya viene por vencimiento. Sin
 * `Map.groupBy`: celulares con un navegador de antes de 2024 no lo tienen.
 */
export const groupByCustomer = (rentals: IRentalResource[]): ICustomerRentals[] => {
  const byCustomer = new Map<string, IRentalResource[]>();
  for (const rental of rentals) {
    byCustomer.set(rental.customer.id, [...(byCustomer.get(rental.customer.id) ?? []), rental]);
  }
  return [...byCustomer.values()].map((items) => ({
    customer: items[0]!.customer,
    rentals: items,
    due: dueOf(items),
  }));
};
