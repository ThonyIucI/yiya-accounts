import { addMonths, isIsoDate, todayInLima } from "@yiya/shared/dates";
import { INVALID_SOLES_MESSAGE, parseSoles, roundSoles, toSolesInput } from "@yiya/shared/money";
import { INVALID_DATE_MESSAGE } from "@yiya/shared/purchases";
import {
  type IRentalResource,
  RENTAL_EXPIRES_BEFORE_START_MESSAGE,
  RENTAL_INVALID_PAID_MESSAGE,
  RENTAL_PAID_OVER_PRICE_MESSAGE,
} from "@yiya/shared/rentals";

import type { IRentalItemPayload } from "@/modules/rentals/services/rental.service";

/** Cuánto dura un alquiler si no se cambia: un mes (RF-02). */
export const DEFAULT_RENTAL_MONTHS = 1;
/** Los atajos del vencimiento (RF-02). Cualquier otra fecha se escribe a mano. */
export const RENTAL_MONTH_SHORTCUTS = [1, 3, 6, 12] as const;

/**
 * Un perfil del formulario de alquilar, como se escribe: texto. `key` es solo para React
 * (las filas se agregan y se quitan).
 */
export interface IRentalItemValues {
  key: string;
  serviceId: string;
  profileId: string;
  price: string;
  paidAmount: string;
  payBy: string;
  startsOn: string;
  expiresOn: string;
}

export type TRentalItemErrors = Partial<Record<keyof IRentalItemValues, string>>;

/* «0» es válido en lo pagado (alquiló sin pagar); `parseSoles` lo da como `null`. */
const parsePaid = (input: string): number | null => (/^0+([.,]0{1,2})?$/.test(input.trim()) ? 0 : parseSoles(input));

/** Uno nuevo: hoy, un mes, el precio de venta del servicio y pagado completo. */
export const buildItemValues = (serviceId = "", price: number | null = null): IRentalItemValues => {
  const startsOn = todayInLima();
  return {
    key: crypto.randomUUID(),
    serviceId,
    profileId: "",
    price: toSolesInput(price),
    paidAmount: toSolesInput(price),
    payBy: "",
    startsOn,
    expiresOn: addMonths(startsOn, DEFAULT_RENTAL_MONTHS),
  };
};

/** Editar: lo guardado, tal cual. */
export const toItemValues = (rental: IRentalResource): IRentalItemValues => ({
  key: rental.id,
  serviceId: rental.service.id,
  profileId: rental.profile.id,
  price: toSolesInput(rental.price),
  paidAmount: rental.paidAmount === 0 ? "0" : toSolesInput(rental.paidAmount),
  payBy: rental.payBy ?? "",
  startsOn: rental.startsOn,
  expiresOn: rental.expiresOn,
});

/** Si queda debiendo: ahí se pide la fecha prometida (RF-07c). */
export const isOwing = (values: IRentalItemValues): boolean => {
  const price = parseSoles(values.price);
  const paid = parsePaid(values.paidAmount);
  return price !== null && paid !== null && paid < price;
};

/** Mismas reglas que el server, para avisar antes de mandar. `undefined` = sin errores. */
export const validateItemValues = (values: IRentalItemValues): TRentalItemErrors | undefined => {
  const errors: TRentalItemErrors = {};
  if (!values.serviceId) {
    errors.serviceId = "Elige el servicio";
  }
  if (!values.profileId) {
    errors.profileId = "Elige el perfil";
  }
  const price = parseSoles(values.price);
  if (price === null) {
    errors.price = INVALID_SOLES_MESSAGE;
  }
  const paid = parsePaid(values.paidAmount);
  if (paid === null) {
    errors.paidAmount = RENTAL_INVALID_PAID_MESSAGE;
  } else if (price !== null && paid > price) {
    errors.paidAmount = RENTAL_PAID_OVER_PRICE_MESSAGE;
  }
  if (values.payBy && !isIsoDate(values.payBy)) {
    errors.payBy = INVALID_DATE_MESSAGE;
  }
  if (!isIsoDate(values.startsOn)) {
    errors.startsOn = INVALID_DATE_MESSAGE;
  }
  if (!isIsoDate(values.expiresOn)) {
    errors.expiresOn = INVALID_DATE_MESSAGE;
  } else if (isIsoDate(values.startsOn) && values.expiresOn < values.startsOn) {
    errors.expiresOn = RENTAL_EXPIRES_BEFORE_START_MESSAGE;
  }
  return Object.keys(errors).length > 0 ? errors : undefined;
};

/** Ya validado: los números no son `null`. */
export const toItemPayload = (values: IRentalItemValues): IRentalItemPayload => ({
  profileId: values.profileId,
  price: parseSoles(values.price) ?? 0,
  paidAmount: parsePaid(values.paidAmount) ?? 0,
  payBy: isOwing(values) && values.payBy ? values.payBy : null,
  startsOn: values.startsOn,
  expiresOn: values.expiresOn,
});

/** El total de lo que se está alquilando, para el pie de la modal. Un precio sin llenar suma 0. */
export const totalOf = (items: IRentalItemValues[]): number =>
  roundSoles(items.reduce((total, item) => total + (parseSoles(item.price) ?? 0), 0));
