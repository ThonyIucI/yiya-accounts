import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { business } from "./businesses";

const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/**
 * Los clientes finales del negocio: a quién le alquila perfiles (paso 4b). Tabla en plural
 * (acordado 2026-10-30). El nombre se puede repetir; el número y el usuario de WhatsApp no.
 */
export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey(),
    /* Si se borra el negocio, se van sus clientes. */
    businessId: text("business_id")
      .notNull()
      .references(() => business.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /* Prefijo del país sin «+» («51»), como en `provider`. Va con `phone`. */
    countryPrefix: text("country_prefix"),
    /* Número nacional, solo dígitos. */
    phone: text("phone"),
    /* Como lo escribieron, sin «@». Se compara sin mayúsculas en el índice. */
    whatsappUsername: text("whatsapp_username"),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    /*
      Un número por negocio. En SQLite un índice único deja varios `NULL`: los clientes sin
      número no chocan. Empieza por `business_id`, así también sirve para listar.
    */
    uniqueIndex("customers_business_phone_uidx").on(
      table.businessId,
      table.countryPrefix,
      table.phone,
    ),
    /*
      Un usuario por negocio sin importar mayúsculas («Ana.pe» = «ana.pe»), sin una columna
      `_key` aparte. El usuario solo lleva letras ASCII, así que `lower()` alcanza.
    */
    uniqueIndex("customers_business_whatsappUsername_uidx").on(
      table.businessId,
      sql`lower(${table.whatsappUsername})`,
    ),
  ],
);

export const customersRelations = relations(customers, ({ one }) => ({
  business: one(business, { fields: [customers.businessId], references: [business.id] }),
}));
