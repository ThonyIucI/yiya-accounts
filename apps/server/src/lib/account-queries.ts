import { createDb } from "@yiya/db";
import { profile, streamingAccount } from "@yiya/db/schema/accounts";
import { provider } from "@yiya/db/schema/providers";
import { service } from "@yiya/db/schema/services";
import type { IAccountResource, IProfileResource } from "@yiya/shared/accounts";
import { and, asc, eq } from "drizzle-orm";

import { notFound } from "./errors";

/**
 * Consultas de cuentas que usan las rutas de cuentas y de perfiles. Todas filtran por el
 * negocio: una cuenta de otro negocio no existe.
 */

export type TDb = ReturnType<typeof createDb>;

export const ACCOUNT_NOT_FOUND = "No encontramos esa cuenta.";

type TProfileRow = typeof profile.$inferSelect;

export const toProfileResource = (row: TProfileRow): IProfileResource => ({
  id: row.id,
  name: row.name,
  pin: row.pin,
  position: row.position,
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
 * Las cuentas del negocio con sus perfiles, en **dos** consultas (cuentas y perfiles), no
 * una por cuenta. La contraseña no sale nunca de acá.
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
  const profiles = await db
    .select()
    .from(profile)
    .where(
      and(
        eq(profile.businessId, businessId),
        accountId ? eq(profile.accountId, accountId) : undefined,
      ),
    )
    .orderBy(asc(profile.position));

  const profilesByAccount = Map.groupBy(profiles, (row) => row.accountId);

  return rows.map((row) => ({
    id: row.account.id,
    service: row.service,
    provider: row.provider,
    email: row.account.email,
    isActive: row.account.isActive,
    note: row.account.note,
    profiles: (profilesByAccount.get(row.account.id) ?? []).map(toProfileResource),
    createdAt: row.account.createdAt.toISOString(),
  }));
};

/** Una cuenta de **este** negocio, con sus perfiles. La de otro negocio da 404. */
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
