import { Hono } from "hono";

import type { TAppEnv } from "../lib/app-env";
import { ok } from "../lib/response";
import { requireAuth } from "../middleware/require-role";

export const ME_ROUTES = {
  ME: "/me",
} as const;

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
  });
