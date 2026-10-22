import { isIsoDate } from "@yiya/shared/dates";
import { hasAtMostTwoDecimals, roundSoles } from "@yiya/shared/money";
import { EXPIRES_BEFORE_PURCHASE_MESSAGE, INVALID_DATE_MESSAGE } from "@yiya/shared/purchases";
import { z } from "zod";

/**
 * Lo que se valida de una compra de la cuenta: al registrar la cuenta (su primera compra),
 * al renovar y al corregir una. Mismos mensajes que los precios del paso 2.
 */

const priceSchema = z
  .number("Escribe el precio en números.")
  .positive("El precio debe ser mayor a S/ 0.")
  .refine(hasAtMostTwoDecimals, "El precio solo puede tener hasta 2 decimales.")
  .transform(roundSoles);

const dateSchema = z.string(INVALID_DATE_MESSAGE).refine(isIsoDate, INVALID_DATE_MESSAGE);

/* Las fechas «AAAA-MM-DD» se comparan bien como texto. */
export const isExpiryValid = (purchasedOn: string, expiresOn: string): boolean =>
  expiresOn >= purchasedOn;

export const purchaseSchema = z
  .object(
    { price: priceSchema, purchasedOn: dateSchema, expiresOn: dateSchema },
    "Completa la compra: precio, fecha de compra y vencimiento.",
  )
  .refine((body) => isExpiryValid(body.purchasedOn, body.expiresOn), {
    message: EXPIRES_BEFORE_PURCHASE_MESSAGE,
    path: ["expiresOn"],
  });

/* Al corregir, cada dato es opcional; las fechas se comparan con las guardadas en la ruta. */
export const purchasePatchSchema = z
  .object({
    price: priceSchema.optional(),
    purchasedOn: dateSchema.optional(),
    expiresOn: dateSchema.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "No hay cambios para guardar.",
  });
