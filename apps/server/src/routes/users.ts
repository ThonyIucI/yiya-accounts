import { createDb } from "@yiya/db";
import { user } from "@yiya/db/schema/auth";
import { USER_MIN_PASSWORD_LENGTH, type IUserResource } from "@yiya/shared/users";
import { zValidator } from "@hono/zod-validator";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { TAppEnv } from "../lib/app-env";
import { conflict } from "../lib/errors";
import { ok } from "../lib/response";
import { requireSuperadmin } from "../middleware/require-role";

export const USER_ROUTES = {
  USERS: "/users",
} as const;

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Nombre demasiado corto."),
  email: z.email("Correo inválido.").transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(USER_MIN_PASSWORD_LENGTH, "La contraseña debe tener al menos 8 caracteres."),
});

const toUserResource = (row: typeof user.$inferSelect): IUserResource => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  createdAt: row.createdAt.toISOString(),
});

/**
 * Usuarios de la plataforma. Solo el SUPERADMIN los ve y los crea: no hay registro público.
 * Por ahora todo usuario nuevo es USER; cuando existan negocios se le asignará el suyo.
 */
export const userRoutes = new Hono<TAppEnv>()
  .get(USER_ROUTES.USERS, requireSuperadmin, async (context) => {
    const db = createDb();
    const rows = await db.select().from(user).orderBy(desc(user.createdAt));

    return ok(context, rows.map(toUserResource));
  })

  .post(
    USER_ROUTES.USERS,
    requireSuperadmin,
    zValidator("json", createUserSchema),
    async (context) => {
      const { name, email, password } = context.req.valid("json");
      const db = createDb();

      const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).get();
      if (existing) {
        throw conflict("Ya existe un usuario con ese correo.");
      }

      // `role` no se pasa: better-auth le pone USER por defecto y el cliente no puede cambiarlo.
      const { user: created } = await context.var.auth.api.signUpEmail({
        body: { name, email, password },
      });

      const row = await db.select().from(user).where(eq(user.id, created.id)).get();
      if (!row) {
        throw new Error(`Usuario recién creado no encontrado: ${created.id}`);
      }

      return ok(context, toUserResource(row), 201);
    },
  );
