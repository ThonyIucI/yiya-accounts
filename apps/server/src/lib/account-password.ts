import { env } from "@yiya/env/server";

import { AppError } from "./errors";

/**
 * Cifrado de las contraseñas de las cuentas: AES-GCM de 256 bits con Web Crypto (lo trae
 * el runtime de Workers) y un IV aleatorio por contraseña. Se guarda «v1:iv:cifrado» en
 * base64. El `v1` dice con qué llave se cifró: si algún día se cambia la llave, las viejas
 * se siguen leyendo con la suya.
 *
 * La llave es el secret `ACCOUNT_PASSWORD_KEY` (32 bytes en base64). Nunca va en el repo.
 */

const VERSION = "v1";
const ALGORITHM = "AES-GCM";
const KEY_BYTES = 32;
const IV_BYTES = 12;

/* Mensaje para el usuario; el detalle técnico va solo al log, y nunca la contraseña. */
const UNREADABLE_MESSAGE = "No pudimos leer la contraseña. Avísale a soporte.";

const toBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes));

const fromBase64 = (text: string): Uint8Array =>
  Uint8Array.from(atob(text), (character) => character.charCodeAt(0));

const importKey = async (): Promise<CryptoKey> => {
  const raw = env.ACCOUNT_PASSWORD_KEY ? fromBase64(env.ACCOUNT_PASSWORD_KEY) : new Uint8Array();
  if (raw.length !== KEY_BYTES) {
    console.error("ACCOUNT_PASSWORD_KEY falta o no tiene 32 bytes en base64.");
    throw new AppError(500, UNREADABLE_MESSAGE);
  }
  return crypto.subtle.importKey("raw", raw, ALGORITHM, false, ["encrypt", "decrypt"]);
};

export const encryptPassword = async (password: string): Promise<string> => {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    new TextEncoder().encode(password),
  );
  return `${VERSION}:${toBase64(iv)}:${toBase64(new Uint8Array(encrypted))}`;
};

export const decryptPassword = async (stored: string): Promise<string> => {
  const [version, iv, encrypted] = stored.split(":");
  if (version !== VERSION || !iv || !encrypted) {
    console.error("Contraseña guardada con un formato desconocido.");
    throw new AppError(500, UNREADABLE_MESSAGE);
  }

  const key = await importKey();
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv: fromBase64(iv) },
      key,
      fromBase64(encrypted),
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    console.error("No se pudo descifrar una contraseña: ¿cambió ACCOUNT_PASSWORD_KEY?");
    throw new AppError(500, UNREADABLE_MESSAGE);
  }
};
