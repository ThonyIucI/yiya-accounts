import { createDb } from "@yiya/db";
import { accountPurchase } from "@yiya/db/schema/accounts";
import { EXPIRES_BEFORE_PURCHASE_MESSAGE, LAST_PURCHASE_MESSAGE } from "@yiya/shared/purchases";
import { and, count, eq } from "drizzle-orm";
import { Hono } from "hono";

import { type TDb, findAccount, findAccountRow } from "../lib/account-queries";
import type { TAppEnv } from "../lib/app-env";
import { badRequest, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { isExpiryValid, purchasePatchSchema, purchaseSchema } from "../lib/purchase-input";
import { ok } from "../lib/response";
import { validateJson } from "../lib/validator";
import { requireBusiness } from "../middleware/require-business";
import { requireAuth } from "../middleware/require-role";

export const PURCHASE_ROUTES = {
  ACCOUNT_PURCHASES: "/accounts/:id/purchases",
  PURCHASE: "/purchases/:id",
} as const;

const PURCHASE_NOT_FOUND = "No encontramos esa compra.";

/** Una compra de **este** negocio. La de otro da 404, como si no existiera. */
const findPurchase = async (db: TDb, businessId: string, id: string) => {
  const row = await db
    .select()
    .from(accountPurchase)
    .where(and(eq(accountPurchase.id, id), eq(accountPurchase.businessId, businessId)))
    .get();
  if (!row) {
    throw notFound(PURCHASE_NOT_FOUND);
  }
  return row;
};

/**
 * Compras de una cuenta: renovar (una compra nueva), corregir y eliminar. Todas responden
 * la cuenta entera, así el listado y el detalle se ponen al día con el vencimiento nuevo.
 */
export const purchaseRoutes = new Hono<TAppEnv>()
  /* Renovar. También sirve para la primera compra de una cuenta anterior a las compras. */
  .post(
    PURCHASE_ROUTES.ACCOUNT_PURCHASES,
    requireAuth,
    requireBusiness,
    validateJson(purchaseSchema),
    async (context) => {
      const accountId = context.req.param("id");
      const businessId = context.var.business.id;
      const db = createDb();

      await findAccountRow(db, businessId, accountId);
      await db
        .insert(accountPurchase)
        .values({ id: newId(), businessId, accountId, ...context.req.valid("json") });

      return ok(context, await findAccount(db, businessId, accountId), 201);
    },
  )

  /* Corregir una compra mal cargada. */
  .patch(
    PURCHASE_ROUTES.PURCHASE,
    requireAuth,
    requireBusiness,
    validateJson(purchasePatchSchema),
    async (context) => {
      const id = context.req.param("id");
      const changes = context.req.valid("json");
      const businessId = context.var.business.id;
      const db = createDb();

      const current = await findPurchase(db, businessId, id);
      /* La fecha que no viene se compara con la guardada. */
      const purchasedOn = changes.purchasedOn ?? current.purchasedOn;
      const expiresOn = changes.expiresOn ?? current.expiresOn;
      if (!isExpiryValid(purchasedOn, expiresOn)) {
        throw badRequest(EXPIRES_BEFORE_PURCHASE_MESSAGE);
      }

      await db
        .update(accountPurchase)
        .set({
          ...(changes.price !== undefined && { price: changes.price }),
          purchasedOn,
          expiresOn,
        })
        .where(and(eq(accountPurchase.id, id), eq(accountPurchase.businessId, businessId)));

      return ok(context, await findAccount(db, businessId, current.accountId));
    },
  )

  /* La única compra de la cuenta no se elimina (RF-15d): se corrige. */
  .delete(PURCHASE_ROUTES.PURCHASE, requireAuth, requireBusiness, async (context) => {
    const id = context.req.param("id");
    const businessId = context.var.business.id;
    const db = createDb();

    const current = await findPurchase(db, businessId, id);
    const siblings = await db
      .select({ total: count() })
      .from(accountPurchase)
      .where(eq(accountPurchase.accountId, current.accountId))
      .get();
    if ((siblings?.total ?? 0) <= 1) {
      throw badRequest(LAST_PURCHASE_MESSAGE);
    }

    await db
      .delete(accountPurchase)
      .where(and(eq(accountPurchase.id, id), eq(accountPurchase.businessId, businessId)));

    return ok(context, await findAccount(db, businessId, current.accountId));
  });
