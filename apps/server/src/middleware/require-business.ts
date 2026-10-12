import { createDb } from "@yiya/db";
import { user } from "@yiya/db/schema/auth";
import { business, membership } from "@yiya/db/schema/businesses";
import type { ICurrentBusiness } from "@yiya/shared/businesses";
import { EUserRole } from "@yiya/shared/roles";
import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";

import type { TAppEnv } from "../lib/app-env";
import { BUSINESS_LIST_ORDER } from "../lib/business-order";
import { forbidden } from "../lib/errors";

const NO_BUSINESS_MESSAGE =
  "Tu usuario todavía no tiene un negocio asignado. Pide acceso a quien te creó la cuenta.";
const INACTIVE_BUSINESS_MESSAGE =
  "Tu negocio está desactivado. Comunícate con quien te dio el acceso.";
const NO_BUSINESSES_YET_MESSAGE = "Todavía no hay negocios. Crea el primero en Negocios.";

type TDb = ReturnType<typeof createDb>;

const businessColumns = { id: business.id, name: business.name, isActive: business.isActive };

/** El dueño (o ayudante) entra al negocio de su membresía, y solo si está activo. */
const resolveMemberBusiness = async (db: TDb, userId: string): Promise<ICurrentBusiness> => {
  const row = await db
    .select({ ...businessColumns, role: membership.role })
    .from(membership)
    .innerJoin(business, eq(business.id, membership.businessId))
    .where(eq(membership.userId, userId))
    .get();

  if (!row) {
    throw forbidden(NO_BUSINESS_MESSAGE);
  }
  if (!row.isActive) {
    throw forbidden(INACTIVE_BUSINESS_MESSAGE);
  }
  return row;
};

/**
 * El superadmin **siempre** está dentro de un negocio: el que eligió en su menú lateral o,
 * si nunca eligió (o ese ya no existe), el primero de la lista, que queda guardado. Puede
 * entrar aunque el negocio esté desactivado. Solo falla cuando no existe ninguno.
 */
const resolveSuperadminBusiness = async (db: TDb, userId: string): Promise<ICurrentBusiness> => {
  const saved = await db
    .select(businessColumns)
    .from(user)
    .innerJoin(business, eq(business.id, user.activeBusinessId))
    .where(eq(user.id, userId))
    .get();
  if (saved) {
    return { ...saved, role: EUserRole.SUPERADMIN };
  }

  const first = await db
    .select(businessColumns)
    .from(business)
    .orderBy(...BUSINESS_LIST_ORDER)
    .limit(1)
    .get();
  if (!first) {
    throw forbidden(NO_BUSINESSES_YET_MESSAGE);
  }

  await db.update(user).set({ activeBusinessId: first.id }).where(eq(user.id, userId));
  return { ...first, role: EUserRole.SUPERADMIN };
};

/**
 * Deja en `c.var.business` el negocio en el que se está trabajando. Va **después** de
 * `requireAuth`. Toda ruta con datos de un negocio filtra por `c.var.business.id`: el
 * negocio sale del server (membresía o elección guardada del superadmin), nunca del body ni
 * de la URL, así nadie puede pedir los datos de otro.
 */
export const requireBusiness = createMiddleware<TAppEnv>(async (context, next) => {
  const db = createDb();
  const { id, role } = context.var.user;

  const current =
    role === EUserRole.SUPERADMIN
      ? await resolveSuperadminBusiness(db, id)
      : await resolveMemberBusiness(db, id);

  context.set("business", current);
  await next();
});
