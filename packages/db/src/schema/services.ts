import { relations, sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { business } from "./businesses";

const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/**
 * Catálogo **global** de servicios (Netflix, Disney+…). Lo mantiene el superadmin. Crear un
 * servicio no lo activa en ningún negocio: eso vive en `business_service`.
 */
export const service = sqliteTable(
  "service",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    /* `toServiceNameKey(name)`: así «Netflix » y «netflix» chocan en el índice único. */
    nameKey: text("name_key").notNull(),
    profilesPerAccount: integer("profiles_per_account").notNull(),
    imageUrl: text("image_url"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("service_nameKey_uidx").on(table.nameKey)],
);

/**
 * Un servicio dentro de un negocio: si lo trabaja y sus dos precios, en soles. La fila se
 * crea la primera vez que se guarda algo; sin fila, el servicio está inactivo y sin precios.
 * Solo puede estar activo con los dos precios (lo valida el server).
 */
export const businessService = sqliteTable(
  "business_service",
  {
    id: text("id").primaryKey(),
    businessId: text("business_id")
      .notNull()
      .references(() => business.id, { onDelete: "cascade" }),
    serviceId: text("service_id")
      .notNull()
      .references(() => service.id, { onDelete: "restrict" }),
    isActive: integer("is_active", { mode: "boolean" }).default(false).notNull(),
    /** Lo que le cuesta una cuenta al negocio. */
    purchasePrice: real("purchase_price"),
    /** A cuánto alquila un perfil por un mes. */
    profilePrice: real("profile_price"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowMs).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("businessService_business_service_uidx").on(table.businessId, table.serviceId),
    index("businessService_serviceId_idx").on(table.serviceId),
  ],
);

export const serviceRelations = relations(service, ({ many }) => ({
  businessServices: many(businessService),
}));

export const businessServiceRelations = relations(businessService, ({ one }) => ({
  business: one(business, { fields: [businessService.businessId], references: [business.id] }),
  service: one(service, { fields: [businessService.serviceId], references: [service.id] }),
}));
