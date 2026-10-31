import { createDb } from "@yiya/db";
import { customers } from "@yiya/db/schema/customers";
import {
  CUSTOMER_NAME_LENGTH_MESSAGE,
  CUSTOMER_NAME_MAX_LENGTH,
  CUSTOMER_NAME_MIN_LENGTH,
  CUSTOMER_NOTE_LENGTH_MESSAGE,
  CUSTOMER_NOTE_MAX_LENGTH,
  type ICustomerResource,
} from "@yiya/shared/customers";
import {
  WHATSAPP_USERNAME_INVALID_MESSAGE,
  isValidWhatsAppUsername,
  toWhatsAppUsername,
} from "@yiya/shared/whatsapp";
import { and, asc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { conflict, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { type TPhoneInput, phoneSchema, toPhoneColumns, toPhoneResource } from "../lib/phone-input";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireBusiness } from "../middleware/require-business";
import { requireAuth } from "../middleware/require-role";

export const CUSTOMER_ROUTES = {
  CUSTOMERS: "/customers",
  CUSTOMER: "/customers/:id",
} as const;

const CUSTOMER_NOT_FOUND = "No encontramos ese cliente.";
const NO_CHANGES_MESSAGE = "No hay cambios para guardar.";

const nameSchema = z
  .string("Escribe el nombre del cliente.")
  .trim()
  .min(CUSTOMER_NAME_MIN_LENGTH, CUSTOMER_NAME_LENGTH_MESSAGE)
  .max(CUSTOMER_NAME_MAX_LENGTH, CUSTOMER_NAME_LENGTH_MESSAGE)
  .transform((value) => value.replace(/\s+/g, " "));

/* Con o sin «@»; se guarda sin ella. Vacío o `null` = sin usuario. */
const whatsappUsernameSchema = z
  .string(WHATSAPP_USERNAME_INVALID_MESSAGE)
  .transform(toWhatsAppUsername)
  .refine((value) => value === "" || isValidWhatsAppUsername(value), WHATSAPP_USERNAME_INVALID_MESSAGE)
  .transform((value) => (value === "" ? null : value))
  .nullable();

/* Vacío o `null` = sin nota. */
const noteSchema = z
  .string("La nota debe ser texto.")
  .trim()
  .max(CUSTOMER_NOTE_MAX_LENGTH, CUSTOMER_NOTE_LENGTH_MESSAGE)
  .transform((value) => (value === "" ? null : value))
  .nullable();

const createCustomerSchema = z.object({
  name: nameSchema,
  phone: phoneSchema.optional(),
  whatsappUsername: whatsappUsernameSchema.optional(),
  note: noteSchema.optional(),
});

const updateCustomerSchema = z
  .object({
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
    whatsappUsername: whatsappUsernameSchema.optional(),
    note: noteSchema.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: NO_CHANGES_MESSAGE,
  });

type TDb = ReturnType<typeof createDb>;
type TCustomerRow = typeof customers.$inferSelect;

const toCustomerResource = (row: TCustomerRow): ICustomerResource => ({
  id: row.id,
  name: row.name,
  phone: toPhoneResource(row),
  whatsappUsername: row.whatsappUsername,
  note: row.note,
  createdAt: row.createdAt.toISOString(),
});

/** Un cliente de **este** negocio. El de otro negocio da 404, como si no existiera. */
const findCustomer = async (db: TDb, businessId: string, id: string) => {
  const row = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.businessId, businessId)))
    .get();
  if (!row) {
    throw notFound(CUSTOMER_NOT_FOUND);
  }
  return row;
};

/*
  El índice único también lo frena, pero acá se responde antes con el nombre del cliente
  que ya lo tiene. `exceptId`: al editar, el mismo cliente no choca consigo.
*/
const assertPhoneAvailable = async (
  db: TDb,
  businessId: string,
  phone: TPhoneInput,
  exceptId?: string,
) => {
  if (!phone) {
    return;
  }
  const existing = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(
      and(
        eq(customers.businessId, businessId),
        eq(customers.countryPrefix, phone.countryPrefix),
        eq(customers.phone, phone.number),
      ),
    )
    .get();
  if (existing && existing.id !== exceptId) {
    throw conflict(`Ya tienes a «${existing.name}» con ese número.`);
  }
};

/* Sin mayúsculas, con la misma expresión del índice único. */
const assertUsernameAvailable = async (
  db: TDb,
  businessId: string,
  username: string | null,
  exceptId?: string,
) => {
  if (!username) {
    return;
  }
  const existing = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(
      and(
        eq(customers.businessId, businessId),
        sql`lower(${customers.whatsappUsername}) = ${username.toLowerCase()}`,
      ),
    )
    .get();
  if (existing && existing.id !== exceptId) {
    throw conflict(`Ya tienes a «${existing.name}» con ese usuario.`);
  }
};

/**
 * Clientes del negocio en el que se está (el del dueño o el que eligió el superadmin).
 * El negocio sale de `requireBusiness`, nunca del request. Ver docs/planes/04a-clientes.md.
 */
export const customerRoutes = new Hono<TAppEnv>()
  .get(CUSTOMER_ROUTES.CUSTOMERS, requireAuth, requireBusiness, async (context) => {
    const rows = await createDb()
      .select()
      .from(customers)
      .where(eq(customers.businessId, context.var.business.id))
      .orderBy(asc(sql`lower(${customers.name})`));
    return ok(context, rows.map(toCustomerResource));
  })

  .get(CUSTOMER_ROUTES.CUSTOMER, requireAuth, requireBusiness, async (context) => {
    const row = await findCustomer(createDb(), context.var.business.id, context.req.param("id"));
    return ok(context, toCustomerResource(row));
  })

  .post(
    CUSTOMER_ROUTES.CUSTOMERS,
    requireAuth,
    requireBusiness,
    validateJson(createCustomerSchema),
    async (context) => {
      const { name, phone = null, whatsappUsername = null, note = null } = context.req.valid("json");
      const businessId = context.var.business.id;
      const db = createDb();

      await assertPhoneAvailable(db, businessId, phone);
      await assertUsernameAvailable(db, businessId, whatsappUsername);

      const [created] = await db
        .insert(customers)
        .values({
          id: newId(),
          businessId,
          name,
          ...toPhoneColumns(phone),
          whatsappUsername,
          note,
        })
        .returning();

      return ok(context, toCustomerResource(created!), 201);
    },
  )

  .patch(
    CUSTOMER_ROUTES.CUSTOMER,
    requireAuth,
    requireBusiness,
    validateJson(updateCustomerSchema),
    async (context) => {
      const id = context.req.param("id");
      const { name, phone, whatsappUsername, note } = context.req.valid("json");
      const businessId = context.var.business.id;
      const db = createDb();

      await findCustomer(db, businessId, id);
      if (phone !== undefined) {
        await assertPhoneAvailable(db, businessId, phone, id);
      }
      if (whatsappUsername !== undefined) {
        await assertUsernameAvailable(db, businessId, whatsappUsername, id);
      }

      const [updated] = await db
        .update(customers)
        .set({
          ...(name !== undefined && { name }),
          ...(phone !== undefined && toPhoneColumns(phone)),
          ...(whatsappUsername !== undefined && { whatsappUsername }),
          ...(note !== undefined && { note }),
        })
        .where(and(eq(customers.id, id), eq(customers.businessId, businessId)))
        .returning();

      return ok(context, toCustomerResource(updated!));
    },
  )

  /* Hoy sin condiciones. Desde el 4b, solo si no tiene alquileres (RF-05). */
  .delete(CUSTOMER_ROUTES.CUSTOMER, requireAuth, requireBusiness, async (context) => {
    const id = context.req.param("id");
    const businessId = context.var.business.id;
    const db = createDb();

    await findCustomer(db, businessId, id);
    await db.delete(customers).where(and(eq(customers.id, id), eq(customers.businessId, businessId)));

    return ok(context, { id });
  });
