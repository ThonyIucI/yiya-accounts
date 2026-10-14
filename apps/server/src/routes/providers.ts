import { createDb } from "@yiya/db";
import { streamingAccount } from "@yiya/db/schema/accounts";
import { provider } from "@yiya/db/schema/providers";
import { PHONE_MAX_DIGITS, isKnownCountryPrefix, phoneError } from "@yiya/shared/phones";
import {
  type IProviderResource,
  PROVIDER_NAME_MAX_LENGTH,
  PROVIDER_NAME_MIN_LENGTH,
  PROVIDER_NOTE_MAX_LENGTH,
  toProviderNameKey,
} from "@yiya/shared/providers";
import { and, count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { conflict, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireBusiness } from "../middleware/require-business";
import { requireAuth } from "../middleware/require-role";

export const PROVIDER_ROUTES = {
  PROVIDERS: "/providers",
  PROVIDER: "/providers/:id",
} as const;

const PROVIDER_NOT_FOUND = "No encontramos ese proveedor.";
const NO_CHANGES_MESSAGE = "No hay cambios para guardar.";
const PHONE_DIGITS_MESSAGE = "El número solo lleva dígitos.";

const nameSchema = z
  .string("Escribe el nombre del proveedor.")
  .trim()
  .min(PROVIDER_NAME_MIN_LENGTH, "El nombre del proveedor es demasiado corto.")
  .max(PROVIDER_NAME_MAX_LENGTH, "El nombre del proveedor es demasiado largo.")
  .transform((value) => value.replace(/\s+/g, " "));

/* `null` = sin teléfono. Se valida contra el país: un número de Perú no sirve con +1. */
const phoneSchema = z
  .object({
    countryPrefix: z
      .string("Elige el país del número.")
      .refine(isKnownCountryPrefix, "Elige el país del número."),
    number: z
      .string(PHONE_DIGITS_MESSAGE)
      .regex(/^\d+$/, PHONE_DIGITS_MESSAGE)
      .max(PHONE_MAX_DIGITS, "El número es demasiado largo."),
  })
  .superRefine((phone, context) => {
    const message = phoneError(phone.countryPrefix, phone.number);
    if (message) {
      context.addIssue({ code: "custom", message });
    }
  })
  .nullable();

/* Vacío o `null` = sin nota. */
const noteSchema = z
  .string("La nota debe ser texto.")
  .trim()
  .max(PROVIDER_NOTE_MAX_LENGTH, "La nota es demasiado larga.")
  .transform((value) => (value === "" ? null : value))
  .nullable();

const createProviderSchema = z.object({
  name: nameSchema,
  phone: phoneSchema.optional(),
  note: noteSchema.optional(),
});

const updateProviderSchema = z
  .object({
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
    note: noteSchema.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: NO_CHANGES_MESSAGE,
  });

type TDb = ReturnType<typeof createDb>;
type TProviderRow = typeof provider.$inferSelect;
type TPhoneInput = z.infer<typeof phoneSchema>;

const toProviderResource = (row: TProviderRow, accountCount: number): IProviderResource => ({
  id: row.id,
  name: row.name,
  phone:
    row.countryPrefix && row.phone ? { countryPrefix: row.countryPrefix, number: row.phone } : null,
  note: row.note,
  accountCount,
  createdAt: row.createdAt.toISOString(),
});

/** Proveedores del negocio con cuántas cuentas tiene cada uno. Con `id`, solo ese. */
const selectProviders = (db: TDb, businessId: string, id?: string) =>
  db
    .select({ provider, accountCount: count(streamingAccount.id) })
    .from(provider)
    .leftJoin(streamingAccount, eq(streamingAccount.providerId, provider.id))
    .where(and(eq(provider.businessId, businessId), id ? eq(provider.id, id) : undefined))
    .groupBy(provider.id)
    .orderBy(provider.nameKey);

const findProviderResource = async (db: TDb, businessId: string, id: string) => {
  const [row] = await selectProviders(db, businessId, id);
  if (!row) {
    throw notFound(PROVIDER_NOT_FOUND);
  }
  return toProviderResource(row.provider, row.accountCount);
};

const pluralizeAccounts = (total: number) => `${total} ${total === 1 ? "cuenta" : "cuentas"}`;

/* El teléfono viaja como un objeto y se guarda en dos columnas. */
const toPhoneColumns = (phone: TPhoneInput) => ({
  countryPrefix: phone?.countryPrefix ?? null,
  phone: phone?.number ?? null,
});

/** Un proveedor de **este** negocio. El de otro negocio da 404, como si no existiera. */
const findProvider = async (db: TDb, businessId: string, id: string) => {
  const row = await db
    .select()
    .from(provider)
    .where(and(eq(provider.id, id), eq(provider.businessId, businessId)))
    .get();
  if (!row) {
    throw notFound(PROVIDER_NOT_FOUND);
  }
  return row;
};

/** No puede haber dos proveedores con el mismo nombre en un negocio. */
const assertNameAvailable = async (db: TDb, businessId: string, name: string, exceptId?: string) => {
  const existing = await db
    .select({ id: provider.id, name: provider.name })
    .from(provider)
    .where(and(eq(provider.businessId, businessId), eq(provider.nameKey, toProviderNameKey(name))))
    .get();
  if (existing && existing.id !== exceptId) {
    throw conflict(`Ya tienes un proveedor llamado «${existing.name}».`);
  }
};

/**
 * Proveedores del negocio en el que se está (el del dueño o el que eligió el superadmin).
 * El negocio sale de `requireBusiness`, nunca del request.
 */
export const providerRoutes = new Hono<TAppEnv>()
  .get(PROVIDER_ROUTES.PROVIDERS, requireAuth, requireBusiness, async (context) => {
    const rows = await selectProviders(createDb(), context.var.business.id);
    return ok(
      context,
      rows.map((row) => toProviderResource(row.provider, row.accountCount)),
    );
  })

  .post(
    PROVIDER_ROUTES.PROVIDERS,
    requireAuth,
    requireBusiness,
    validateJson(createProviderSchema),
    async (context) => {
      const { name, phone, note } = context.req.valid("json");
      const businessId = context.var.business.id;
      const db = createDb();

      await assertNameAvailable(db, businessId, name);

      const [created] = await db
        .insert(provider)
        .values({
          id: newId(),
          businessId,
          name,
          nameKey: toProviderNameKey(name),
          ...toPhoneColumns(phone ?? null),
          note: note ?? null,
        })
        .returning();

      return ok(context, toProviderResource(created!, 0), 201);
    },
  )

  .patch(
    PROVIDER_ROUTES.PROVIDER,
    requireAuth,
    requireBusiness,
    validateJson(updateProviderSchema),
    async (context) => {
      const id = context.req.param("id");
      const { name, phone, note } = context.req.valid("json");
      const businessId = context.var.business.id;
      const db = createDb();

      await findProvider(db, businessId, id);
      if (name !== undefined) {
        await assertNameAvailable(db, businessId, name, id);
      }

      await db
        .update(provider)
        .set({
          ...(name !== undefined && { name, nameKey: toProviderNameKey(name) }),
          ...(phone !== undefined && toPhoneColumns(phone)),
          ...(note !== undefined && { note }),
        })
        .where(and(eq(provider.id, id), eq(provider.businessId, businessId)));

      return ok(context, await findProviderResource(db, businessId, id));
    },
  )

  /*
    Solo sin cuentas. La FK `restrict` de `streaming_account.provider_id` también lo frena,
    pero acá se responde antes con un mensaje que dice cuántas tiene y qué hacer.
  */
  .delete(PROVIDER_ROUTES.PROVIDER, requireAuth, requireBusiness, async (context) => {
    const id = context.req.param("id");
    const businessId = context.var.business.id;
    const db = createDb();

    const current = await findProviderResource(db, businessId, id);
    if (current.accountCount > 0) {
      throw conflict(
        `No puedes eliminar a «${current.name}»: tiene ${pluralizeAccounts(current.accountCount)}. Cámbiales el proveedor o elimínalas primero.`,
      );
    }
    await db.delete(provider).where(and(eq(provider.id, id), eq(provider.businessId, businessId)));

    return ok(context, { id });
  });
