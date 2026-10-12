import { createDb } from "@yiya/db";
import { business, membership } from "@yiya/db/schema/businesses";
import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import type { TAppEnv } from "../lib/app-env";
import { forbidden } from "../lib/errors";

const NO_BUSINESS_MESSAGE =
  "Tu usuario todavía no tiene un negocio asignado. Pide acceso a quien te creó la cuenta.";
const INACTIVE_BUSINESS_MESSAGE =
  "Tu negocio está desactivado. Comunícate con quien te dio el acceso.";

/**
 * Deja en `c.var.business` el negocio de quien tiene la sesión. Va **después** de
 * `requireAuth`. Toda ruta con datos de un negocio filtra por `c.var.business.id`: el
 * negocio nunca sale del body ni de la URL, así nadie puede pedir los datos de otro.
 */
export const requireBusiness = createMiddleware<TAppEnv>(async (context, next) => {
  const db = createDb();
  const row = await db
    .select({
      id: business.id,
      name: business.name,
      isActive: business.isActive,
      role: membership.role,
    })
    .from(membership)
    .innerJoin(business, eq(business.id, membership.businessId))
    .where(eq(membership.userId, context.var.user.id))
    .get();

  if (!row) {
    throw forbidden(NO_BUSINESS_MESSAGE);
  }
  if (!row.isActive) {
    throw forbidden(INACTIVE_BUSINESS_MESSAGE);
  }

  context.set("business", { id: row.id, name: row.name, role: row.role });
  await next();
});
