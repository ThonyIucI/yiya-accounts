import { createDb } from "@yiya/db";
import { user } from "@yiya/db/schema/auth";
import { business } from "@yiya/db/schema/businesses";
import { EUserRole } from "@yiya/shared/roles";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { notFound } from "../lib/errors";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireAuth, requireSuperadmin } from "../middleware/require-role";

export const ME_ROUTES = {
  ME: "/me",
  ACTIVE_BUSINESS: "/me/active-business",
} as const;

const activeBusinessSchema = z.object({
  businessId: z.string("Elige un negocio.").min(1, "Elige un negocio."),
});

export const meRoutes = new Hono<TAppEnv>()
  /** Identidad del usuario autenticado. */
  .get(ME_ROUTES.ME, requireAuth, (context) => {
    const user = context.var.user;

    return ok(context, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  })

  /**
   * El superadmin elige en qué negocio trabaja (select de su menú lateral). Se guarda en su
   * usuario y desde ahí lo lee `requireBusiness`; las rutas del negocio nunca lo reciben.
   */
  .put(
    ME_ROUTES.ACTIVE_BUSINESS,
    requireSuperadmin,
    validateJson(activeBusinessSchema),
    async (context) => {
      const { businessId } = context.req.valid("json");
      const db = createDb();

      const chosen = await db
        .select({ id: business.id, name: business.name, isActive: business.isActive })
        .from(business)
        .where(eq(business.id, businessId))
        .get();
      if (!chosen) {
        throw notFound("No encontramos ese negocio.");
      }

      await db
        .update(user)
        .set({ activeBusinessId: chosen.id })
        .where(eq(user.id, context.var.user.id));

      return ok(context, { ...chosen, role: EUserRole.SUPERADMIN });
    },
  );
