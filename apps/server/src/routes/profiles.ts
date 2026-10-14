import { createDb } from "@yiya/db";
import { profile } from "@yiya/db/schema/accounts";
import {
  PROFILE_NAME_MAX_LENGTH,
  PROFILE_PIN_MESSAGE,
  PROFILE_PIN_PATTERN,
} from "@yiya/shared/accounts";
import { and, count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { type TDb, toProfileResource } from "../lib/account-queries";
import type { TAppEnv } from "../lib/app-env";
import { badRequest, notFound } from "../lib/errors";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireBusiness } from "../middleware/require-business";
import { requireAuth } from "../middleware/require-role";

export const PROFILE_ROUTES = {
  PROFILE: "/profiles/:id",
} as const;

const PROFILE_NOT_FOUND = "No encontramos ese perfil.";
const NO_CHANGES_MESSAGE = "No hay cambios para guardar.";
const LAST_PROFILE_MESSAGE = "La cuenta necesita al menos un perfil.";
const NAME_MESSAGE = "Escribe el nombre del perfil.";

const updateProfileSchema = z
  .object({
    name: z
      .string(NAME_MESSAGE)
      .trim()
      .min(1, NAME_MESSAGE)
      .max(PROFILE_NAME_MAX_LENGTH, "El nombre del perfil es demasiado largo.")
      .optional(),
    /* Vacío o `null` = sin PIN. */
    pin: z
      .string(PROFILE_PIN_MESSAGE)
      .trim()
      .refine((value) => value === "" || PROFILE_PIN_PATTERN.test(value), PROFILE_PIN_MESSAGE)
      .transform((value) => (value === "" ? null : value))
      .nullable()
      .optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: NO_CHANGES_MESSAGE,
  });

/** Un perfil de **este** negocio. El de otro da 404, como si no existiera. */
const findProfile = async (db: TDb, businessId: string, id: string) => {
  const row = await db
    .select()
    .from(profile)
    .where(and(eq(profile.id, id), eq(profile.businessId, businessId)))
    .get();
  if (!row) {
    throw notFound(PROFILE_NOT_FOUND);
  }
  return row;
};

/** Perfiles de una cuenta: nombre y PIN, y eliminar. Se crean desde la cuenta. */
export const profileRoutes = new Hono<TAppEnv>()
  .patch(
    PROFILE_ROUTES.PROFILE,
    requireAuth,
    requireBusiness,
    validateJson(updateProfileSchema),
    async (context) => {
      const id = context.req.param("id");
      const { name, pin } = context.req.valid("json");
      const businessId = context.var.business.id;
      const db = createDb();

      await findProfile(db, businessId, id);
      const [updated] = await db
        .update(profile)
        .set({ ...(name !== undefined && { name }), ...(pin !== undefined && { pin }) })
        .where(and(eq(profile.id, id), eq(profile.businessId, businessId)))
        .returning();

      return ok(context, toProfileResource(updated!));
    },
  )

  /* Desde el paso 4, tampoco si el perfil está alquilado. */
  .delete(PROFILE_ROUTES.PROFILE, requireAuth, requireBusiness, async (context) => {
    const id = context.req.param("id");
    const businessId = context.var.business.id;
    const db = createDb();

    const current = await findProfile(db, businessId, id);
    const siblings = await db
      .select({ total: count() })
      .from(profile)
      .where(eq(profile.accountId, current.accountId))
      .get();
    if ((siblings?.total ?? 0) <= 1) {
      throw badRequest(LAST_PROFILE_MESSAGE);
    }

    await db.delete(profile).where(and(eq(profile.id, id), eq(profile.businessId, businessId)));
    return ok(context, { id });
  });
