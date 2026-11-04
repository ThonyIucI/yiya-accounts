import type { IAccountResource } from "@yiya/shared/accounts";
import { addMonths, daysBetween, todayInLima } from "@yiya/shared/dates";
import { roundSoles, splitAmount } from "@yiya/shared/money";

import type { IRentalItemPayload } from "@/modules/rentals/services/rental.service";
import type { TProfileHolders } from "@/modules/rentals/utils/profile-options";

/**
 * El carrito de alquilar, como el de id-pos (acordado 2026-11-04): cada línea es un perfil
 * de una cuenta, con su duración. **No lleva precio propio**: se cobra un solo total.
 */
export interface ICartLine {
  /** Solo para React: las líneas se agregan y se quitan. */
  key: string;
  accountId: string;
  profileId: string;
  startsOn: string;
  expiresOn: string;
}

/** El precio de venta de un servicio por un mes, o `null` si el negocio no lo puso. */
export type TPriceOf = (serviceId: string) => number | null;

const DAYS_PER_MONTH = 30;

let nextLineKey = 0;
const newLineKey = (): string => `line-${(nextLineKey += 1)}`;

/** Cuántos meses cubre una línea, redondeado y como mínimo uno. */
export const monthsOf = (line: Pick<ICartLine, "startsOn" | "expiresOn">): number =>
  Math.max(1, Math.round(daysBetween(line.startsOn, line.expiresOn) / DAYS_PER_MONTH));

/**
 * El perfil que se agrega al tocar la cuenta: el primero **libre** que no esté ya en el
 * carrito; si no hay libres, el primero sin usar (se comparte, RF-05). `null` si todos sus
 * perfiles ya están en el carrito.
 */
export const nextProfileOf = (
  account: IAccountResource,
  lines: ICartLine[],
  holders: TProfileHolders,
): string | null => {
  const inCart = new Set(lines.map((line) => line.profileId));
  const available = account.profiles.filter((profile) => !inCart.has(profile.id));
  const free = available.find((profile) => (holders.get(profile.id) ?? []).length === 0);
  return (free ?? available[0])?.id ?? null;
};

/** Una línea nueva: hoy y un mes. */
export const buildLine = (accountId: string, profileId: string): ICartLine => {
  const startsOn = todayInLima();
  return { key: newLineKey(), accountId, profileId, startsOn, expiresOn: addMonths(startsOn, 1) };
};

/**
 * Lo que se sugiere cobrar: el precio de venta de cada servicio por sus meses. Es solo el
 * punto de partida: el total se escribe como se acuerde con el cliente (combos y
 * promociones llegarán después).
 */
export const suggestedTotalOf = (lines: ICartLine[], serviceOf: (accountId: string) => string, priceOf: TPriceOf) =>
  roundSoles(lines.reduce((total, line) => total + (priceOf(serviceOf(line.accountId)) ?? 0) * monthsOf(line), 0));

const weightsOf = (lines: ICartLine[], serviceOf: (accountId: string) => string, priceOf: TPriceOf) =>
  lines.map((line) => (priceOf(serviceOf(line.accountId)) ?? 0) * monthsOf(line));

/** La parte del total de cada línea, en el mismo orden. Es lo que se muestra en el carrito. */
export const lineAmountsOf = (
  lines: ICartLine[],
  total: number,
  serviceOf: (accountId: string) => string,
  priceOf: TPriceOf,
): number[] => splitAmount(total, weightsOf(lines, serviceOf, priceOf));

/**
 * Lo que manda el carrito a la API. El total se reparte entre los perfiles según lo que
 * valdría cada uno (precio de venta × meses), para que cada alquiler guarde su parte: de
 * ahí salen después el margen por servicio y la renovación de cada perfil (2026-11-04). Lo
 * pagado se reparte igual.
 */
export const toRentalItems = (
  lines: ICartLine[],
  total: number,
  paid: number,
  payBy: string | null,
  serviceOf: (accountId: string) => string,
  priceOf: TPriceOf,
): IRentalItemPayload[] => {
  const weights = weightsOf(lines, serviceOf, priceOf);
  const prices = splitAmount(total, weights);
  const paidParts = paid >= total ? prices : splitAmount(paid, weights);
  return lines.map((line, index) => {
    const price = prices[index] ?? 0;
    const paidAmount = Math.min(paidParts[index] ?? 0, price);
    return {
      profileId: line.profileId,
      price,
      paidAmount,
      payBy: paidAmount < price ? payBy : null,
      startsOn: line.startsOn,
      expiresOn: line.expiresOn,
    };
  });
};
