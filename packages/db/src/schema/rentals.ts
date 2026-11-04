import { relations, sql } from "drizzle-orm";
import { type AnySQLiteColumn, index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { profile, streamingAccount } from "./accounts";
import { user } from "./auth";
import { business } from "./businesses";
import { customers } from "./customers";

const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/**
 * Cada perfil alquilado a un cliente, con su precio, lo pagado y sus fechas. Sin cabecera de
 * orden: la orden es el cliente (acordado 2026-10-31). Renovar crea otro alquiler y marca este
 * (`renewed_by_id`); liberar lo cierra (`released_on`). Ver docs/planes/04b-alquileres.md.
 */
export const rentals = sqliteTable(
  "rentals",
  {
    id: text("id").primaryKey(),
    /* Si se borra el negocio, se van sus alquileres. */
    businessId: text("business_id")
      .notNull()
      .references(() => business.id, { onDelete: "cascade" }),
    /* `restrict`: no se borra un cliente con historial (RF-29). */
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    /*
      La cuenta alquilada (acordado 2026-11-04). Hoy siempre es la del perfil; mañana, para
      los clientes revendedores, un alquiler podrá ser de la cuenta entera, sin perfil.
      Opcional solo porque SQLite no deja agregar una columna obligatoria a una tabla que ya
      existe: la API la llena siempre. `restrict`, como el perfil.
    */
    accountId: text("account_id").references(() => streamingAccount.id, { onDelete: "restrict" }),
    /* `restrict`: no se borra un perfil (ni su cuenta) con alquileres (RF-30). */
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "restrict" }),
    /* Lo acordado, con el descuento, en soles con 2 decimales. */
    price: real("price").notNull(),
    /* Lo pagado hasta hoy. Un pago a medias se edita acá (RF-07d). */
    paidAmount: real("paid_amount").notNull(),
    /* Días sin hora, «2026-11-04», en hora de Perú, como las compras. */
    paidOn: text("paid_on"),
    /* La fecha que prometió para pagar, solo si debe (RF-07c). */
    payBy: text("pay_by"),
    startsOn: text("starts_on").notNull(),
    expiresOn: text("expires_on").notNull(),
    releasedOn: text("released_on"),
    /* El alquiler que lo renovó. Con esto lleno, ya es historial. */
    renewedById: text("renewed_by_id").references((): AnySQLiteColumn => rentals.id, {
      onDelete: "set null",
    }),
    /* Quién lo registró (RF-31). Si se borra el usuario, el alquiler queda. */
    createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    /* El listado del negocio, ordenado por lo que vence. */
    index("rentals_business_expiresOn_idx").on(table.businessId, table.expiresOn),
    /* Los alquileres de un cliente (su detalle y el bloqueo al eliminarlo). */
    index("rentals_customerId_idx").on(table.customerId),
    /* Si un perfil está ocupado y con quién (y el bloqueo al eliminarlo). */
    index("rentals_profileId_idx").on(table.profileId),
    /* Quiénes tienen una cuenta: avisar al cambiar sus accesos (4c) y el bloqueo al eliminarla. */
    index("rentals_accountId_idx").on(table.accountId),
  ],
);

export const rentalsRelations = relations(rentals, ({ one }) => ({
  business: one(business, { fields: [rentals.businessId], references: [business.id] }),
  customer: one(customers, { fields: [rentals.customerId], references: [customers.id] }),
  profile: one(profile, { fields: [rentals.profileId], references: [profile.id] }),
}));
