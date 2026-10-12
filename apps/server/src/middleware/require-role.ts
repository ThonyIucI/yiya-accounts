import { createMiddleware } from "hono/factory";

import { EUserRole, type TUserRole } from "@yiya/shared/roles";

import type { TAppEnv } from "../lib/app-env";
import { forbidden, unauthorized } from "../lib/errors";

/**
 * Lee la sesión desde la cookie con better-auth y la deja en `c.var.user` / `c.var.session`.
 * Falla con 401 si no hay sesión y con 403 si el rol no está permitido.
 */
const requireRoles = (isAllowed: (role: TUserRole) => boolean) =>
  createMiddleware<TAppEnv>(async (context, next) => {
    const auth = context.var.auth;
    const sessionData = await auth.api.getSession({ headers: context.req.raw.headers });

    if (!sessionData) {
      throw unauthorized();
    }

    const role = sessionData.user.role as TUserRole;
    if (!isAllowed(role)) {
      throw forbidden();
    }

    context.set("user", sessionData.user);
    context.set("session", sessionData.session);
    await next();
  });

/** Solo SUPERADMIN (dueño de la plataforma). */
export const requireSuperadmin = requireRoles((role) => role === EUserRole.SUPERADMIN);

/** Cualquier usuario autenticado. */
export const requireAuth = requireRoles(() => true);
