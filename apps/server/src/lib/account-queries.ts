import { createDb } from "@yiya/db";
import { accountPurchase, profile, streamingAccount } from "@yiya/db/schema/accounts";
import { provider } from "@yiya/db/schema/providers";
import { service } from "@yiya/db/schema/services";
import type { IAccountResource, IProfileResource } from "@yiya/shared/accounts";
import type { IPurchaseResource } from "@yiya/shared/purchases";
import { and, asc, desc, eq } from "drizzle-orm";

import { notFound } from "./errors";

/**
 * Consultas de cuentas que usan las rutas de cuentas y de perfiles. Todas filtran por el
 * negocio: una cuenta de otro negocio no existe.
 */

export type TDb = ReturnType<typeof createDb>;

export const ACCOUNT_NOT_FOUND = "No encontramos esa cuenta.";

type TProfileRow = typeof profile.$inferSelect;
type TPurchaseRow = typeof accountPurchase.$inferSelect;

export const toProfileResource = (row: TProfileRow): IProfileResource => ({
  id: row.id,
  name: row.name,
  pin: row.pin,
  position: row.position,
});

export const toPurchaseResource = (row: TPurchaseRow): IPurchaseResource => ({
  id: row.id,
  price: row.price,
  purchasedOn: row.purchasedOn,
  expiresOn: row.expiresOn,
});

/** Cuentas con su servicio y su proveedor (sin perfiles). Con `accountId`, solo esa. */
const selectAccounts = (db: TDb, businessId: string, accountId?: string) =>
  db
    .select({
      account: streamingAccount,
      service: { id: service.id, name: service.name, imageUrl: service.imageUrl },
      provider: { id: provider.id, name: provider.name },
    })
    .from(streamingAccount)
    .innerJoin(service, eq(service.id, streamingAccount.serviceId))
    .innerJoin(provider, eq(provider.id, streamingAccount.providerId))
    .where(
      and(
        eq(streamingAccount.businessId, businessId),
        accountId ? eq(streamingAccount.id, accountId) : undefined,
      ),
    )
    .orderBy(asc(streamingAccount.createdAt));

/**
 * Las cuentas del negocio con sus perfiles y sus compras, en **tres** consultas (cuentas,
 * perfiles y compras), no una por cuenta. La contraseña no sale nunca de acá.
 *
 * Trae todas las compras: con una por mes y cuenta, un negocio de 200 cuentas suma unas
 * 2400 al año. Si el listado se pone lento, que traiga solo la última y el detalle pida el
 * resto aparte.
 */
export const listAccounts = async (
  db: TDb,
  businessId: string,
  accountId?: string,
): Promise<IAccountResource[]> => {
  const rows = await selectAccounts(db, businessId, accountId);
  if (rows.length === 0) {
    return [];
  }

  /*
    Por negocio y no con `inArray(ids)`: D1 acepta como mucho 100 parámetros por consulta,
    y un negocio puede tener más de 100 cuentas.
  */
  const [profiles, purchases] = await Promise.all([
    db
      .select()
      .from(profile)
      .where(
        and(
          eq(profile.businessId, businessId),
          accountId ? eq(profile.accountId, accountId) : undefined,
        ),
      )
      .orderBy(asc(profile.position)),
    /* La más nueva primero: la de compra más reciente y, si empatan, la cargada después. */
    db
      .select()
      .from(accountPurchase)
      .where(
        and(
          eq(accountPurchase.businessId, businessId),
          accountId ? eq(accountPurchase.accountId, accountId) : undefined,
        ),
      )
      .orderBy(desc(accountPurchase.purchasedOn), desc(accountPurchase.createdAt)),
  ]);

  const profilesByAccount = Map.groupBy(profiles, (row) => row.accountId);
  const purchasesByAccount = Map.groupBy(purchases, (row) => row.accountId);

  return rows.map((row) => ({
    id: row.account.id,
    service: row.service,
    provider: row.provider,
    email: row.account.email,
    isActive: row.account.isActive,
    note: row.account.note,
    profiles: (profilesByAccount.get(row.account.id) ?? []).map(toProfileResource),
    purchases: (purchasesByAccount.get(row.account.id) ?? []).map(toPurchaseResource),
    createdAt: row.account.createdAt.toISOString(),
  }));
};

/** La fila de la cuenta (con su contraseña cifrada) de **este** negocio. La de otro da 404. */
export const findAccountRow = async (db: TDb, businessId: string, id: string) => {
  const row = await db
    .select()
    .from(streamingAccount)
    .where(and(eq(streamingAccount.id, id), eq(streamingAccount.businessId, businessId)))
    .get();
  if (!row) {
    throw notFound(ACCOUNT_NOT_FOUND);
  }
  return row;
};

/** Una cuenta de **este** negocio, con sus perfiles y sus compras. La de otro negocio da 404. */
export const findAccount = async (
  db: TDb,
  businessId: string,
  accountId: string,
): Promise<IAccountResource> => {
  const [found] = await listAccounts(db, businessId, accountId);
  if (!found) {
    throw notFound(ACCOUNT_NOT_FOUND);
  }
  return found;
};
