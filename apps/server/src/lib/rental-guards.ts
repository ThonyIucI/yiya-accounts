import { profile } from "@yiya/db/schema/accounts";
import { rentals } from "@yiya/db/schema/rentals";
import { count, eq } from "drizzle-orm";

import type { TDb } from "./account-queries";
import { conflict } from "./errors";

/**
 * Lo que no se elimina si tiene alquileres (RF-29, RF-30). Cuentan **todos**, también los
 * liberados y renovados: son el historial de lo cobrado, y la FK `restrict` tampoco dejaría.
 * El mensaje sale antes que el error de la base, en español.
 */

const pluralRentals = (total: number) => `${total} ${total === 1 ? "alquiler" : "alquileres"}`;

const totalOf = (row: { total: number } | undefined) => row?.total ?? 0;

export const assertCustomerWithoutRentals = async (db: TDb, customerId: string, name: string) => {
  const total = totalOf(
    await db.select({ total: count() }).from(rentals).where(eq(rentals.customerId, customerId)).get(),
  );
  if (total > 0) {
    throw conflict(`No puedes eliminar a «${name}»: tiene ${pluralRentals(total)}.`);
  }
};

export const assertAccountWithoutRentals = async (db: TDb, accountId: string) => {
  const total = totalOf(
    await db
      .select({ total: count() })
      .from(rentals)
      .innerJoin(profile, eq(profile.id, rentals.profileId))
      .where(eq(profile.accountId, accountId))
      .get(),
  );
  if (total > 0) {
    throw conflict(`No puedes eliminar esta cuenta: sus perfiles tienen ${pluralRentals(total)}.`);
  }
};

export const assertProfileWithoutRentals = async (db: TDb, profileId: string) => {
  const total = totalOf(
    await db.select({ total: count() }).from(rentals).where(eq(rentals.profileId, profileId)).get(),
  );
  if (total > 0) {
    throw conflict(`No puedes eliminar este perfil: tiene ${pluralRentals(total)}.`);
  }
};
