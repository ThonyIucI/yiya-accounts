import type { IAccountResource } from "@yiya/shared/accounts";
import { addMonths, isIsoDate, todayInLima } from "@yiya/shared/dates";
import { INVALID_SOLES_MESSAGE, parseSoles, toSolesInput } from "@yiya/shared/money";
import {
  DEFAULT_PURCHASE_MONTHS,
  EXPIRES_BEFORE_PURCHASE_MESSAGE,
  INVALID_DATE_MESSAGE,
  type IPurchaseResource,
  accountExpiresOn,
} from "@yiya/shared/purchases";

import type { IPurchasePayload } from "@/modules/accounts/services/account.service";

/**
 * Los tres campos de una compra (precio, fecha de compra y vencimiento) como los guardan
 * los formularios: texto, tal cual se escribe. Los usan «Nueva cuenta» (su primera compra) y
 * la modal de renovar o corregir una compra.
 */
export interface IPurchaseFormValues {
  price: string;
  purchasedOn: string;
  expiresOn: string;
}

export type TPurchaseFormErrors = Partial<Record<keyof IPurchaseFormValues, string>>;

/** Precio y fecha de compra dados; el vencimiento, un mes después (RF-15c). */
export const buildPurchaseValues = (price: number | null, purchasedOn: string): IPurchaseFormValues => ({
  price: toSolesInput(price),
  purchasedOn,
  expiresOn: addMonths(purchasedOn, DEFAULT_PURCHASE_MONTHS),
});

/** Primera compra: el precio referencial del servicio y hoy. */
export const buildFirstPurchaseValues = (referencePrice: number | null): IPurchaseFormValues =>
  buildPurchaseValues(referencePrice, todayInLima());

/**
 * Renovar: el precio de la compra anterior y, como fecha, el vencimiento anterior (RF-15b,
 * RF-15c). Una cuenta sin compras (registrada antes de que existieran) arranca como la
 * primera: con el referencial y hoy.
 */
export const buildRenewalValues = (
  account: IAccountResource,
  referencePrice: number | null,
): IPurchaseFormValues => {
  const [latest] = account.purchases;
  const expiresOn = accountExpiresOn(account.purchases);
  return latest && expiresOn
    ? buildPurchaseValues(latest.price, expiresOn)
    : buildFirstPurchaseValues(referencePrice);
};

/** Corregir: lo guardado, tal cual. */
export const toPurchaseValues = (purchase: IPurchaseResource): IPurchaseFormValues => ({
  price: toSolesInput(purchase.price),
  purchasedOn: purchase.purchasedOn,
  expiresOn: purchase.expiresOn,
});

/** Mismas reglas que el server, para avisar antes de mandar. `undefined` = sin errores. */
export const validatePurchaseValues = (values: IPurchaseFormValues): TPurchaseFormErrors | undefined => {
  const errors: TPurchaseFormErrors = {};
  if (parseSoles(values.price) === null) {
    errors.price = INVALID_SOLES_MESSAGE;
  }
  if (!isIsoDate(values.purchasedOn)) {
    errors.purchasedOn = INVALID_DATE_MESSAGE;
  }
  if (!isIsoDate(values.expiresOn)) {
    errors.expiresOn = INVALID_DATE_MESSAGE;
  } else if (isIsoDate(values.purchasedOn) && values.expiresOn < values.purchasedOn) {
    errors.expiresOn = EXPIRES_BEFORE_PURCHASE_MESSAGE;
  }
  return Object.keys(errors).length > 0 ? errors : undefined;
};

/** Ya validado: el precio no es `null`. */
export const toPurchasePayload = (values: IPurchaseFormValues): IPurchasePayload => ({
  price: parseSoles(values.price) ?? 0,
  purchasedOn: values.purchasedOn,
  expiresOn: values.expiresOn,
});
