import { isIsoDate } from "@yiya/shared/dates";
import { INVALID_SOLES_MESSAGE, parseSoles, toSolesInput } from "@yiya/shared/money";
import { INVALID_DATE_MESSAGE } from "@yiya/shared/purchases";
import {
  RENTAL_INVALID_PAID_MESSAGE,
  RENTAL_MAX_ITEMS,
  RENTAL_NO_ITEMS_MESSAGE,
  RENTAL_PAID_OVER_PRICE_MESSAGE,
} from "@yiya/shared/rentals";
import { useState } from "react";

import type { IRentalItemPayload } from "@/modules/rentals/services/rental.service";
import {
  type ICartLine,
  type TPriceOf,
  lineAmountsOf,
  suggestedTotalOf,
  toRentalItems,
} from "@/modules/rentals/utils/rental-cart";
import { parsePaid } from "@/modules/rentals/utils/rental-form";

export interface IRentalCartErrors {
  lines?: string;
  total?: string;
  paid?: string;
  payBy?: string;
}

/**
 * El estado del carrito de alquilar: las líneas, **un** total y lo pagado. El total sigue al
 * sugerido (precio de venta × meses) hasta que se escribe a mano; desde ahí queda el escrito
 * (acordado 2026-11-04). Es estado de pantalla, no una petición.
 */
export const useRentalCart = (serviceOf: (accountId: string) => string, priceOf: TPriceOf) => {
  const [lines, setLines] = useState<ICartLine[]>([]);
  const [typedTotal, setTypedTotal] = useState<string | null>(null);
  const [isPaidFull, setIsPaidFull] = useState(true);
  const [paidInput, setPaidInput] = useState("");
  const [payBy, setPayBy] = useState("");
  const [errors, setErrors] = useState<IRentalCartErrors>({});

  const suggestedTotal = suggestedTotalOf(lines, serviceOf, priceOf);
  const totalInput = typedTotal ?? (suggestedTotal > 0 ? toSolesInput(suggestedTotal) : "");
  /* Lo que le toca a cada línea del total escrito: suman siempre el total (RF-02a). */
  const lineAmounts = lineAmountsOf(lines, parseSoles(totalInput) ?? 0, serviceOf, priceOf);

  /** `false` si se pasaría del tope de perfiles por alquiler. */
  const addLines = (added: ICartLine[]): boolean => {
    if (lines.length + added.length > RENTAL_MAX_ITEMS) {
      return false;
    }
    setLines((previous) => [...previous, ...added]);
    setErrors((previous) => ({ ...previous, lines: undefined }));
    return true;
  };

  const changeLine = (next: ICartLine) =>
    setLines((previous) => previous.map((line) => (line.key === next.key ? next : line)));

  const removeLine = (key: string) => setLines((previous) => previous.filter((line) => line.key !== key));

  const clear = () => {
    setLines([]);
    setTypedTotal(null);
    setIsPaidFull(true);
    setPaidInput("");
    setPayBy("");
    setErrors({});
  };

  /** Mismas reglas que el server. Válido → lo que se manda; si no, `null` y los errores. */
  const validate = (): IRentalItemPayload[] | null => {
    const nextErrors: IRentalCartErrors = {};
    if (lines.length === 0) {
      nextErrors.lines = RENTAL_NO_ITEMS_MESSAGE;
    }
    const total = parseSoles(totalInput);
    if (total === null) {
      nextErrors.total = INVALID_SOLES_MESSAGE;
    }
    const paid = isPaidFull ? total : parsePaid(paidInput);
    if (paid === null && !isPaidFull) {
      nextErrors.paid = RENTAL_INVALID_PAID_MESSAGE;
    } else if (total !== null && paid !== null && paid > total) {
      nextErrors.paid = RENTAL_PAID_OVER_PRICE_MESSAGE;
    }
    if (!isPaidFull && payBy && !isIsoDate(payBy)) {
      nextErrors.payBy = INVALID_DATE_MESSAGE;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || total === null || paid === null) {
      return null;
    }
    return toRentalItems(lines, total, paid, isPaidFull ? null : payBy || null, serviceOf, priceOf);
  };

  return {
    lines,
    lineAmounts,
    addLines,
    changeLine,
    removeLine,
    clear,
    suggestedTotal,
    totalInput,
    isTotalTyped: typedTotal !== null,
    setTotal: (value: string) => setTypedTotal(value),
    resetTotal: () => setTypedTotal(null),
    isPaidFull,
    setIsPaidFull,
    paidInput,
    setPaidInput,
    payBy,
    setPayBy,
    errors,
    validate,
  };
};

export type TRentalCart = ReturnType<typeof useRentalCart>;
