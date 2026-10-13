import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { business } from "./businesses";

const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/**
 * A quién le compra cuentas el negocio. No dice qué servicios vende: eso sale de sus
 * cuentas (paso 3). Se elimina solo si no tiene cuentas.
 */
export const provider = sqliteTable(
  "provider",
  {
    id: text("id").primaryKey(),
    /* Si se borra el negocio, se van sus proveedores. */
    businessId: text("business_id")
      .notNull()
      .references(() => business.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /*
      `toProviderNameKey(name)`: el nombre sin mayúsculas ni espacios de más. El índice
      único de SQLite distingue mayúsculas y su `lower()` / `NOCASE` no entienden tildes
      («ÁNGEL» ≠ «ángel»); con esta columna «Juan Pérez» y «juan pérez » chocan.
    */
    nameKey: text("name_key").notNull(),
    /* Prefijo del país sin «+» («51»), como `country_code` en id-pos. Va con `phone`. */
    countryPrefix: text("country_prefix"),
    /* Número nacional, solo dígitos. */
    phone: text("phone"),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  /* Un nombre por negocio; empieza por `business_id`, así también sirve para listar. */
  (table) => [uniqueIndex("provider_business_nameKey_uidx").on(table.businessId, table.nameKey)],
);

export const providerRelations = relations(provider, ({ one }) => ({
  business: one(business, { fields: [provider.businessId], references: [business.id] }),
}));
