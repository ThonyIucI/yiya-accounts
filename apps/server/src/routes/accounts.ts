import { createDb } from "@yiya/db";
import { accountPurchase, profile, streamingAccount } from "@yiya/db/schema/accounts";
import { provider } from "@yiya/db/schema/providers";
import { businessService, service } from "@yiya/db/schema/services";
import {
  ACCOUNT_EMAIL_MAX_LENGTH,
  ACCOUNT_MAX_PROFILES,
  ACCOUNT_MIN_PROFILES,
  ACCOUNT_NOTE_MAX_LENGTH,
  ACCOUNT_PASSWORD_MAX_LENGTH,
  defaultProfileName,
  toAccountEmailKey,
} from "@yiya/shared/accounts";
import { and, eq, max } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { decryptPassword, encryptPassword } from "../lib/account-password";
import { type TDb, findAccount, findAccountRow, listAccounts } from "../lib/account-queries";
import type { TAppEnv } from "../lib/app-env";
import { badRequest, conflict, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { purchaseSchema } from "../lib/purchase-input";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireBusiness } from "../middleware/require-business";
import { requireAuth } from "../middleware/require-role";

export const ACCOUNT_ROUTES = {
  ACCOUNTS: "/accounts",
  ACCOUNT: "/accounts/:id",
  PASSWORD: "/accounts/:id/password",
  PROFILES: "/accounts/:id/profiles",
} as const;

const SERVICE_NOT_FOUND = "No encontramos ese servicio.";
const PROVIDER_NOT_FOUND = "No encontramos ese proveedor.";
const NO_CHANGES_MESSAGE = "No hay cambios para guardar.";
const PROFILES_MESSAGE = "La cuenta necesita al menos un perfil.";
const PASSWORD_MESSAGE = "Escribe la contraseña.";

const emailSchema = z
  .string("Escribe el correo de la cuenta.")
  .trim()
  .max(ACCOUNT_EMAIL_MAX_LENGTH, "El correo es demasiado largo.")
  .pipe(z.email("Escribe un correo válido."));

/* Sin `trim`: la contraseña se guarda tal cual la da el proveedor. */
const passwordSchema = z
  .string(PASSWORD_MESSAGE)
  .min(1, PASSWORD_MESSAGE)
  .max(ACCOUNT_PASSWORD_MAX_LENGTH, "La contraseña es demasiado larga.");

/* Vacío o `null` = sin nota. */
const noteSchema = z
  .string("La nota debe ser texto.")
  .trim()
  .max(ACCOUNT_NOTE_MAX_LENGTH, "La nota es demasiado larga.")
  .transform((value) => (value === "" ? null : value))
  .nullable();

const createAccountSchema = z.object({
  serviceId: z.string("Elige el servicio."),
  providerId: z.string("Elige el proveedor."),
  email: emailSchema,
  password: passwordSchema,
  profileCount: z
    .number(PROFILES_MESSAGE)
    .int(PROFILES_MESSAGE)
    .min(ACCOUNT_MIN_PROFILES, PROFILES_MESSAGE)
    .max(ACCOUNT_MAX_PROFILES, `Una cuenta puede tener hasta ${ACCOUNT_MAX_PROFILES} perfiles.`),
  note: noteSchema.optional(),
  /* No hay cuenta sin compra (RF-08): la primera va en el mismo formulario. */
  purchase: purchaseSchema,
});

/* El servicio no se cambia: los perfiles dependen de él. */
const updateAccountSchema = z
  .object({
    providerId: z.string("Elige el proveedor.").optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    note: noteSchema.optional(),
    isActive: z.boolean("Indica si la cuenta está activa.").optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: NO_CHANGES_MESSAGE,
  });

/** Solo se registran cuentas de servicios activos en el negocio. */
const assertServiceActive = async (db: TDb, businessId: string, serviceId: string) => {
  const row = await db
    .select({ name: service.name, isActive: businessService.isActive })
    .from(service)
    .leftJoin(
      businessService,
      and(eq(businessService.serviceId, service.id), eq(businessService.businessId, businessId)),
    )
    .where(eq(service.id, serviceId))
    .get();
  if (!row) {
    throw notFound(SERVICE_NOT_FOUND);
  }
  if (!row.isActive) {
    throw badRequest(`Activa ${row.name} en Servicios para registrar cuentas.`);
  }
  return row.name;
};

/** El proveedor tiene que ser de este negocio. El de otro da 404, como si no existiera. */
const assertProviderOfBusiness = async (db: TDb, businessId: string, providerId: string) => {
  const row = await db
    .select({ id: provider.id })
    .from(provider)
    .where(and(eq(provider.id, providerId), eq(provider.businessId, businessId)))
    .get();
  if (!row) {
    throw notFound(PROVIDER_NOT_FOUND);
  }
};

/** La misma cuenta de un servicio, una sola vez por negocio. */
const assertEmailAvailable = async (
  db: TDb,
  scope: { businessId: string; serviceId: string; serviceName: string },
  email: string,
  exceptId?: string,
) => {
  const existing = await db
    .select({ id: streamingAccount.id })
    .from(streamingAccount)
    .where(
      and(
        eq(streamingAccount.businessId, scope.businessId),
        eq(streamingAccount.serviceId, scope.serviceId),
        eq(streamingAccount.emailKey, toAccountEmailKey(email)),
      ),
    )
    .get();
  if (existing && existing.id !== exceptId) {
    throw conflict(`Ya tienes una cuenta de ${scope.serviceName} con ese correo.`);
  }
};

/**
 * Cuentas del negocio en el que se está. El negocio sale de `requireBusiness`, nunca del
 * request. La contraseña **solo** sale por `/accounts/:id/password`.
 */
export const accountRoutes = new Hono<TAppEnv>()
  .get(ACCOUNT_ROUTES.ACCOUNTS, requireAuth, requireBusiness, async (context) => {
    return ok(context, await listAccounts(createDb(), context.var.business.id));
  })

  .post(
    ACCOUNT_ROUTES.ACCOUNTS,
    requireAuth,
    requireBusiness,
    validateJson(createAccountSchema),
    async (context) => {
      const { serviceId, providerId, email, password, profileCount, note, purchase } =
        context.req.valid("json");
      const businessId = context.var.business.id;
      const db = createDb();

      const serviceName = await assertServiceActive(db, businessId, serviceId);
      await assertProviderOfBusiness(db, businessId, providerId);
      await assertEmailAvailable(db, { businessId, serviceId, serviceName }, email);

      const accountId = newId();
      const insertAccount = db.insert(streamingAccount).values({
        id: accountId,
        businessId,
        serviceId,
        providerId,
        email,
        emailKey: toAccountEmailKey(email),
        passwordEncrypted: await encryptPassword(password),
        note: note ?? null,
      });
      /*
        Un insert por perfil y no uno de varias filas: D1 acepta como mucho 100 parámetros
        por consulta, y cada perfil lleva 5.
      */
      const insertProfiles = Array.from({ length: profileCount }, (_, index) =>
        db.insert(profile).values({
          id: newId(),
          businessId,
          accountId,
          name: defaultProfileName(index + 1),
          position: index + 1,
        }),
      );
      const insertPurchase = db.insert(accountPurchase).values({
        id: newId(),
        businessId,
        accountId,
        ...purchase,
      });
      await db.batch([insertAccount, insertPurchase, ...insertProfiles]);

      return ok(context, await findAccount(db, businessId, accountId), 201);
    },
  )

  .get(ACCOUNT_ROUTES.ACCOUNT, requireAuth, requireBusiness, async (context) => {
    return ok(
      context,
      await findAccount(createDb(), context.var.business.id, context.req.param("id")),
    );
  })

  /* La pide el ojo o el botón de copiar del detalle. */
  .get(ACCOUNT_ROUTES.PASSWORD, requireAuth, requireBusiness, async (context) => {
    const row = await findAccountRow(createDb(), context.var.business.id, context.req.param("id"));
    return ok(context, { password: await decryptPassword(row.passwordEncrypted) });
  })

  .patch(
    ACCOUNT_ROUTES.ACCOUNT,
    requireAuth,
    requireBusiness,
    validateJson(updateAccountSchema),
    async (context) => {
      const id = context.req.param("id");
      const { providerId, email, password, note, isActive } = context.req.valid("json");
      const businessId = context.var.business.id;
      const db = createDb();

      const current = await findAccountRow(db, businessId, id);
      if (providerId !== undefined) {
        await assertProviderOfBusiness(db, businessId, providerId);
      }
      if (email !== undefined) {
        const serviceRow = await db
          .select({ name: service.name })
          .from(service)
          .where(eq(service.id, current.serviceId))
          .get();
        await assertEmailAvailable(
          db,
          { businessId, serviceId: current.serviceId, serviceName: serviceRow?.name ?? "ese servicio" },
          email,
          id,
        );
      }

      await db
        .update(streamingAccount)
        .set({
          ...(providerId !== undefined && { providerId }),
          ...(email !== undefined && { email, emailKey: toAccountEmailKey(email) }),
          ...(password !== undefined && { passwordEncrypted: await encryptPassword(password) }),
          ...(note !== undefined && { note }),
          ...(isActive !== undefined && { isActive }),
        })
        .where(and(eq(streamingAccount.id, id), eq(streamingAccount.businessId, businessId)));

      return ok(context, await findAccount(db, businessId, id));
    },
  )

  /* Sus perfiles y sus compras se van con ella (FK `cascade`). Desde el paso 4, no si hay alquileres. */
  .delete(ACCOUNT_ROUTES.ACCOUNT, requireAuth, requireBusiness, async (context) => {
    const id = context.req.param("id");
    const businessId = context.var.business.id;
    const db = createDb();

    await findAccountRow(db, businessId, id);
    await db
      .delete(streamingAccount)
      .where(and(eq(streamingAccount.id, id), eq(streamingAccount.businessId, businessId)));

    return ok(context, { id });
  })

  /* Agrega «Perfil N+1» al final. */
  .post(ACCOUNT_ROUTES.PROFILES, requireAuth, requireBusiness, async (context) => {
    const accountId = context.req.param("id");
    const businessId = context.var.business.id;
    const db = createDb();

    await findAccountRow(db, businessId, accountId);
    const last = await db
      .select({ position: max(profile.position) })
      .from(profile)
      .where(eq(profile.accountId, accountId))
      .get();
    const position = (last?.position ?? 0) + 1;

    await db.insert(profile).values({
      id: newId(),
      businessId,
      accountId,
      name: defaultProfileName(position),
      position,
    });

    return ok(context, await findAccount(db, businessId, accountId), 201);
  });
