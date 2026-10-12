import { createDb } from "@yiya/db";
import { user } from "@yiya/db/schema/auth";
import { business, membership } from "@yiya/db/schema/businesses";
import {
  BUSINESS_NAME_MAX_LENGTH,
  BUSINESS_NAME_MIN_LENGTH,
  EBusinessRole,
  type IBusinessResource,
} from "@yiya/shared/businesses";
import { EUserRole } from "@yiya/shared/roles";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { BUSINESS_LIST_ORDER } from "../lib/business-order";
import { badRequest, conflict, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireBusiness } from "../middleware/require-business";
import { requireAuth, requireSuperadmin } from "../middleware/require-role";

export const BUSINESS_ROUTES = {
  BUSINESSES: "/businesses",
  BUSINESS: "/businesses/:id",
  MY_BUSINESS: "/my-business",
} as const;

const BUSINESS_NOT_FOUND = "No encontramos ese negocio.";

const nameSchema = z
  .string()
  .trim()
  .min(BUSINESS_NAME_MIN_LENGTH, "El nombre del negocio es demasiado corto.")
  .max(BUSINESS_NAME_MAX_LENGTH, "El nombre del negocio es demasiado largo.");

const createBusinessSchema = z.object({
  name: nameSchema,
  ownerId: z.string("Elige al dueño del negocio.").min(1, "Elige al dueño del negocio."),
});

const updateBusinessSchema = z
  .object({
    name: nameSchema.optional(),
    isActive: z.boolean("Indica si el negocio está activo.").optional(),
  })
  .refine((body) => body.name !== undefined || body.isActive !== undefined, {
    message: "No hay cambios para guardar.",
  });

type TDb = ReturnType<typeof createDb>;

/** Negocios con su dueño, del más nuevo al más viejo. Con `id`, solo ese. */
const selectBusinesses = (db: TDb, id?: string) =>
  db
    .select({ business, ownerId: user.id, ownerName: user.name, ownerEmail: user.email })
    .from(business)
    .leftJoin(
      membership,
      and(eq(membership.businessId, business.id), eq(membership.role, EBusinessRole.OWNER)),
    )
    .leftJoin(user, eq(user.id, membership.userId))
    .where(id ? eq(business.id, id) : undefined)
    .orderBy(...BUSINESS_LIST_ORDER);

type TBusinessRow = Awaited<ReturnType<typeof selectBusinesses>>[number];

const toBusinessResource = (row: TBusinessRow): IBusinessResource => ({
  id: row.business.id,
  name: row.business.name,
  isActive: row.business.isActive,
  owner:
    row.ownerId && row.ownerName && row.ownerEmail
      ? { id: row.ownerId, name: row.ownerName, email: row.ownerEmail }
      : null,
  createdAt: row.business.createdAt.toISOString(),
});

const findBusinessResource = async (db: TDb, id: string): Promise<IBusinessResource> => {
  const [row] = await selectBusinesses(db, id);
  if (!row) {
    throw notFound(BUSINESS_NOT_FOUND);
  }
  return toBusinessResource(row);
};

/** El dueño tiene que existir, ser USER y no tener negocio (un usuario, un negocio). */
const assertAvailableOwner = async (db: TDb, ownerId: string) => {
  const owner = await db.select({ role: user.role }).from(user).where(eq(user.id, ownerId)).get();
  if (!owner) {
    throw notFound("No encontramos al usuario elegido como dueño.");
  }
  if (owner.role !== EUserRole.USER) {
    throw badRequest("Un superadministrador no puede ser dueño de un negocio.");
  }

  const current = await db
    .select({ name: business.name })
    .from(membership)
    .innerJoin(business, eq(business.id, membership.businessId))
    .where(eq(membership.userId, ownerId))
    .get();
  if (current) {
    throw conflict(`Ese usuario ya es parte del negocio «${current.name}».`);
  }
};

/**
 * Negocios. El SUPERADMIN los crea (con su dueño), los renombra y los activa/desactiva; no
 * se borran. `GET /my-business` dice en qué negocio se está trabajando: el del dueño, o el
 * que el superadmin eligió en su menú lateral.
 */
export const businessRoutes = new Hono<TAppEnv>()
  .get(BUSINESS_ROUTES.BUSINESSES, requireSuperadmin, async (context) => {
    const rows = await selectBusinesses(createDb());
    return ok(context, rows.map(toBusinessResource));
  })

  .post(
    BUSINESS_ROUTES.BUSINESSES,
    requireSuperadmin,
    validateJson(createBusinessSchema),
    async (context) => {
      const { name, ownerId } = context.req.valid("json");
      const db = createDb();

      await assertAvailableOwner(db, ownerId);

      const businessId = newId();
      await db.batch([
        db.insert(business).values({ id: businessId, name }),
        db
          .insert(membership)
          .values({ id: newId(), businessId, userId: ownerId, role: EBusinessRole.OWNER }),
      ]);

      return ok(context, await findBusinessResource(db, businessId), 201);
    },
  )

  .patch(
    BUSINESS_ROUTES.BUSINESS,
    requireSuperadmin,
    validateJson(updateBusinessSchema),
    async (context) => {
      const id = context.req.param("id");
      const changes = context.req.valid("json");
      const db = createDb();

      const updated = await db
        .update(business)
        .set(changes)
        .where(eq(business.id, id))
        .returning({ id: business.id });
      if (updated.length === 0) {
        throw notFound(BUSINESS_NOT_FOUND);
      }

      return ok(context, await findBusinessResource(db, id));
    },
  )

  .get(BUSINESS_ROUTES.MY_BUSINESS, requireAuth, requireBusiness, (context) =>
    ok(context, context.var.business),
  );
