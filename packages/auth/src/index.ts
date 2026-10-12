import { createDb } from "@yiya/db";
import * as schema from "@yiya/db/schema/auth";
import { env } from "@yiya/env/server";
import { EUserRole } from "@yiya/shared/roles";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const DAY_IN_SECONDS = 60 * 60 * 24;
const MIN_PASSWORD_LENGTH = 8;

/**
 * La sesión caduca a los 7 días **sin usarla**: `updateAge` la renueva como mucho una vez
 * al día mientras el usuario entre.
 */
const SESSION_DAYS = 7;
const LOGIN_MAX_ATTEMPTS_PER_MINUTE = 10;

/** `CORS_ORIGIN` admite varios orígenes separados por coma. */
export const getTrustedOrigins = (): string[] =>
  env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

/**
 * Si el front y la API viven en sitios distintos (pages.dev / workers.dev) la cookie debe ser
 * SameSite=None + Secure. En dev (http://) el navegador rechaza `Secure`, y como Vite hace
 * proxy al mismo origen basta con Lax. Se decide por el esquema de BETTER_AUTH_URL.
 */
const isSecureDeployment = (): boolean => env.BETTER_AUTH_URL.startsWith("https://");

/**
 * Instancia de better-auth. Se crea por request porque `env` (D1, secrets) solo existe
 * dentro del Worker en ejecución. Todos entran con correo + contraseña.
 */
export function createAuth() {
  const db = createDb();
  const secure = isSecureDeployment();

  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: getTrustedOrigins(),

    emailAndPassword: { enabled: true, minPasswordLength: MIN_PASSWORD_LENGTH },

    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: EUserRole.USER,
          input: false, // el cliente nunca puede enviar/alterar su rol
        },
      },
    },

    session: {
      expiresIn: SESSION_DAYS * DAY_IN_SECONDS,
      updateAge: DAY_IN_SECONDS,
    },

    /*
      El contador vive en un `Map` de módulo: es por isolate, no global. Frena el tanteo de
      contraseñas desde un navegador, no un ataque repartido (para eso, regla WAF).
    */
    rateLimit: {
      enabled: env.DISABLE_RATE_LIMIT !== "true",
      customRules: {
        "/sign-in/email": { window: 60, max: LOGIN_MAX_ATTEMPTS_PER_MINUTE },
      },
    },

    advanced: {
      useSecureCookies: secure,
      defaultCookieAttributes: {
        sameSite: secure ? "none" : "lax",
        secure,
        httpOnly: true,
      },
    },
  });
}

export type TAuth = ReturnType<typeof createAuth>;
export type TSession = TAuth["$Infer"]["Session"];
export type TSessionUser = TSession["user"];
