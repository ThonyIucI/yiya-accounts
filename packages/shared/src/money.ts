/**
 * Dinero en **soles con dos decimales** (acordado 2026-10-12): `7.50` se escribe, se guarda
 * y se muestra igual. Nada de céntimos. Lo usan el front y el server.
 */

const DECIMALS_FACTOR = 100;
/* Margen para comparar decimales en coma flotante (7.55 * 100 = 754.9999…). */
const FLOAT_TOLERANCE = 1e-6;

/** «7», «7.5» o «7,50»: dígitos y, opcional, hasta dos decimales con punto o coma. */
const SOLES_PATTERN = /^\d+([.,]\d{1,2})?$/;

export const INVALID_SOLES_MESSAGE =
  "Escribe un precio mayor a 0, con hasta 2 decimales (por ejemplo, 7.50).";

/** Redondea a céntimo: lo guardado y las sumas mostradas nunca arrastran `0.1 + 0.2`. */
export const roundSoles = (value: number): number =>
  Math.round(value * DECIMALS_FACTOR) / DECIMALS_FACTOR;

/** Si el número no tiene más de dos decimales. */
export const hasAtMostTwoDecimals = (value: number): boolean => {
  const scaled = value * DECIMALS_FACTOR;
  return Math.abs(Math.round(scaled) - scaled) < FLOAT_TOLERANCE;
};

/** Lo que escribió la persona → soles. `null` si está vacío, no es un precio o es 0. */
export const parseSoles = (input: string): number | null => {
  const text = input.trim();
  if (!SOLES_PATTERN.test(text)) {
    return null;
  }
  const value = Number(text.replace(",", "."));
  return value > 0 ? roundSoles(value) : null;
};

/**
 * Reparte un monto entre partes según su peso, en céntimos exactos: la suma de las partes da
 * siempre el monto (lo que sobra por redondeo va a la última). Con todos los pesos en 0, en
 * partes iguales. Lo usa el carrito de alquilar: se cobra **un** total y cada perfil guarda
 * su parte (acordado 2026-11-04).
 */
export const splitAmount = (amount: number, weights: number[]): number[] => {
  if (weights.length === 0) {
    return [];
  }
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const shares = totalWeight > 0 ? weights.map((weight) => weight / totalWeight) : weights.map(() => 1 / weights.length);
  const cents = Math.round(amount * DECIMALS_FACTOR);
  const parts = shares.map((share) => Math.floor(cents * share));
  const remainder = cents - parts.reduce((sum, part) => sum + part, 0);
  const lastIndex = parts.length - 1;
  return parts.map((part, index) => (index === lastIndex ? part + remainder : part) / DECIMALS_FACTOR);
};

/** `7.5` → «S/ 7.50». */
export const formatSoles = (value: number): string => `S/ ${roundSoles(value).toFixed(2)}`;

/** `7.5` → «7.50», para dejarlo en un campo editable. */
export const toSolesInput = (value: number | null): string =>
  value === null ? "" : roundSoles(value).toFixed(2);
